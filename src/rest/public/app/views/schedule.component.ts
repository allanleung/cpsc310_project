import { Component } from '@angular/core';

import { QueryService } from '../query.service';
import { ModalService } from "../modal/modal.service";
import { ModalComponent } from "../modal/modal.component";
import { GeoPoint } from "../models/GeoPoint";

@Component({
    selector: 'schedule',
    template: `
<div class="row">
    <!-- Rooms -->

    <div class="col-md-3">
        <h3>Rooms Order By</h3>
        <order-selector [order]="rooms_order"></order-selector>
    </div>

    <div class="col-md-3">
        <h3>Rooms Filters</h3>
        <filter-selector [filterJunction]="rooms_filterJunction" [filters]="rooms_filters"></filter-selector>
    </div>
    
    <!-- Courses -->
    
    <div class="col-md-3">
        <h3>Courses Order By</h3>
        <order-selector [order]="courses_order"></order-selector>
    </div>

    <div class="col-md-3">
        <h3>Courses Filters</h3>
        <filter-selector [filterJunction]="courses_filterJunction" [filters]="courses_filters"></filter-selector>
    </div>
</div>

<div class="row">
    <button type="button" class="btn btn-primary" (click)="query()">Query</button>
</div>

<scheduling [sections]="courses_results" [rooms]="rooms_results"></scheduling>
`
})
export class ScheduleComponent {
    rooms_columns: any;
    rooms_order: any;
    rooms_filterJunction: string;
    rooms_filters: any[];
    rooms_results: any[];

    courses_columns: any;
    courses_order: any;
    courses_filterJunction: string;
    courses_filters: any[];
    courses_results: any[];

    constructor (private queryService: QueryService, private modalService: ModalService) {
        this.rooms_columns = [
            {
                name: "rooms_fullname",
                value: true
            },
            {
                name: "rooms_shortname",
                value: true
            },
            {
                name: "rooms_name",
                value: true
            },
            {
                name: "rooms_number",
                value: true
            },
            {
                name: "rooms_address",
                value: true
            },
            {
                name: "rooms_lat",
                value: true
            },
            {
                name: "rooms_lon",
                value: true
            },
            {
                name: "rooms_seats",
                value: true
            },
            {
                name: "rooms_type",
                value: true
            },
            {
                name: "rooms_furniture",
                value: true
            },
            {
                name: "rooms_href",
                value: true
            }
        ];

        this.rooms_order = {
            dir: "UP",
            keys: [
                {
                    name: "rooms_seats",
                    value: true
                },
                {
                    name: "rooms_name",
                    value: false
                }
            ]
        };

        this.rooms_filterJunction = "AND";

        this.rooms_filters = [
            {
                name: "rooms_fullname",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "rooms_shortname",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "location_distance (lat,lon,dist)",
                type: "location",
                comparator: "",
                value: "",
                template: (self: any) => {
                    if (self.value.split(',').length !== 3) {
                        throw "Invalid query";
                    }

                    let lat: number = parseFloat(self.value.split(',')[0]);
                    let lon: number = parseFloat(self.value.split(',')[1]);
                    let dist: number = parseFloat(self.value.split(',')[2])/1000;

                    if (isNaN(lat) || isNaN(lon) || isNaN(dist)) {
                        throw "Invalid query";
                    }

                    let point = new GeoPoint(lat, lon, false);
                    let boundingBox = point.boundingCoordinates(dist, 0, true);

                    let boxQuery: any = {
                        "AND": [
                            {
                                "GT": {
                                    "rooms_lat": boundingBox[0].degLat
                                }
                            },
                            {
                                "LT": {
                                    "rooms_lat": boundingBox[1].degLat
                                }
                            },
                            {
                                "LT": {
                                    "rooms_lon": boundingBox[1].degLon
                                }
                            },
                            {
                                "GT": {
                                    "rooms_lon": boundingBox[0].degLon
                                }
                            }
                        ]
                    };

                    if (self.comparator === "OUT") {
                        boxQuery = {
                            "NOT": boxQuery
                        }
                    }

                    return boxQuery;
                }
            }
        ];

        this.rooms_results = [];


        this.courses_order = {
            dir: "UP",
            keys: [
                {
                    name: "courses_id",
                    value: true
                },
                {
                    name: "courses_pass",
                    value: false
                },
                {
                    name: "courses_fail",
                    value: false
                }
            ]
        };

        this.courses_columns = [
            {
                name: "courses_dept",
                value: true
            },
            {
                name: "courses_id",
                value: true
            },
            {
                name: "courses_avg",
                value: true
            },
            {
                name: "courses_instructor",
                value: true
            },
            {
                name: "courses_title",
                value: true
            },
            {
                name: "courses_pass",
                value: true
            },
            {
                name: "courses_fail",
                value: true
            },
            {
                name: "courses_audit",
                value: true
            },
            {
                name: "courses_uuid",
                value: true
            },
            {
                name: "courses_year",
                value: true
            }
        ];

        this.courses_filterJunction = "AND";

        this.courses_filters = [
            {
                name: "courses_dept",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_id",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_year",
                type: "number",
                comparator: "",
                value: ""
            }
        ];

        this.courses_results = [];
    }

    query(): void {
        let rooms_query: any;
        let courses_query: any;
        try {
            rooms_query = this.queryService.compose(this.rooms_filters, this.rooms_filterJunction, this.rooms_columns, this.rooms_order);
            courses_query = this.queryService.compose(this.courses_filters, this.courses_filterJunction, this.courses_columns, this.courses_order);
        } catch(error) {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: "Invalid data format, query could not be composed"
            });

            return;
        }

        Promise.all([
            this.queryService.search(rooms_query),
            this.queryService.search(courses_query)
        ]).then(results => {
            this.rooms_results = results[0].result;
            this.courses_results = results[1].result;

            if (this.rooms_results.length === 0 || this.courses_results.length === 0) {
                this.modalService.create(ModalComponent, {
                    title: "Query Error",
                    body: "No results found"
                });
            }
        }).catch(error => {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: error._body
            });
        });
    }
}



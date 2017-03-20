import { Component } from '@angular/core';

import { QueryService } from './query.service';
import { ModalService } from "./modal/modal.service";
import { ModalComponent } from "./modal/modal.component";
import { GeoPoint } from "./GeoPoint";

@Component({
    selector: 'schedule',
    template: `
<div class="row">
    <!-- Rooms -->

    <div class="col-md-3">
        <h3>Rooms Order By</h3>
        <select class="form-control" [(ngModel)]="rooms_order.dir">
            <option>UP</option>
            <option>DOWN</option>
        </select>

        <ol class="unstyled">
            <li *ngFor="let item of rooms_order.keys">
                <label class="checkbox">
                    <input [(ngModel)]="item.value" type="checkbox" (change)="orderKeysRoom()">
                    <span>{{item.name}}</span>
                </label>
            </li>
        </ol>
    </div>

    <div class="col-md-3">
        <h3>Rooms Filters</h3>
        <select class="form-control" [(ngModel)]="rooms_filterJunction">
            <option>AND</option>
            <option>OR</option>
        </select>

        <div *ngFor="let filter of rooms_filters;"class="form-group">
            <label>{{filter.name}}</label>
            <div class="row">
                <div class="col-md-8">
                    <input class="form-control" [(ngModel)]="filter.value">
                </div>
                <div class="col-md-4">
                    <select class="form-control" [(ngModel)]="filter.comparator">
                        <option *ngFor="let comparator of comparators(filter.type);">{{comparator}}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Courses -->
    
    <div class="col-md-3">
        <h3>Courses Order By</h3>
        <select class="form-control" [(ngModel)]="courses_order.dir">
            <option>UP</option>
            <option>DOWN</option>
        </select>

        <ol class="unstyled">
            <li *ngFor="let item of courses_order.keys">
                <label class="checkbox">
                    <input [(ngModel)]="item.value" type="checkbox" (change)="orderKeysCourses()">
                    <span>{{item.name}}</span>
                </label>
            </li>
        </ol>
    </div>

    <div class="col-md-3">
        <h3>Courses Filters</h3>
        <select class="form-control" [(ngModel)]="courses_filterJunction">
            <option>AND</option>
            <option>OR</option>
        </select>

        <div *ngFor="let filter of courses_filters;"class="form-group">
            <label>{{filter.name}}</label>
            <div class="row">
                <div class="col-md-8">
                    <input class="form-control" [(ngModel)]="filter.value">
                </div>
                <div class="col-md-4">
                    <select class="form-control" [(ngModel)]="filter.comparator">
                        <option *ngFor="let comparator of comparators(filter.type);">{{comparator}}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <button type="button" class="btn btn-primary" (click)="query()">Query</button>
</div>

<query-results [columns]="rooms_columns" [results]="rooms_results"></query-results>
<query-results [columns]="courses_columns" [results]="courses_results"></query-results>
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

        // <option *ngFor> doesn't like to cooperate during the initial render
        this.rooms_filters = this.rooms_filters.map((filter: any) => {
            return {
                name: filter.name,
                type: filter.type,
                comparator: this.comparators(filter.type)[0],
                value: filter.value,
                template: filter.template
            }
        });

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
                type: "number",
                comparator: "",
                value: ""
            }
        ];

        // <option *ngFor> doesn't like to cooperate during the initial render
        this.courses_filters = this.courses_filters.map((filter: any) => {
            return {
                name: filter.name,
                type: filter.type,
                comparator: this.comparators(filter.type)[0],
                value: filter.value
            }
        });

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

    orderKeysRoom() {
        this.rooms_order.keys = [...this.rooms_order.keys.filter((item: any) => {
            return item.value;
        }), ...this.rooms_order.keys.filter((item: any) => {
            return !item.value;
        })];
    }

    orderKeysCourses() {
        this.courses_order.keys = [...this.courses_order.keys.filter((item: any) => {
            return item.value;
        }), ...this.courses_order.keys.filter((item: any) => {
            return !item.value;
        })];
    }

    comparators(type: string): string[] {
        return type === "string" ? [ "IS" ] : type === "number" ? [ "LT", "EQ", "GT" ] : [ "IN", "OUT" ]
    }
}



import { Component } from '@angular/core';

import { QueryService } from '../query.service';
import { ModalService } from "../modal/modal.service";
import { ModalComponent } from "../modal/modal.component";
import { GeoPoint } from "../models/GeoPoint";

@Component({
    selector: 'rooms',
    template: `
<div class="row">
    <div class="col-md-4">
        <h3>Select Columns</h3>
        <column-selector [columns]="columns"></column-selector>
    </div>

    <div class="col-md-4">
        <h3>Order By</h3>
        <order-selector [order]="order"></order-selector>
    </div>

    <div class="col-md-4">
        <h3>Filters</h3>
        <filter-selector [filterJunction]="filterJunction" [filters]="filters"></filter-selector>
    </div>
</div>

<div class="row">
    <button type="button" class="btn btn-primary btn-lg btn-block" (click)="query()">Query</button>
</div>

<hr>

<div [hidden]="!showMap()" class="row">
    <rooms-map [rooms]="results"></rooms-map>
</div>

<query-results [columns]="columns" [results]="results"></query-results>
`
})
export class RoomsComponent {
    columns: any;
    order: any;
    filterJunction: string;
    filters: any[];
    results: any[];
    
    showMap(): boolean {
        return this.columns.reduce((show: boolean, column: any) => {
            return show && ((column.name === 'rooms_lat' || column.name === 'rooms_lon') ? column.value : true);
        }, true);
    }

    constructor (private queryService: QueryService, private modalService: ModalService) {
        this.order = {
            dir: "UP",
            keys: [
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
                    name: "rooms_name",
                    value: false
                }
            ]
        };

        this.columns = [
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

        this.filterJunction = "AND";

        this.filters = [
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
                name: "rooms_seats",
                type: "number",
                comparator: "",
                value: ""
            },
            {
                name: "rooms_furniture",
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
                        throw "Invalid data format for " + self.name;
                    }

                    let lat: number = parseFloat(self.value.split(',')[0]);
                    let lon: number = parseFloat(self.value.split(',')[1]);
                    let dist: number = parseFloat(self.value.split(',')[2])/1000;

                    if (isNaN(lat) || isNaN(lon) || isNaN(dist)) {
                        throw "Invalid data type for " + self.name;
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

        this.results = [];
    }

    query(): void {
        let query: any;
        try {
            query = this.queryService.compose(this.filters, this.filterJunction, this.columns, this.order);
        } catch(error) {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: error
            });

            return;
        }

        this.queryService
            .search(query)
            .then(results => {
                this.results = results.result;

                if (this.results.length === 0) {
                    this.modalService.create(ModalComponent, {
                        title: "Query Error",
                        body: "No results found"
                    });
                }
            })
            .catch(error => {
                this.modalService.create(ModalComponent, {
                    title: "Query Error",
                    body: error._body
                });
            });
    }
}



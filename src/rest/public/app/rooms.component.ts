import { Component } from '@angular/core';

import { QueryService } from './query.service';
import { ModalService } from "./modal/modal.service";
import { ModalComponent } from "./modal/modal.component";
import { GeoPoint } from "./GeoPoint";

@Component({
    selector: 'rooms',
    template: `
<div class="row">
    <div class="col-md-4">
        <h3>Select Columns</h3>
        <ul class="unstyled">
            <li *ngFor="let column of columns;">
                <label class="checkbox">
                    <input [(ngModel)]="column.value" type="checkbox">
                    <span>{{column.name}}</span>
                </label>
            </li>
        </ul>
    </div>

    <div class="col-md-4">
        <h3>Order By</h3>
        <select class="form-control" [(ngModel)]="order.dir">
            <option>UP</option>
            <option>DOWN</option>
        </select>

        <ol class="unstyled">
            <li *ngFor="let item of order.keys">
                <label class="checkbox">
                    <input [(ngModel)]="item.value" type="checkbox" (change)="orderKeys()">
                    <span>{{item.name}}</span>
                </label>
            </li>
        </ol>
    </div>

    <div class="col-md-4">
        <h3>Filters</h3>
        <select class="form-control" [(ngModel)]="filterJunction">
            <option>AND</option>
            <option>OR</option>
        </select>

        <div *ngFor="let filter of filters;"class="form-group">
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

<query-results [columns]="columns" [results]="results"></query-results>
`
})
export class RoomsComponent {
    columns: any;
    order: any;
    filterJunction: string;
    filters: any[];
    results: any[];

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
        this.filters = this.filters.map((filter: any) => {
            return {
                name: filter.name,
                type: filter.type,
                comparator: this.comparators(filter.type)[0],
                value: filter.value,
                template: filter.template
            }
        });

        this.results = [];
    }

    query(): void {
        let query: any;
        try {
            query = this.queryService.compose(this.filters, this.filterJunction, this.columns, this.order);
        } catch(error) {
            this.modalService.create(ModalComponent, {
                title: "Query Error",
                body: "Invalid data format, query could not be composed"
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

    orderKeys() {
        this.order.keys = [...this.order.keys.filter((item: any) => {
            return item.value;
        }), ...this.order.keys.filter((item: any) => {
            return !item.value;
        })];
    }

    comparators(type: string): string[] {
        return type === "string" ? [ "IS" ] : type === "number" ? [ "LT", "EQ", "GT" ] : [ "IN", "OUT" ]
    }
}



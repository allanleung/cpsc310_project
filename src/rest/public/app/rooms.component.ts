import { Component } from '@angular/core';
import { QueryService } from './query.service';

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

    constructor (private queryService: QueryService) {
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
                name: "rooms_name",
                type: "string",
                comparator: "",
                value: ""
            }
        ];

        // <option *ngFor> doesn't like to cooperate during the initial render
        this.filters = this.filters.map((filter: any) => {
            return {
                name: filter.name,
                type: filter.type,
                comparator: this.comparators(filter.type)[0],
                value: filter.value
            }
        });

        this.results = [];
    }

    query(): void {
        let innerFilter: any = this.filters.filter((filter: any) => {
            return filter.value.length !== 0;
        }).map((filter: any) => {
            let value: number | string = filter.value;
            
            if (filter.type === "number") {
                value = parseFloat(filter.value);
            }
            
            return {
                [filter.comparator]: {
                    [filter.name]: value
                }
            }
        });

        let innerWhere = innerFilter.length === 0 ? { } : {
            [this.filterJunction]: innerFilter
        };

        this.queryService
            .search({
                "WHERE": innerWhere,
                "OPTIONS": {
                    "COLUMNS": this.columns.filter((item: any) => {
                        return item.value;
                    }).map((item: any) => {
                        return item.name;
                    }),
                    "ORDER": {
                        "dir": this.order.dir,
                        "keys": this.order.keys.filter((item: any) => {
                            return item.value;
                        }).map((item: any) => {
                            return item.name;
                        })
                    },
                    "FORM": "TABLE"
                }
            })
            .then(results => {
                this.results = results.result;
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
        return type === "string" ? [ "IS" ] : [ "LT", "EQ", "GT" ]
    }
}



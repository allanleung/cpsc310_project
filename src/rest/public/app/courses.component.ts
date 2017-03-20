import { Component }    from '@angular/core';

import { QueryService } from './query.service';
import { ModalService } from "./modal/modal.service";
import { ModalComponent } from './modal/modal.component';

@Component({
    selector: 'courses',
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
export class CoursesComponent {
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
                    name: "courses_avg",
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

        this.columns = [
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

        this.filterJunction = "AND";

        this.filters = [
            {
                name: "courses_instructor",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_title",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_dept",
                type: "string",
                comparator: "",
                value: ""
            },
            {
                name: "courses_pass",
                type: "number",
                comparator: "",
                value: ""
            },
            {
                name: "courses_fail",
                type: "number",
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
                        title: "Query",
                        body: "No rooms_results found"
                    });
                }
            }).catch(error => {
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
        return type === "string" ? [ "IS" ] : [ "LT", "EQ", "GT" ]
    }
}



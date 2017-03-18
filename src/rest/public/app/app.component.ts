import { Component } from '@angular/core';
import { QueryService } from './query.service';

/**
Course explorer (20%): provide a usable interface for interacting with the courses dataset. It should be possible to query sections by various properties:
Section size
Department
Course number
Instructor
Title

order by average, sections, passes, fails
filterable by department, course number, course titles, and size thresholds.
 */

@Component({
    selector: 'my-app',
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

    </div>
</div>

<div class="row">
    <button (click)="query()">Query</button>
</div>

<div class="row">
    <table class="table table-hover">
        <thead>
            <tr>
                <th *ngFor="let column of visibleColumns();">{{column}}</th>
            </tr>
        </thead>
        <tbody>
            <tr *ngFor="let result of results;">
                <th *ngFor="let column of visibleColumns();">{{result[column]}}</th>
            </tr>
        </tbody>
    </table>
</div>
`
})
export class AppComponent {
    columns: any;
    results: any[];
    order: any;

    constructor (private queryService: QueryService) {
        this.order = {
            dir: "UP",
            keys: [
                { 
                    name: "courses_avg",
                    value: false
                },
                { 
                    name: "?_section_size_?",
                    value: false
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
        }

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

        this.results = [];
    }

    query(): void {
        this.queryService
            .search({
                "WHERE": {
                    "OR":[
                        {
                            "AND":[
                                {
                                    "GT":{
                                        "courses_avg":90
                                    }
                                },
                                {
                                    "IS":{
                                        "courses_dept":"adhe"
                                    }
                                }
                            ]
                        },
                        {
                            "EQ":{
                                "courses_avg":95
                            }
                        }
                    ]
                },
                "OPTIONS": {
                    "COLUMNS": this.columns.filter((item: any) => {
                        return item.value;
                    }).map((item: any) => {
                        return item.name;
                    }),
                    "ORDER": {
                        "dir": "UP",
                        "keys": this.order.keys.filter((item: any) => {
                            return item.value;
                        }).map((item: any) => {
                            return item.name;
                        })
                    },
                    "FORM": "TABLE"
                },
                "TRANSFORMATIONS": {}
            })
            .then(results => {
                this.results = results.result;
            });
    }

    visibleColumns(): string[] {
        return this.columns.filter((item: any) => {
            return item.value;
        }).map((item: any) => {
            return item.name;
        });
    }

    orderKeys() {
        this.order.keys = [...this.order.keys.filter((item: any) => {
            return item.value;
        }), ...this.order.keys.filter((item: any) => {
            return !item.value;
        })];
    }
}



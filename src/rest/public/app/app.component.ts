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
<h3>Select Columns</h3>
<ul class="unstyled">
    <li *ngFor="let column of columnsKeys();">
        <label class="checkbox">
            <input [(ngModel)]="columns[column]" type="checkbox">
            <span>{{column}}</span>
        </label>
    </li>
</ul>

<h3>Order By</h3>
<ul class="unstyled">
    <li *ngFor="let item of order.keys">
        <label class="checkbox">
            <input [(ngModel)]="item.value" type="checkbox" (change)="orderKeys()">
            <span>{{item.name}}</span>
        </label>
    </li>
</ul>

<button (click)="query()">Query</button>

<table class="table table-hover">
    <thead>
        <tr>
            <th *ngFor="let column of columnsVisibleKeys();">{{column}}</th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let result of results;">
            <th *ngFor="let column of columnsVisibleKeys();">{{result[column]}}</th>
        </tr>
    </tbody>
</table>
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

        this.columns = {
            "courses_dept": true,
            "courses_id": true,
            "courses_avg": true,
            "courses_instructor": true,
            "courses_title": true,
            "courses_pass": true,
            "courses_fail": true,
            "courses_audit": true,
            "courses_uuid": true,
            "courses_year": true
        };

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
                    "COLUMNS": Object.keys(this.columns).filter(e => {
                        return this.columns[e];
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
                }
            })
            .then(results => {
                this.results = results.result;
            });
    }

    columnsKeys(): string[] {
        return Object.keys(this.columns);
    }

    columnsVisibleKeys(): string[] {
        return Object.keys(this.columns).filter(item => {
            return this.columns[item];
        });
    }

    orderKeys() {
        this.order.keys = [...this.order.keys.filter((item: any) => {
            return item.value;
        }), ...this.order.keys.filter((item: any) => {
            return !item.value;
        })]
    }
}



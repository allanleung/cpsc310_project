import { Component } from '@angular/core';
import { QueryService } from './query.service';

@Component({
    selector: 'my-app',
    template: `
<ul class="unstyled">
    <li *ngFor="let column of keys();">
        <label class="checkbox">
            <input [(ngModel)]="columns[column]" type="checkbox">
            <span>{{column}}</span>
        </label>
    </li>
</ul>

<button (click)="query()">Query</button>

<table class="table table-hover">
    <thead>
        <tr>
            <th *ngFor="let column of visibleKeys();">{{column}}</th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let result of results;">
            <th *ngFor="let column of visibleKeys();">{{result[column]}}</th>
        </tr>
    </tbody>
</table>
`
})
export class AppComponent {
    columns: any;
    results: any[];

    constructor (private queryService: QueryService) {
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
                        "keys": ["courses_dept", "courses_id"]
                    },
                    "FORM": "TABLE"
                }
            })
            .then(results => {
                this.results = results.result;
            });
    }

    keys(): string[] {
        return Object.keys(this.columns);
    }

    visibleKeys(): string[] {
        return Object.keys(this.columns).filter(item => {
            return this.columns[item];
        });
    }
}



"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const query_service_1 = require("./query.service");
let AppComponent = class AppComponent {
    constructor(queryService) {
        this.queryService = queryService;
        this.name = "Test";
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
    query() {
        this.queryService
            .search({
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
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
    keys() {
        return Object.keys(this.columns);
    }
};
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        template: `
<ul class="unstyled">
    <li *ngFor="let column of keys();">
        <label class="checkbox">
         <!--[(ngModel)]="columns[column]"-->
            <input type="checkbox">
            <span>{{column}}</span>
        </label>
    </li>
</ul>

<button (click)="query()">Query</button>

<table class="table table-hover">
    <thead>
        <tr>
            <!--*ngIf="columns[column]-->
            <th *ngFor="let column of keys();">{{column}}</th>
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let result of results;">
        <!--*ngIf="columns[column]-->
            <th *ngFor="let column of keys();">{{result[column]}}</th>
        </tr>
    </tbody>
</table>
`
    }),
    __metadata("design:paramtypes", [query_service_1.QueryService])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map
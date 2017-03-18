"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require("@angular/core");
var AppComponent = (function () {
    function AppComponent(queryService) {
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
        this.results = [{
                "courses_dept": false,
                "courses_id": true,
                "courses_avg": true,
                "courses_instructor": true,
                "courses_title": true,
                "courses_pass": true,
                "courses_fail": true,
                "courses_audit": true,
                "courses_uuid": true,
                "courses_year": false
            }];
    }
    AppComponent.prototype.query = function () {
        var _this = this;
        this.results = [{
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
            }];
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
                "COLUMNS": Object.keys(this.columns).filter(function (e) {
                    return _this.columns[e];
                }),
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_dept", "courses_id"]
                },
                "FORM": "TABLE"
            }
        })
            .then(function (results) {
            _this.results = results;
        });
    };
    AppComponent.prototype.keys = function () {
        return Object.keys(this.columns);
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        template: "\n<ul class=\"unstyled\">\n    <li *ngFor=\"let column of keys();\">\n        <label class=\"checkbox\">\n         <!--[(ngModel)]=\"columns[column]\"-->\n            <input type=\"checkbox\">\n            <span>{{column}}</span>\n        </label>\n    </li>\n</ul>\n\n<button (click)=\"query()\">Query</button>\n\n<table class=\"table table-hover\">\n    <thead>\n        <tr>\n            <!--*ngIf=\"columns[column]-->\n            <th *ngFor=\"let column of keys();\">{{column}}</th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr *ngFor=\"let result of results;\">\n        <!--*ngIf=\"columns[column]-->\n            <th *ngFor=\"let column of keys();\">{{result[column]}}</th>\n        </tr>\n    </tbody>\n</table>\n"
    })
], AppComponent);
exports.AppComponent = AppComponent;

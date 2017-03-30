/**
 * Created by Jnani on 3/17/17.
 */
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class QueryService {
    private headers = new Headers({'Content-Type': 'application/json'});
    private queryEndpoint = "query";

    constructor(private http: Http) { }

    compose(filters: any, filterJunction: string, columns: any[], order: any): any {
        let innerFilter: any = filters.filter((filter: any) => {
                return filter.value.length !== 0;
            }).map((filter: any) => {
                let value: number | string = filter.value;

                if (filter.type === "number") {
                    value = parseFloat(filter.value);

                    if (isNaN(value)) {
                        throw "Invalid data type for " + filter.name;
                    }
                }

                if (filter.template) {
                    return filter.template(filter);
                }

                return {
                    [filter.comparator]: {
                        [filter.name]: value
                    }
                }
            });

        let innerWhere = innerFilter.length === 0 ? {} : {
                [filterJunction]: innerFilter
            };

        return {
            "WHERE": innerWhere,
            "OPTIONS": {
                "COLUMNS": columns.filter((item: any) => {
                    return item.value;
                }).map((item: any) => {
                    return item.name;
                }),
                "ORDER": {
                    "dir": order.dir,
                    "keys": order.keys.filter((item: any) => {
                        return item.value;
                    }).map((item: any) => {
                        return item.name;
                    })
                },
                "FORM": "TABLE"
            }
        };
    }

    search(query: any): Promise<any> {
        return this.http
            .post(this.queryEndpoint, query, this.headers)
            .toPromise()
            .then(response => {
                return response.json()
            })
            .catch(this.handleError);
    };

    private handleError(error: any): Promise<any> {
        return Promise.reject(error.message || error);
    }
}

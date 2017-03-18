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

    search(query: any): Promise<any[]> {
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

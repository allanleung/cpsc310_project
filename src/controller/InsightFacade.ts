/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import * as JSZip from 'jszip' ;
import util = require('util');

import Log from "../Util";

export default class InsightFacade implements IInsightFacade {
    dataSet: Map<string, any>;

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
        this.dataSet = new Map<string, any>();
    }

/**
courses_dept: string; The department that offered the course.
courses_id: string; The course number (will be treated as a string (e.g., 499b)).
courses_avg: number; The average of the course offering.
courses_instructor: string; The instructor teaching the course offering.
courses_title: string; The name of the course.
courses_pass: number; The number of students that passed the course offering.
courses_fail: number; The number of students that failed the course offering.
courses_audit: number; The number of students that audited the course offering.
courses_uuid: string; The unique id of a course offering
*/

    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise<InsightResponse>((resolve, reject) => {
            new JSZip().loadAsync(content)
            .then((zip: any) => {
                return zip.file(id).async("string");
            })
            .then((data: any) => {
                let statusCode = 204;
                if (this.dataSet.has(id)) {
                    statusCode = 201
                }

                let result = JSON.parse(data).result.map((entry: any) => {
                    return {
                        courses_dept: entry.Subject,
                        courses_id: entry.Course,
                        courses_avg: entry.Avg,
                        courses_instructor: entry.Professor,
                        courses_title: entry.Title,
                        courses_pass: entry.Pass,
                        courses_fail: entry.Fail,
                        courses_audit: entry.Audit,
                        courses_uuid: entry.id
                    };
                })

                this.dataSet.set(id, result);

                resolve({
                    code: statusCode,
                    body: {}
                });
            })
            .catch((err: any) => {
                reject({
                    code: 400,
                    body: {
                        error: err
                    }
                });
            });
        });
    }

    removeDataset(id: string): Promise<InsightResponse> {
        return new Promise((fulfill, reject) => {
            if (!this.dataSet.has(id)) {
                reject({
                    code: 404,
                    body: {
                        error: "Resource not found"
                    }
                });
            }

            this.dataSet.delete(id);

            fulfill({
                code: 200,
                body: {}
            });
        });
    }

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        return null;
    }
}

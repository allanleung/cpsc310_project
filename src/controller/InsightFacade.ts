///<reference path="IInsightFacade.ts"/>
import {isArray} from "util";
import {
    IInsightFacade,
    InsightResponse,
    Filter,
    cachePath,
    isOrFilter,
    isAndFilter,
    isLtFilter,
    isGtFilter,
    isEqFilter,
    isNotFilter,
    isIsFilter
} from "./IInsightFacade";
import * as JSZip from "jszip";
import Log from "../Util";
import QueryRequest from "./QueryRequest";
/**
 * This is the main programmatic entry point for the project.
 */
const fs = require('fs');

export default class InsightFacade implements IInsightFacade {
    dataSet: Map<string, any[]>;
    cache: boolean;

    constructor(cache = false) {
        Log.trace('InsightFacadeImpl::init()');
        this.dataSet = new Map<string, any[]>();
        this.cache = cache;

        if (this.cache && fs.existsSync(cachePath)) {
            Log.trace('Loading cached data');
            let cacheData: any[] = JSON.parse(fs.readFileSync(cachePath));
            this.dataSet = new Map<string, any[]>(cacheData);
        }
        // this.dataSet = new Map<string, any>();
    }

    public static resetCache() {
        if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
        }
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

    public addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise<InsightResponse>((resolve, reject) => {
            new JSZip().loadAsync(content, {base64: true})
                .then(zip => {
                    const files: Promise<any[]>[] = [];

                    let statusCode = 204;
                    if (this.dataSet.has(id)) {
                        statusCode = 201
                    }

                    zip.forEach((path: string, file: JSZipObject) => {
                        if (file.dir == true) {
                            return;
                        }

                        files.push(file.async('string').then((data) => {
                            return JSON.parse(data).result.map((entry: any) => {
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
                            });
                        }));
                    });

                    return Promise.all(files).then(data => {
                        const allItems: any[] = [];

                        for (let item of data) {
                            allItems.push(...item);
                        }

                        this.dataSet.set(id, allItems);

                        if (this.cache) {
                            const entries: any[] = [];

                            this.dataSet.forEach((value, key) => {
                                entries.push([key, value]);
                            });

                            fs.writeFileSync(cachePath, JSON.stringify(entries));
                        }

                        resolve({
                            code: statusCode,
                            body: {}
                        })
                    });
                })
                .catch(() => {
                    reject({
                        code: 400,
                        body: {
                            error: "Error loading zipfile"
                        }
                    });
                });
        });
    }

    public removeDataset(id: string): Promise<InsightResponse> {
        return new Promise((fulfill, reject) => {
            if (!this.dataSet.has(id)) {
                reject({
                    code: 404,
                    body: {
                        error: "Resource not found"
                    }
                });
            }

            delete this.dataSet.delete(id);

            fulfill({
                code: 204,
                body: {}
            });
        });
    }

    private performFilter(filter: Filter, oneItem: any) : boolean {
        if (isOrFilter(filter)) {
            return filter.OR.reduce((acc: boolean, innerQuery: any) => {
                return acc || this.performFilter(innerQuery, oneItem);
            }, false);
        } else if (isAndFilter(filter)) {
            return filter.AND.reduce((acc: boolean, innerQuery: any) => {
                return acc && this.performFilter(innerQuery, oneItem);
            }, true);
        } else if (isLtFilter(filter)) {
            const key = Object.keys(filter.LT)[0];
            return oneItem[key] < filter.LT[key];
        } else if (isGtFilter(filter)) {
            const key = Object.keys(filter.GT)[0];
            return oneItem[key] > filter.GT[key];
        } else if (isEqFilter(filter)) {
            const key = Object.keys(filter.EQ)[0];
            return oneItem[key] === filter.EQ[key];
        } else if (isNotFilter(filter)) {
            return !this.performFilter(filter.NOT, oneItem);
        } else if (isIsFilter(filter)) {
            const key = Object.keys(filter.IS)[0];
            let value = filter.IS[key];

            if (value === '*' || value === '**')
            // match everything
                return true;

            if (value.startsWith("*") && value.endsWith("*")) {
                const searchString = value.substr(1, value.length - 2);
                return oneItem[key].indexOf(searchString) !== -1;
            } else if (value.startsWith("*")) {
                const searchString = value.substr(1);
                return oneItem[key].endsWith(searchString);
            } else if (value.endsWith("*")) {
                const searchString = value.substr(0, value.length - 2);
                return oneItem[key].startsWith(searchString);
            } else {
                return oneItem[key] === value;
            }
        }
    }

    public performQuery(query: any): Promise <InsightResponse> {
        return new Promise<InsightResponse>((fulfill, reject) => {
            const parsingResult = QueryRequest.parseQuery(query);

            if (parsingResult === null) {
                reject({
                    code: 400,
                    body: {
                        error: "Malformed query"
                    }
                })
            } else if (isArray(parsingResult)) {
                reject({
                    code: 424,
                    body: {
                        missing: parsingResult
                    }
                })
            }

            const parsedQuery = <QueryRequest>parsingResult;

            const queryList: any[] = this.dataSet.get('courses').filter(
                (item: any) => this.performFilter(parsedQuery.WHERE, item));

            if (typeof parsedQuery.OPTIONS.ORDER === 'string') {
                queryList.sort((item1, item2) => {
                    let item1value = item1[parsedQuery.OPTIONS.ORDER];
                    let item2value = item2[parsedQuery.OPTIONS.ORDER];
                    if (item1value < item2value) {
                        return -1;
                    }
                    else if (item1value > item2value) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            }

            const rendered = queryList.map(item => {
                const newItem: any = {};

                for (let column of parsedQuery.OPTIONS.COLUMNS)
                    newItem[column] = item[column];

                return newItem;
            });

            fulfill({
                code: 200,
                body: {
                    render: 'TABLE',
                    result: rendered
                }
            });

        });
    }
}

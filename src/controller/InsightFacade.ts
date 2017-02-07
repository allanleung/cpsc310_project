///<reference path="IInsightFacade.ts"/>
import {isUndefined} from "util";
/**
 * This is the main programmatic entry point for the project.
 */
const fs = require('fs');

import {IInsightFacade, InsightResponse, QueryRequest, QueryOptions} from "./IInsightFacade";
import * as JSZip from 'jszip' ;

import Log from "../Util";

const cachePath = __dirname + '/data.json';

const keyRegex = '^([A-Za-z0-9]+)_[A-Za-z0-9]+$';

const keyTypes: { [key: string]: string } = {
    courses_dept: 'string',
    courses_id: 'string',
    courses_avg: 'number',
    courses_instructor: 'string',
    courses_title: 'string',
    courses_pass: 'number',
    courses_fail: 'number',
    courses_audit: 'number',
    courses_uuid: 'string'
};

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

    static resetCache() {
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

    addDataset(id: string, content: string): Promise<InsightResponse> {
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

            delete this.dataSet.delete(id);

            fulfill({
                code: 204,
                body: {}
            });
        });
    }

    compareQuery(query: QueryRequest, oneItem: any) : boolean {
        return this.innerQueryLoop(query.WHERE, oneItem);
    }

    verifyQuery(query: any) : string[] {
        if (typeof query !== "object")
            return null; // malformed

        if (query === null)
            return null; // malformed

        if (Object.keys(query).length !== 1)
            return null; // malformed

        const filter = Object.keys(query)[0];

        switch (filter) {
            case "OR":
            case "AND":
                if (!(query[filter] instanceof Array))
                    return null; // malformed

                if (query[filter].length === 0)
                    return null; // malformed

                return query[filter].reduce((acc: string[], innerQuery: any) => {
                    const innerResult = this.verifyQuery(innerQuery);

                    if (innerResult === null)
                        return null;

                    acc.push(...innerResult);

                    return acc;
                }, []);
            case "NOT":
                return this.verifyQuery(query[filter]);
            case "LT":
            case "GT":
            case "EQ":
            case "IS":
                const value = query[filter];

                if (typeof value !== "object")
                    return null;

                if (value === null)
                    return null;

                if (Object.keys(value).length !== 1)
                    return null;

                const key = Object.keys(value)[0];

                const matches = key.match(keyRegex);

                if (matches === null)
                    return null;

                if (!this.dataSet.has(matches[1])) {
                    return [matches[1]]; // missing dataset
                }

                if (filter === 'IS') {
                    if (keyTypes[key] !== 'string' || typeof value[key] !== 'string') {
                        return null;
                    } else {
                        return [];
                    }
                } else { // EQ, GT, LT
                    if (keyTypes[key] !== 'number' || typeof value[key] !== 'number') {
                        return null;
                    } else {
                        return [];
                    }
                }
        }
    }

    innerQueryLoop(query: any, oneItem: any) : boolean {
        let key;

        switch (Object.keys(query)[0]) {
            case "OR":
                return query["OR"].reduce((acc: boolean, innerQuery: any) => {
                    return acc || this.innerQueryLoop(innerQuery, oneItem);
                }, false);
            case "AND":
                return query["AND"].reduce((acc: boolean, innerQuery: any) => {
                    return acc && this.innerQueryLoop(innerQuery, oneItem);
                }, true);
            case "LT":
                key = Object.keys(query["LT"])[0];
                return oneItem[key] < query["LT"][key];
            case "GT":
                key = Object.keys(query["GT"])[0];
                return oneItem[key] > query["GT"][key];
            case "EQ":
                key = Object.keys(query["EQ"])[0];
                return oneItem[key] === query["EQ"][key];
            case "NOT":
                return !this.innerQueryLoop(query["NOT"], oneItem);
            case "IS":
                key = Object.keys(query["IS"])[0];
                let value: string = query["IS"][key];

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

    verifyOptions(options: QueryOptions): string[] {
        if (!(options.COLUMNS instanceof Array))
            return null;

        if (options.COLUMNS.length < 1)
            return null;

        if (options.FORM !== 'TABLE')
            return null;

        if (options.ORDER !== undefined && options.ORDER !== null) {
            if (typeof options.ORDER !== 'string')
                return null;

            const orderMatches = options.ORDER.match(keyRegex);

            if (orderMatches === null)
                return null;

            if (options.COLUMNS.indexOf(options.ORDER) === -1)
                return null;
        }

        return options.COLUMNS.reduce((acc: string[], item: string) => {
            const matches = item.match(keyRegex);

            if (matches === null || acc === null)
                return null;

            if (!this.dataSet.has(matches[1]))
                acc.push(matches[1]);

            return acc;
        }, []);
    }

    static validateTopLevelQuery(query: QueryRequest): boolean {
        if (query === null || isUndefined(query))
            return false;

        if (query.OPTIONS === null || isUndefined(query.OPTIONS))
            return false;

        return !(query.WHERE === null || isUndefined(query.WHERE));
    }

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        return new Promise<InsightResponse>((fulfill, reject) => {
            if (!InsightFacade.validateTopLevelQuery(query)) {
                reject({
                    code: 400,
                    body: {
                        error: "Malformed query"
                    }
                })
            }

            const optionsMissing = this.verifyOptions(query.OPTIONS);
            const whereMissing = this.verifyQuery(query.WHERE);

            if (optionsMissing === null || whereMissing === null)
                // malformed query
                reject({
                    code: 400,
                    body: {
                        error: "Malformed query"
                    }
                });

            const missing = [...whereMissing, ...optionsMissing];

            if (missing.length > 0) {
                // 424, missing dataSets
                reject({
                    code: 424,
                    body: {
                        missing
                    }
                });
            }

            const queryList: any[] = this.dataSet.get('courses').filter(
                (item: any) => this.compareQuery(query, item));

            queryList.sort((item1, item2) => {
                let item1value = item1[query.OPTIONS.ORDER];
                let item2value = item2[query.OPTIONS.ORDER];
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

            const rendered = queryList.map(item => {
                const newItem: any = {};

                for (let column of query.OPTIONS.COLUMNS)
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

///<reference path="IInsightFacade.ts"/>
/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import * as JSZip from 'jszip' ;

import Log from "../Util";

export default class InsightFacade implements IInsightFacade {
    dataSet: Map<string, any[]>;

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
                .then(zip => {
                    // find all matching files
                    const files = zip.file(new RegExp(`^${id}/.*$`));

                    if (files.length === 0)
                        throw new Error("no matching files found");

                    return files;
                })
                .then(folder => {
                    const files: Promise<any[]>[] = [];

                    let statusCode = 204;
                    if (this.dataSet.has(id)) {
                        statusCode = 201
                    }

                    folder.forEach((file: JSZipObject) => {
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

                        resolve({
                            code: statusCode,
                            body: {}
                        })
                    })
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
                code: 204,
                body: {}
            });
        });
    }

    compareQuery(query: QueryRequest, oneItem: any) : boolean {
        return this.innerQueryLoop(query.WHERE, oneItem);
    }

    innerQueryLoop(query: any, oneItem: any) : boolean {
        if (Object.keys(query).length == 0) {
            // base case
            return true;
        }

        switch (Object.keys(query)[0]) {
            case "OR":
                let QueryResults : boolean = false;
                for (let key of Object.keys(query["OR"])) {
                    QueryResults = QueryResults || this.innerQueryLoop(query["OR"][key], oneItem);
                }
                return QueryResults;

            case "AND":
                let NotQueryResults : boolean = true;
                for (let key of Object.keys(query["AND"])) {
                    NotQueryResults = NotQueryResults && this.innerQueryLoop(query["AND"][key], oneItem);
                }
                return NotQueryResults;

            case "LT":
                let fieldLT: string = Object.keys(query["LT"])[0];
                return oneItem[fieldLT] < query["LT"][fieldLT];

            case "GT":
                let fieldGT: string = Object.keys(query["GT"])[0];
                return oneItem[fieldGT] > query["GT"][fieldGT];

            case "EQ":
                let fieldEQ: string = Object.keys(query["EQ"])[0];
                return oneItem[fieldEQ] === query["EQ"][fieldEQ];

            case "NOT":
                let fieldNOT: string = Object.keys(query["NOT"])[0];
                return oneItem[fieldNOT] !== query["NOT"][fieldNOT];

            case "IS":
                let fieldIS: string = Object.keys(query["IS"])[0];
                let starField : string = query["IS"][fieldIS];
                if (starField[0] === "*") {
                    starField = "." + starField;
                }
                else {
                    starField = "^" + starField; // bc of regex
                }
                if (starField[starField.length - 1] === "*") {
                    starField = starField.substring(0, starField.length - 1) + ".*";
                }
                else {
                    starField = starField + "$"; // bc of regex
                }

                return oneItem[fieldIS].match(starField) !== null;
        }
    }

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        return new Promise<InsightResponse>((fulfill, reject) => {
            // check some invariants
            if (query.OPTIONS.COLUMNS.indexOf(query.OPTIONS.ORDER) === -1) {
                // invalid query
                reject({
                    code: 400,
                    body: {
                        error: "ORDER was not in COLUMNS"
                    }
                })
            }

            // check that all the columns we're using start with courses_
            const ids = query.OPTIONS.COLUMNS.map(column => {
                const matches = column.match('^([A-Za-z0-9]+)_[A-Za-z0-9]+$');

                if (matches === null)
                    reject({
                        code: 400,
                        body: {
                            error: "COLUMNS contained malformed key"
                        }
                    });

                return matches[1];
            });

            const missing = ids.filter(id => !this.dataSet.has(id));

            if (missing.length > 0) {
                // 424, missing dataSets
                reject({
                    code: 424,
                    body: {
                        missing
                    }
                });
            }

            let queryList : any [] = [];
            // for now, we only support the courses dataset
            this.dataSet.get('courses').forEach((value2) => {
                if (this.compareQuery(query, value2)) {
                    queryList.push(value2);
                }
            });

            queryList.sort((item1 ,item2) => {
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
            })
            queryList.forEach((value) => {
                for (let key of Object.keys(value)) {
                    if(query.OPTIONS.COLUMNS.indexOf(key) === -1)  {
                        delete value[key];
                    }
                }
            })
            fulfill({
                code: 200,
                body: {
                    render: 'TABLE',
                    result: queryList
                }
            });

        });
    }
}

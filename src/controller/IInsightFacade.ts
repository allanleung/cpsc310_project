/*
 * This is the primary high-level API for the project. In this folder there should be:
 * A class called InsightFacade, this should be in a file called InsightFacade.ts.
 * You should not change this interface at all or the test suite will not work.
 */
import {isString} from "util";
export const cachePath = __dirname + '/data.json';

export const keyRegex = '^([A-Za-z0-9]+)_[A-Za-z0-9]+$';

export const geoUrlPrefix = 'http://skaha.cs.ubc.ca:11316/api/v1/team37/'; // + <ADDRESS>

import * as parse5 from 'parse5';

import * as http from 'http';

import {parseRoomsZip} from './Rooms';
import {isNumber} from "util";
import {isUndefined} from "util";

export interface InsightResponse {
    code: number;
    body: any; // the actual response
}

export interface IInsightFacade {

    /**
     * Add a dataset to UBCInsight.
     *
     * @param id  The id of the dataset being added.
     * @param content  The base64 content of the dataset. This content should be in the
     * form of a serialized zip file.
     *
     * The promise should return an InsightResponse for both fulfill and reject.
     *
     * Fulfill should be for 2XX codes and reject for everything else.
     *
     * After receiving the dataset, it should be processed into a data structure of
     * your design. The processed data structure should be persisted to disk; your
     * system should be able to load this persisted value into memory for answering
     * queries.
     *
     * Ultimately, a dataset must be added or loaded from disk before queries can
     * be successfully answered.
     *
     * Response codes:
     *
     * 201: the operation was successful and the id already existed (was added in
     * this session or was previously cached).
     * 204: the operation was successful and the id was new (not added in this
     * session or was previously cached).
     * 400: the operation failed. The body should contain {"error": "my text"}
     * to explain what went wrong.
     *
     */
    addDataset(id: string, content: string): Promise<InsightResponse>;

    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove.
     *
     * The promise should return an InsightResponse for both fulfill and reject.
     *
     * Fulfill should be for 2XX codes and reject for everything else.
     *
     * This will delete both disk and memory caches for the dataset for the id meaning
     * that subsequent queries for that id should fail unless a new addDataset happens first.
     *
     * Response codes:
     *
     * 204: the operation was successful.
     * 404: the operation was unsuccessful because the delete was for a resource that
     * was not previously added.
     *
     */
    removeDataset(id: string): Promise<InsightResponse>;

    /**
     * Perform a query on UBCInsight.
     *
     * @param query  The query to be performed. This is the same as the body of the POST message.
     *
     * @return Promise <InsightResponse>
     *
     * The promise should return an InsightResponse for both fulfill and reject.
     *
     * Fulfill should be for 2XX codes and reject for everything else.
     *
     * Return codes:
     *
     * 200: the query was successfully answered. The result should be sent in JSON according in the response body.
     * 400: the query failed; body should contain {"error": "my text"} providing extra detail.
     * 424: the query failed because it depends on a resource that has not been PUT. The body should contain {"missing": ["id1", "id2"...]}.
     *
     */
    performQuery(query: any): Promise<InsightResponse>;
}

export const dataSetDefinitions: {
    [dataSet: string]: {
        processZip: (zip: JSZip) => Promise<any[]>,
        keys: {
            [key: string]: string
        }
    }
} = {
    rooms: {
        // rooms_fullname: string; Full building name (e.g., "Hugh Dempster Pavilion").
        // rooms_shortname: string; Short building name (e.g., "DMP").
        // rooms_number: string; The room number. Not always a number, so represented as a string.
        // rooms_name: string; The room id; should be rooms_shortname+"_"+rooms_number.
        // rooms_address: string; The building address. (e.g., "6245 Agronomy Road V6T 1Z4").
        // rooms_lat: number; The latitude of the building. Instructions for getting this field are below.
        // rooms_lon: number; The longitude of the building. Instructions for getting this field are below.
        // rooms_seats: number; The number of seats in the room.
        // rooms_type: string; The room type (e.g., "Small Group").
        // rooms_furniture: string; The room type (e.g., "Classroom-Movable Tables & Chairs").
        // rooms_href: string; The link to full details online (e.g., "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/DMP-201").
        processZip: parseRoomsZip,
        keys: {
            rooms_fullname: 'string',
            rooms_shortname: 'string',
            rooms_name: 'string',
            rooms_number: 'string',
            rooms_address: 'string',
            rooms_lat: 'number',
            rooms_lon: 'number',
            rooms_seats: 'number',
            rooms_type: 'string',
            rooms_furniture: 'string',
            rooms_href: 'string'
        }
    },
    courses: {
        processZip: parseCoursesZip,
        keys: {
            courses_dept: 'string',
            courses_id: 'string',
            courses_avg: 'number',
            courses_instructor: 'string',
            courses_title: 'string',
            courses_pass: 'number',
            courses_fail: 'number',
            courses_audit: 'number',
            courses_uuid: 'string',
            courses_year: 'number'
        }
    }
};

export function requestPromise(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        http.get(url, response => {
            if (response.statusCode === 200 && /^application\/json/.test(response.headers['content-type'])) {
                response.setEncoding('utf8');
                let rawData = '';

                response.on('data', chunk => rawData += chunk);
                response.on('error', e => reject(e));
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(rawData))
                    } catch (e) {
                        reject(e)
                    }
                });
            } else {
                const error = new Error(`Request failed: Status Code: ${response.statusCode}`);
                response.resume();
                reject(error)
            }
        }).on('error', e => reject(e))
    })
}

export function getElementsByAttrs(node: parse5.AST.Default.ParentNode, attributes: any[]): parse5.AST.Default.Element[] {
    const matchingElements: parse5.AST.Default.Element[] = [];

    const element = node as parse5.AST.Default.Element;

    if (element.attrs !== undefined) {
        if (hasMatchingAttributes(element, attributes)) {
            return [element]
        }
    }

    if (node.childNodes !== undefined) {
        for (let child of node.childNodes) {
            const matchingChildElements = getElementsByAttrs((<parse5.AST.Default.Element>child), attributes);

            matchingElements.push(...matchingChildElements);
        }
    }

    return matchingElements;
}

export function isUnknownDataset (id: string): boolean {
    return !(id in dataSetDefinitions);
}

export function isObject(item: any): item is Object {
    return item !== null && typeof item === 'object' && item.constructor === Object;
}

export function isEmptyObject(item: any): item is {} {
    if (!isObject(item))
        return false;

    return Object.keys(item).length === 0
}

export function flattenData(data: any[][]): any[] {
    return data.reduce((allItems, item) => {
        allItems.push(...item);
        return allItems;
    }, [])
}

export function filterObjectProperties(object: {[key: string]: any}, keys: string[]): {[key: string]: any} {
    const filteredObject: {[key: string]: any} = {};

    for (let key of keys) {
        filteredObject[key] = object[key];
    }

    return filteredObject
}

function parseCoursesZip(zip: JSZip): Promise<any[]> {
    const files: Promise<any[]>[] = [];

    zip.forEach((path: string, file: JSZipObject) => {
        if (file.dir == true) {
            return;
        }

        files.push(file.async('string').then(data => {
            return JSON.parse(data).result.map(createCoursesEntry).filter((item: any) => item !== null);
        }));
    });

    return Promise.all(files).then(flattenData)
}

function createCoursesEntry(entry: any): any {
    if (!isString(entry.Subject))
        return null;

    if (!isStringOrNumber(entry.Course))
        return null;

    if (!isAcceptableNumber(entry.Avg))
        return null;

    if (!isString(entry.Professor))
        return null;

    if (!isString(entry.Title))
        return null;

    if (!isAcceptableNumber(entry.Pass))
        return null;

    if (!isAcceptableNumber(entry.Fail))
        return null;

    if (!isAcceptableNumber(entry.Audit))
        return null;

    if (!isStringOrNumber(entry.id))
        return null;

    if (!isAcceptableNumber(entry.Year) && (!isUndefined(entry.Year) || entry.Section !== 'overall'))
        return null;

    return {
        courses_dept: String(entry.Subject),
        courses_id: String(entry.Course),
        courses_avg: Number(entry.Avg),
        courses_instructor: String(entry.Professor),
        courses_title: String(entry.Title),
        courses_pass: Number(entry.Pass),
        courses_fail: Number(entry.Fail),
        courses_audit: Number(entry.Audit),
        courses_uuid: String(entry.id),
        courses_year: entry.Section === "overall" ? 1900 : Number(entry.Year)
    }
}

function isAcceptableNumber(item: any): boolean {
    if (!isStringOrNumber(item))
        return false;

    return !isNaN(Number(item))
}

function isStringOrNumber(item: any): item is String | Number {
    return isString(item) || isNumber(item)
}

function hasMatchingAttributes(element: parse5.AST.Default.Element, attributes: any[]): boolean {
    return attributes.every(attribute => {
        return element.attrs.some(elementAttribute => isMatchingAttribute(attribute, elementAttribute));
    });
}

function isMatchingAttribute(attribute: parse5.AST.Default.Attribute, elementAttribute: parse5.AST.Default.Attribute): boolean {
    return attribute.name === elementAttribute.name && elementAttribute.value.search(attribute.value) != -1;
}
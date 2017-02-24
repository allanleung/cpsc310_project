/*
 * This is the primary high-level API for the project. In this folder there should be:
 * A class called InsightFacade, this should be in a file called InsightFacade.ts.
 * You should not change this interface at all or the test suite will not work.
 */
export const cachePath = __dirname + '/data.json';

export const keyRegex = '^([A-Za-z0-9]+)_[A-Za-z0-9]+$';

import * as parse5 from 'parse5';
export function getElementsByAttrs(node: parse5.AST.Default.ParentNode, attrs: any[]) : parse5.AST.Default.Element[] {
    let elements: parse5.AST.Default.Element[] = [];

    let elem: parse5.AST.Default.Element = node as parse5.AST.Default.Element;
    if (elem.attrs !== undefined) {
        let matches: boolean = attrs.every((attr) => {
            return elem.attrs.some((elemAttr) => {
                return attr.name === elemAttr.name && elemAttr.value.search(attr.value) != -1;
            });
        });

        if (matches) {
            return [elem];
        }
    }

    if (node.childNodes !== undefined) {
        for (let child of node.childNodes) {
            let foundElements = getElementsByAttrs((<parse5.AST.Default.Element>child), attrs);

            for (let found of foundElements) {
                elements.push(found);
            }
        }
    }

    return elements;
}

export function isUnknownDataset (id: string) {
    return !(id in dataSetDefinitions);
}

export const dataSetDefinitions: {
    [dataSet: string]: {
        parseFile: (data: string) => any[],
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
            parseFile: data => {
                // TODO: Move into implementation
                // TODO: Fix room number format, Lookup address

                let buildingDocument: parse5.AST.Default.Document = parse5.parse(data) as parse5.AST.Default.Document;
                let canonicalName = getElementsByAttrs(buildingDocument, [
                    {
                        name: "rel",
                        value: "canonical"
                    }
                ]);

                let buildings = getElementsByAttrs(buildingDocument, [
                    {
                        name: "id",
                        value: "^buildings-wrapper$"
                    }
                ]);
                let buildingInfo = getElementsByAttrs(buildings[0], [
                    {
                        name: "class",
                        value: "^field-content$"
                    }
                ]);

                let classrooms = getElementsByAttrs(buildingDocument, [
                    {
                        name: "class",
                        value: "^view view-buildings-and-classrooms view-id-buildings_and_classrooms .*"
                    }
                ]);

                let rooms = getElementsByAttrs(classrooms[0], [
                    {
                        name: "class",
                        value: "^(odd|even) .*"
                    }
                ]);

                return rooms.map((room) => {
                    let fields = getElementsByAttrs(room, [
                        {
                            name: "class",
                            value: "^views-field .*"
                        }
                    ]);

                    const shortname = canonicalName[0].attrs[1].value;
                    const number = parseInt((<parse5.AST.Default.TextNode>(<parse5.AST.Default.Element>fields[0].childNodes[1]).childNodes[0]).value.trim());
                    const seats = parseInt((<parse5.AST.Default.TextNode>fields[1].childNodes[0]).value.trim());

                    const name = shortname + "_" + number;

                    return {
                        rooms_fullname: (<parse5.AST.Default.TextNode>buildingInfo[0].childNodes[0]).value,
                        rooms_shortname: shortname,
                        rooms_name: name,
                        rooms_number: number,
                        rooms_address: (<parse5.AST.Default.TextNode>buildingInfo[1].childNodes[0]).value,
                        rooms_lat: 'number',
                        rooms_lon: 'number',
                        rooms_seats: seats,
                        rooms_type: (<parse5.AST.Default.TextNode>fields[3].childNodes[0]).value.trim(),
                        rooms_furniture: (<parse5.AST.Default.TextNode>fields[2].childNodes[0]).value.trim(),
                        rooms_href: (<parse5.AST.Default.Element>fields[0].childNodes[1]).attrs[0].value
                    };

                });
            },
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
            parseFile: data => {
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
                        courses_uuid: entry.id,
                        courses_year: entry.Section == "overall" ? 1900 : entry.Year
                    };
                });
            },
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

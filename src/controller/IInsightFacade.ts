/*
 * This is the primary high-level API for the project. In this folder there should be:
 * A class called InsightFacade, this should be in a file called InsightFacade.ts.
 * You should not change this interface at all or the test suite will not work.
 */
import * as parse5 from 'parse5';
export const cachePath = __dirname + '/data.json';

export const keyRegex = '^([A-Za-z0-9]+)_[A-Za-z0-9]+$';

export function isUnknownDataset (id: string) {
    return !(id in dataSetDefinitions);
}

export const dataSetDefinitions: {
    [dataSet: string]: {
        processZip: (zip: JSZip) => Promise<any[]>,
        keys: {
            [key: string]: string
        }
    }
} = {
    courses: {
        processZip: processCoursesZip,
        keys: {
            courses_dept: 'string',
            courses_id: 'string',
            courses_avg: 'number',
            courses_instructor: 'string',
            courses_title: 'string',
            courses_pass: 'number',
            courses_fail: 'number',
            courses_audit: 'number',
            courses_uuid: 'string'
        }
    },
    rooms: {
        processZip: processRoomsZip,
        keys: {
            rooms_fullname: 'string',
            rooms_shortname: 'string',
            rooms_number: 'number',
            rooms_name: 'string',
            rooms_address: 'string',
            rooms_lat: 'number',
            rooms_lon: 'number',
            rooms_seats: 'number',
            rooms_type: 'number',
            rooms_furniture: 'string',
            rooms_href: 'string'
        }
    }
};

function processRoomsZip(zip: JSZip): Promise<any[]> {
    return zip.file('/index.html').async('string')
        .then(data => processRoomsIndex(<parse5.AST.Default.Document>parse5.parse(data)));
}

function processRoomsIndex(document: parse5.AST.Default.Document): Promise<any[]> {

    return null;
}

function processCoursesZip(zip: JSZip): Promise<any[]> {
    const files: Promise<any[]>[] = [];

    zip.forEach((path: string, file: JSZipObject) => {
        if (file.dir == true) {
            return;
        }

        files.push(file.async('string').then(parseCoursesFile));
    });

    return Promise.all(files).then(data => {
        const allItems: any[] = [];

        for (let item of data) {
            allItems.push(...item);
        }

        return allItems;
    });
}

function parseCoursesFile(data: string): any {
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
}

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

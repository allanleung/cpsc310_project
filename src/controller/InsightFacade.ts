/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";
import JSZip from 'jszip';

import Log from "../Util";

export default class InsightFacade implements IInsightFacade {
    dataSet: Map<string, any>;

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
        this.dataSet = new Map<string, any>();
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise<InsightResponse>((resolve, reject) => {
            JSZip.loadAsyc(content)
            .then((zip) => {
                return zip.file(id).async("string");
            })
            .then((data) => {
                let statusCode = 204;
                if (dataSet.has(id)) {
                    statusCode = 201
                }

                dataSet.set(id, JSON.parse(data));

                resolve({
                    code: statusCode,
                    body: {}
                });
            })
            .catch((err) => {
                resolve({
                    code: 400,
                    body: {
                        error: err
                    }
                });
            });
        });
    }

    removeDataset(id: string): Promise<InsightResponse> {
        return null;
    }

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        return null;
    }
}

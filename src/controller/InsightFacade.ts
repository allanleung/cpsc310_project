/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, QueryRequest} from "./IInsightFacade";

import Log from "../Util";

export default class InsightFacade implements IInsightFacade {
    dataSet: Map<string, any>;

    constructor() {
        this.dataSet = new Map<string, any>();
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        return null;
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

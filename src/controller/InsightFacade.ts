///<reference path="IInsightFacade.ts"/>
import {IInsightFacade, InsightResponse, dataSetDefinitions, isUnknownDataset} from "./IInsightFacade";
import * as JSZip from "jszip";
import QueryParser from "./QueryParser";
import DataController from "./DataController";
import QueryController from "./QueryController";

export default class InsightFacade implements IInsightFacade {
    private readonly dataController: DataController;
    private readonly queryController: QueryController;

    constructor(cache = false) {
        this.dataController = new DataController(cache);
        this.queryController = new QueryController(this.dataController);
    }

    public addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise<InsightResponse>((resolve, reject) => {
            if (isUnknownDataset(id)) {
                reject({
                    code: 400,
                    body: {
                        error: "Don't know how to handle " + id + " dataset"
                    }
                })
            }

            new JSZip().loadAsync(content, {base64: true})
                .then(zip => InsightFacade.processZipFile(id, zip).then(allItems => {
                    const statusCode = this.isNewDataset(id) ? 204 : 201;

                    this.dataController.addDataset(id, allItems);

                    resolve({
                        code: statusCode,
                        body: {}
                    });
                }))
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
            if (!this.dataController.hasDataset(id)) {
                reject({
                    code: 404,
                    body: {
                        error: "Resource not found"
                    }
                });
            }

            this.dataController.removeDataset(id);

            fulfill({
                code: 204,
                body: {}
            });
        });
    }

    public performQuery(query: any): Promise <InsightResponse> {
        return new Promise<InsightResponse>((fulfill, reject) => {
            const parsingResult = QueryParser.parseQuery(query);

            if (parsingResult === null) {
                reject({
                    code: 400,
                    body: {
                        error: "Malformed query"
                    }
                })
            }

            const missing = this.queryController.findMissingDatasets(parsingResult.datasets);

            if (missing.length > 0) {
                reject({
                    code: 424,
                    body: {
                        missing
                    }
                })
            }

            const rendered = this.queryController.executeQuery(parsingResult.query);

            if (rendered === null) {
                reject({
                    code: 400,
                    body: {
                        error: "No datasets"
                    }
                })
            }

            fulfill({
                code: 200,
                body: {
                    render: 'TABLE',
                    result: rendered
                }
            });

        });
    }

    private isNewDataset(id: string): boolean {
        return !this.dataController.hasDataset(id)
    }

    private static processZipFile(id: string, zip: JSZip): Promise<any[]> {
        return dataSetDefinitions[id].processZip(zip)
    }

    /**
     * Add a dataset directly, without going through the parsing process. Used for internal testing.
     *
     * @param id the id of the dataset
     * @param entries the entries of the dataset
     * @private
     */
    public _addDataset(id: string, entries: any[]) {
        this.dataController.addDataset(id, entries);
    }
}

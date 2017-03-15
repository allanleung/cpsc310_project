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
                return reject({
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

                    return resolve({
                        code: statusCode,
                        body: {}
                    });
                }))
                .catch(() => {
                    return reject({
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
                return reject({
                    code: 404,
                    body: {
                        error: "Resource not found"
                    }
                });
            }

            this.dataController.removeDataset(id);

            return fulfill({
                code: 204,
                body: {}
            });
        });
    }

    public performQuery(query: any): Promise <InsightResponse> {
        return new Promise<InsightResponse>((fulfill, reject) => {
            const parsingResult = QueryParser.parseQuery(query);

            if (parsingResult === null) {
                return reject({
                    code: 400,
                    body: {
                        error: "Malformed query"
                    }
                })
            }

            if (this.queryController.isMissingDataset(parsingResult.dataset)) {
                return reject({
                    code: 424,
                    body: {
                        missing: [parsingResult.dataset]
                    }
                })
            }

            const rendered = this.queryController.executeQuery(parsingResult.query, parsingResult.dataset);

            if (rendered === null) {
                return reject({
                    code: 400,
                    body: {
                        error: "No datasets"
                    }
                })
            }

            return fulfill({
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

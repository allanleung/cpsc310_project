/**
 * Created by jerome on 2017-02-07.
 *
 * Contains a caching data map class.
 */

import * as fs from 'fs';
import {cachePath} from "./IInsightFacade";

export default class DataController {
    private dataSet: Map<string, any[]>;
    private cache: boolean;

    constructor(cache = false) {
        this.dataSet = new Map<string, any[]>();
        this.cache = cache;

        if (this.cache && fs.existsSync(cachePath)) {
            let cacheData: any[] = JSON.parse(fs.readFileSync(cachePath).toString());
            this.dataSet = new Map<string, any[]>(cacheData);
        }
    }

    public static resetCache() {
        if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
        }
    }

    private writeCache() {
        const entries: any[] = [];

        this.dataSet.forEach((value, key) => {
            entries.push([key, value]);
        });

        fs.writeFileSync(cachePath, JSON.stringify(entries));
    }

    public addDataset(id: string, content: any[]) {
        this.dataSet.set(id, content);

        if (this.cache) {
            this.writeCache();
        }
    }

    public removeDataset(id: string) {
        this.dataSet.delete(id);

        if (this.cache) {
            this.writeCache();
        }
    }

    public getDataset(id: string): any[] {
        return this.dataSet.get(id);
    }

    public hasDataset(id: string): boolean {
        return this.dataSet.has(id);
    }
}
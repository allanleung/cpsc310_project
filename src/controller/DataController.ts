/**
 * Created by jerome on 2017-02-07.
 *
 * Contains a caching data map class.
 */
import * as fs from "fs";
import {cachePath} from "./IInsightFacade";

export default class DataController {
    private readonly dataSet: Map<string, any[]>;

    constructor(private readonly cache = false) {
        this.dataSet = new Map<string, any[]>(this.getInitialData());
    }

    private getInitialData() {
        if (this.shouldLoadCache()) {
            return DataController.readCacheData();
        } else {
            return [];
        }
    }

    private shouldLoadCache(): boolean {
        return this.cache && fs.existsSync(cachePath);
    }

    private static readCacheData(): any[] {
        return JSON.parse(fs.readFileSync(cachePath).toString());
    }

    public static resetCache() {
        if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
        }
    }

    public getDataset(id: string): any[] {
        return this.dataSet.get(id)
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

    public hasDataset(id: string): boolean {
        return this.dataSet.has(id);
    }

    private writeCache() {
        const entries: any[] = [];

        this.dataSet.forEach((value, key) => {
            entries.push([key, value]);
        });

        fs.writeFileSync(cachePath, JSON.stringify(entries));
    }
}
import Query, {
    isIsFilter,
    isNotFilter,
    isEqFilter,
    isGtFilter,
    isLtFilter,
    isAndFilter,
    isOrFilter,
    Filter,
    IsFilter,
    EqFilter,
    GtFilter,
    LtFilter,
    AndFilter,
    OrFilter, Apply, isApplyCount, isApplyMax, isApplyMin, isApplySum, isApplyAvg,
    Order
} from "./Query";
import DataController from "./DataController";
import {filterObjectProperties} from "./IInsightFacade";
import {isUndefined} from "util";
/**
 * Created by jerome on 2017-02-10.
 *
 * Encapsulates functionality for executing queries.
 */

export default class QueryController {
    constructor(private readonly dataSet: DataController) {}

    public executeQuery(query: Query, dataset: string): any[] {
        const filteredItems = this.filterItems(query, dataset);

        let finalItems = filteredItems;

        if (query.hasTransformations()) {
            finalItems = QueryController.groupFilteredItems(
                filteredItems, query.TRANSFORMATIONS.GROUP, query.TRANSFORMATIONS.APPLY);
        }

        if (query.hasOrder()) {
            QueryController.sortFilteredItems(finalItems, query.OPTIONS.ORDER);
        }

        return QueryController.renderItems(finalItems, query.OPTIONS.COLUMNS);
    }

    public isMissingDataset(dataset: string): boolean {
        return !this.dataSet.hasDataset(dataset);
    }

    private static groupFilteredItems(items: any[], groups: string[], apply: Apply[]): any[] {
        const itemGroups = this.createItemGroups(items, groups);

        return this.transformGroupedItems(itemGroups, apply);
    }

    private static createItemGroups(items: any[], groups: string[]): {[key: string]: any[]} {
        const itemGroups: {[key: string]: any[]} = {};

        for (let item of items) {
            const groupKey = filterObjectProperties(item, groups);

            const stringifiedGroupKey = JSON.stringify(groupKey);

            if (isUndefined(itemGroups[stringifiedGroupKey])) {
                itemGroups[stringifiedGroupKey] = [item]
            } else {
                itemGroups[stringifiedGroupKey].push(item)
            }
        }

        return itemGroups;
    }

    private static transformGroupedItems(itemGroups: {[p: string]: any[]}, apply: Apply[]): any[] {
        const results = [];

        for (let stringifiedGroupKey in itemGroups) {
            results.push({
                ...JSON.parse(stringifiedGroupKey),
                ...this.applyAllTransformation(apply, itemGroups[stringifiedGroupKey])
            });
        }

        return results;
    }

    private static applyAllTransformation(apply: Apply[], items: any[]): {[key: string]: number} {
        const applyResult: {[key: string]: number} = {};

        for (let applyItem of apply) {
            applyResult[Object.keys(applyItem)[0]] = this.applySingleTransformation(applyItem, items);
        }

        return applyResult;
    }

    private static applySingleTransformation(applyItem: Apply, items: any[]): number {
        const applyFunction = applyItem[Object.keys(applyItem)[0]];

        if (isApplyCount(applyFunction)) {
            return (new Set(items.map(item => item[applyFunction.COUNT])).size)

        } else if (isApplyMax(applyFunction)) {
            return Math.max(...items.map(item => item[applyFunction.MAX]))

        } else if (isApplyMin(applyFunction)) {
            return Math.min(...items.map(item => item[applyFunction.MIN]))

        } else if (isApplySum(applyFunction)) {
            return items.map(item => item[applyFunction.SUM]).reduce((sum, item) => sum + item, 0)

        } else if (isApplyAvg(applyFunction)) {
            const modifiedSum = items
                .map(item => Number((item[applyFunction.AVG] * 10).toFixed(0)))
                .reduce((sum, item) => sum + item, 0);

            return Number(((modifiedSum / items.length) / 10).toFixed(2))
        }
    }

    private filterItems(query: Query, dataset: string): any[] {
        return this.dataSet.getDataset(dataset)
            .filter(item => QueryController.shouldIncludeItem(query.WHERE, item));
    }

    private static sortFilteredItems(filteredItems: any[], order: Order | string) {
        const sortKeys = typeof order === 'string' ? [order] : order.keys;
        const direction = typeof order === 'string' ? 'UP' : order.dir;

        const before = direction === 'UP' ? -1 : 1;
        const after = -before;

        filteredItems.sort((item1, item2) => {
            for (let key of sortKeys) {
                let value1 = item1[key];
                let value2 = item2[key];

                if (value1 < value2) {
                    return before;
                } else if (value1 > value2) {
                    return after;
                }
            }

            return 0;
        });
    }

    private static renderItems(filteredItems: any[], columns: string[]): any[] {
        return filteredItems.map(item => filterObjectProperties(item, columns))
    }

    private static shouldIncludeItem(filter: Filter | {}, item: any): boolean {
        if (isOrFilter(filter)) {
            return this.processOrFilter(filter, item);

        } else if (isAndFilter(filter)) {
            return this.processAndFilter(filter, item);

        } else if (isLtFilter(filter)) {
            return this.processLtFilter(filter, item);

        } else if (isGtFilter(filter)) {
            return this.processGtFilter(filter, item);

        } else if (isEqFilter(filter)) {
            return this.processEqFilter(filter, item);

        } else if (isNotFilter(filter)) {
            return !this.shouldIncludeItem(filter.NOT, item);

        } else if (isIsFilter(filter)) {
            return this.processIsFilter(filter, item);
        } else {
            return true;
        }
    }

    private static processOrFilter(filter: OrFilter, item: any): boolean {
        return filter.OR.reduce((acc: boolean, innerQuery: any) => {
            return acc || this.shouldIncludeItem(innerQuery, item);
        }, false);
    }

    private static processAndFilter(filter: AndFilter, item: any): boolean {
        return filter.AND.reduce((acc: boolean, innerQuery: any) => {
            return acc && this.shouldIncludeItem(innerQuery, item);
        }, true);
    }

    private static processLtFilter(filter: LtFilter, item: any): boolean {
        const key = Object.keys(filter.LT)[0];
        return key in item && item[key] < filter.LT[key];
    }

    private static processGtFilter(filter: GtFilter, item: any): boolean {
        const key = Object.keys(filter.GT)[0];
        return key in item && item[key] > filter.GT[key];
    }

    private static processEqFilter(filter: EqFilter, item: any): boolean {
        const key = Object.keys(filter.EQ)[0];
        return key in item && item[key] === filter.EQ[key];
    }

    private static processIsFilter(filter: IsFilter, item: any): boolean {
        const key = Object.keys(filter.IS)[0];
        let value = filter.IS[key];

        if (!(key in item))
            return false;

        if (value === '*' || value === '**')
            return true;

        if (value.startsWith("*") && value.endsWith("*")) {
            const searchString = value.substr(1, value.length - 2);
            return item[key].indexOf(searchString) !== -1;

        } else if (value.startsWith("*")) {
            const searchString = value.substr(1);
            return item[key].endsWith(searchString);

        } else if (value.endsWith("*")) {
            const searchString = value.substr(0, value.length - 1);
            return item[key].startsWith(searchString);

        } else {
            return item[key] === value;
        }
    }
}

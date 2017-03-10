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
import {isEmptyObject, filterObject} from "./IInsightFacade";
import {isUndefined} from "util";
/**
 * Created by jerome on 2017-02-10.
 *
 * Encapsulates functionality for executing queries.
 */

export default class QueryController {
    constructor(private readonly dataSet: DataController) {}

    public executeQuery(query: Query): any[] {
        const filteredItems = this.filterItems(query);

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

    private static groupFilteredItems(items: any[], groups: string[], apply: Apply[]): any[] {
        const categories: { [key: string]: any[] } = {};

        for (let item of items) {
            const key = filterObject(item, key => groups.indexOf(key) > -1);

            const groupKey = JSON.stringify(key);

            if (isUndefined(categories[groupKey])) {
                categories[groupKey] = [item]
            } else {
                categories[groupKey].push(item)
            }
        }

        const results = [];

        for (let groupKey in categories) {
            const key = JSON.parse(groupKey);
            results.push(Object.assign(key, QueryController.generateApplyKeys(apply, categories[groupKey])));
        }

        return results;
    }

    private static generateApplyKeys(apply: Apply[], items: any[]): {[key: string]: number} {
        const applyResult: {[key: string]: number} = {};

        for (let applyItem of apply) {
            const key = Object.keys(applyItem)[0];
            const applyFunction = applyItem[key];

            if (isApplyCount(applyFunction)) {
                applyResult[key] = (new Set(items.map(item => item[applyFunction.COUNT])).size)
            } else if (isApplyMax(applyFunction)) {
                applyResult[key] = Math.max(...items.map(item => item[applyFunction.MAX]))
            } else if (isApplyMin(applyFunction)) {
                applyResult[key] = Math.min(...items.map(item => item[applyFunction.MIN]))
            } else if (isApplySum(applyFunction)) {
                applyResult[key] = items.map(item => item[applyFunction.SUM]).reduce((sum, item) => sum + item, 0)
            } else if (isApplyAvg(applyFunction)) {
                const modifiedSum = items.map(item => Number((item[applyFunction.AVG] * 10).toFixed(0)))
                    .reduce((sum, item) => sum + item, 0);

                applyResult[key] = Number(((modifiedSum / items.length) / 10).toFixed(2))
            }
        }
        return applyResult;
    }

    public isMissingDataset(dataset: string): boolean {
        return !this.dataSet.hasDataset(dataset);
    }

    private filterItems(query: Query): any[] {
        const filteredItems: any[] = [];

        this.dataSet.forEach(dataSet => {
            filteredItems.push(...dataSet.filter(item => {
                return isEmptyObject(query.WHERE) || QueryController.shouldIncludeItem(query.WHERE, item)
            }));
        });

        return filteredItems;
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
        return filteredItems.map(item => {
            const newItem: any = {};

            for (let column of columns)
                newItem[column] = item[column];

            return newItem;
        })
    }

    private static shouldIncludeItem(filter: Filter, item: any): boolean {
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

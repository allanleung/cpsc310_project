import {
    isIsFilter,
    isNotFilter,
    isEqFilter,
    isGtFilter,
    isLtFilter,
    isAndFilter,
    isOrFilter,
    Filter,
    Query
} from "./IInsightFacade";
import DataController from "./DataController";
/**
 * Created by jerome on 2017-02-10.
 *
 * Encapsulates functionality for executing queries.
 */

export default class QueryController {
    constructor(readonly dataSet: DataController) {}

    public executeQuery(parsedQuery: Query) {
        const filteredItems = this.filterItems(parsedQuery);

        if (typeof parsedQuery.OPTIONS.ORDER === 'string') {
            this.sortFilteredItems(filteredItems, parsedQuery.OPTIONS.ORDER);
        }

        return this.renderItems(filteredItems, parsedQuery.OPTIONS.COLUMNS);
    }

    private renderItems(filteredItems: any[], columns: string[]): any[] {
        return filteredItems.map(item => {
            const newItem: any = {};

            for (let column of columns)
                newItem[column] = item[column];

            return newItem;
        })
    }

    private filterItems(parsedQuery: Query) {
        const filteredItems: any[] = [];

        this.dataSet.forEach(dataSet => {
            filteredItems.push(...dataSet.filter(item => QueryController.filterItem(parsedQuery.WHERE, item)));
        });
        return filteredItems;
    }

    private sortFilteredItems(filteredItems: any[], order: string) {
        filteredItems.sort((item1, item2) => {
            let item1value = item1[order];
            let item2value = item2[order];
            if (item1value < item2value) {
                return -1;
            }
            else if (item1value > item2value) {
                return 1;
            }
            else {
                return 0;
            }
        });
    }

    /**
     * Determines whether the given item matches the filter
     *
     * @param filter the filter to match against
     * @param item the item to match
     * @returns {any} true if the item matches the filter, false otherwise
     */
    private static filterItem(filter: Filter, item: any) : boolean {
        if (isOrFilter(filter)) {
            return filter.OR.reduce((acc: boolean, innerQuery: any) => {
                return acc || this.filterItem(innerQuery, item);
            }, false);
        } else if (isAndFilter(filter)) {
            return filter.AND.reduce((acc: boolean, innerQuery: any) => {
                return acc && this.filterItem(innerQuery, item);
            }, true);
        } else if (isLtFilter(filter)) {
            const key = Object.keys(filter.LT)[0];
            return key in item && item[key] < filter.LT[key];
        } else if (isGtFilter(filter)) {
            const key = Object.keys(filter.GT)[0];
            return key in item && item[key] > filter.GT[key];
        } else if (isEqFilter(filter)) {
            const key = Object.keys(filter.EQ)[0];
            return key in item && item[key] === filter.EQ[key];
        } else if (isNotFilter(filter)) {
            return !this.filterItem(filter.NOT, item);
        } else if (isIsFilter(filter)) {
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
}
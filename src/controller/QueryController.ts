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
    OrFilter
} from "./Query";
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

        if (parsedQuery.hasOrder()) {
            this.sortFilteredItems(filteredItems, parsedQuery.OPTIONS.ORDER);
        }

        return this.renderItems(filteredItems, parsedQuery.OPTIONS.COLUMNS);
    }

    private filterItems(parsedQuery: Query) {
        const filteredItems: any[] = [];

        this.dataSet.forEach(dataSet => {
            filteredItems.push(...dataSet.filter(item => QueryController.shouldIncludeItem(parsedQuery.WHERE, item)));
        });

        return filteredItems;
    }

    private sortFilteredItems(filteredItems: any[], order: string) {
        filteredItems.sort((item1, item2) => {
            let value1 = item1[order];
            let value2 = item2[order];

            if (value1 < value2) {
                return -1;
            } else if (value1 > value2) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    private renderItems(filteredItems: any[], columns: string[]): any[] {
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
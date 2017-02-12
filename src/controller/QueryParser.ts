/**
 * Created by jerome on 2017-02-07.
 *
 * Contains the class for QueryRequest, which is responsible for parsing Queries.
 */
import {Filter, QueryOptions, Query, dataSetDefinitions, keyRegex, isUnknownDataset} from "./IInsightFacade";

export default class QueryParser implements Query {
    readonly WHERE: Filter;
    readonly OPTIONS: QueryOptions;

    /**
     * Parses a query into a new Query object
     *
     * @param query the query to parse
     * @returns {any} a new QueryParser, or a list of missing dataSets, or null if the query is invalid
     */
    public static parseQuery(query: any): Query | string[] | null {
        if (!this.verifyToplevelQueryObject(query))
            return null;

        const datasets = this.extractAllDatasets(query);

        if (datasets === null)
            return null;

        const missing = this.findMissingDatasets(datasets);

        if (missing === null) {
            return null
        } else if (missing.length > 0) {
            return missing
        }

        const filterTypesCorrect = this.verifyFilterDataTypes(datasets, query.WHERE);

        return filterTypesCorrect ? <Query>query : null
    }

    private static verifyToplevelQueryObject(query: any): boolean {
        if (query === null || typeof query !== 'object')
            return false;

        if (query.OPTIONS === null || typeof query.OPTIONS !== 'object')
            return false;

        return !(query.WHERE === null || typeof query.WHERE !== 'object')
    }

    private static extractAllDatasets(query: any): string[] | null {
        const optionsDatasets = this.extractOptionsDatasets(query.OPTIONS);

        const filterDatasets = this.extractFilterDatasets(query.WHERE);

        if (optionsDatasets === null || filterDatasets === null)
            return null;

        return [...optionsDatasets, ...filterDatasets]
    }

    private static findMissingDatasets(datasets: string[]): string[]|any {
        return datasets.filter(dataset => isUnknownDataset(dataset))
    }

    private static verifyFilterDataTypes(datasets: any[], filter: any) {
        return datasets.reduce((acc, dataset) => {
            return acc && this.verifyFilterTypes(filter, dataset, dataSetDefinitions[dataset].keys)
        }, true);
    }

    /**
     * Parses the options clause for the data sets it references
     *
     * @param options the options object to parse
     * @returns {null} the dataSets it references, or null if the options clause is invalid
     */
    private static extractOptionsDatasets(options: any): string[] | null {
        if (!(options.COLUMNS instanceof Array))
            return null;

        if (options.COLUMNS.length < 1)
            return null;

        if (options.FORM !== 'TABLE')
            return null;

        if (options.ORDER !== undefined && options.ORDER !== null) {
            if (typeof options.ORDER !== 'string')
                return null;

            const orderMatches = options.ORDER.match(keyRegex);

            if (orderMatches === null)
                return null;

            if (options.COLUMNS.indexOf(options.ORDER) === -1)
                return null;
        }

        return options.COLUMNS.reduce((acc: string[], item: string) => {
            const matches = item.match(keyRegex);

            if (matches === null || acc === null)
                return null;

            acc.push(matches[1]);

            return acc;
        }, []);
    }

    /**
     * Try to parse the given object as a Query, producing the dataSets that it references
     *
     * @param filter the query to try to parse
     * @returns {null} the dataSets referenced in the query, or null if the query is invalid
     */
    private static extractFilterDatasets(filter: any): string[] | null {
        if (typeof filter !== "object")
            return null; // malformed

        if (filter === null)
            return null; // malformed

        if (Object.keys(filter).length !== 1)
            return null; // malformed

        const filterType = Object.keys(filter)[0];
        const filterValue = filter[filterType];

        switch (filterType) {
            case "OR":
            case "AND":
                return this.extractLogicFilterDatasets(filterValue);
            case "NOT":
                return this.extractFilterDatasets(filterValue);
            case "LT":
            case "GT":
            case "EQ":
            case "IS":
                return this.extractComparisonFilterDatasets(filterType, filterValue);
            default:
                return null;
        }
    }

    /**
     * Parse a filter with the context of a dataSet.
     *
     * @param filter the filter to parse
     * @param dataSet the name of the dataSet being checked
     * @param keyTypes the key types for the dataSet
     * @returns {boolean} true if the filter is correct for the dataSet
     */
    private static verifyFilterTypes(filter: any, dataSet: string, keyTypes: { [key: string]: string }): boolean {
        const filterType = Object.keys(filter)[0];

        switch (filterType) {
            case "OR":
            case "AND":
                return filter[filterType].reduce((acc: boolean, innerFilter: any) => {
                    return acc && this.verifyFilterTypes(innerFilter, dataSet, keyTypes);
                }, true);
            case "NOT":
                return this.verifyFilterTypes(filter[filterType], dataSet, keyTypes);
            case "LT":
            case "GT":
            case "EQ":
            case "IS":
                const key = Object.keys(filter[filterType])[0];
                const value = filter[filterType][key];

                const keyDataSet = key.match(keyRegex)[1];

                // ignore any keys that not part of the dataSet we're testing
                return dataSet !== keyDataSet || typeof value === keyTypes[key];
        }
    }

    private static extractLogicFilterDatasets(filterValue: any): string[]|any {
        if (!(filterValue instanceof Array))
            return null; // malformed

        if (filterValue.length === 0)
            return null; // malformed

        return filterValue.reduce((acc: string[], innerFilter: any) => {
            const innerResult = this.extractFilterDatasets(innerFilter);

            if (innerResult === null)
                return null;

            acc.push(...innerResult);

            return acc;
        }, []);
    }

    private static extractComparisonFilterDatasets(filterType: string, filterValue: any): string[] | null {
        if (typeof filterValue !== "object")
            return null;

        if (filterValue === null)
            return null;

        if (Object.keys(filterValue).length !== 1)
            return null;

        const key = Object.keys(filterValue)[0];

        const matches = key.match(keyRegex);

        if (matches === null)
            return null;

        if (filterType === 'IS') {
            if (typeof filterValue[key] !== 'string') {
                return null;
            } else {
                return [matches[1]];
            }
        } else { // EQ, GT, LT
            if (typeof filterValue[key] !== 'number') {
                return null;
            } else {
                return [matches[1]];
            }
        }
    }
}

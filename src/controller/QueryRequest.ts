/**
 * Created by jerome on 2017-02-07.
 *
 * Contains the class for QueryRequest, which is responsible for parsing Queries.
 */
import {Filter, QueryOptions, Query, dataSetDefinitions, keyRegex} from "./IInsightFacade";

export default class QueryRequest implements Query {
    WHERE: Filter;
    OPTIONS: QueryOptions;

    /**
     * Parses a query into a new QueryRequest
     *
     * @param query the query to parse
     * @returns {any} a new QueryRequest, or a list of missing dataSets, or null if the query is invalid
     */
    public static parseQuery(query: any): QueryRequest | string[] | null {
        if (query === null || typeof query !== 'object')
            return null;

        if (query.OPTIONS === null || typeof query.OPTIONS !== 'object')
            return null;

        if (query.WHERE === null || typeof query.WHERE !== 'object')
            return null;

        const optionsDataSets = this.parseOptions(query.OPTIONS);

        const filterDataSets = this.parseFilterDataSets(query.WHERE);

        if (optionsDataSets === null || filterDataSets === null)
            return null;

        const missing: string[] = [];

        for (let dataSet of [...optionsDataSets, ...filterDataSets]) {
            if (!(dataSet in dataSetDefinitions)) {
                missing.push(dataSet);
            } else if (!this.parseFilter(query.WHERE, dataSet, dataSetDefinitions[dataSet])) {
                return null;
            }
        }

        if (missing.length === 0)
            return <QueryRequest>query;
        else return missing;
    }

    /**
     * Parses the options clause for the data sets it references
     *
     * @param options the options object to parse
     * @returns {null} the dataSets it references, or null if the options clause is invalid
     */
    private static parseOptions(options: any): string[] | null {
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
     * Parse a filter with the context of a dataSet.
     *
     * @param filter the filter to parse
     * @param dataSet the name of the dataSet being checked
     * @param keyTypes the key types for the dataSet
     * @returns {boolean} true if the filter is correct for the dataSet
     */
    private static parseFilter(filter: any, dataSet: string, keyTypes: { [key: string]: string }): boolean {
        const filterType = Object.keys(filter)[0];

        switch (filterType) {
            case "OR":
            case "AND":
                return filter[filterType].reduce((acc: boolean, innerFilter: any) => {
                    return acc && this.parseFilter(innerFilter, dataSet, keyTypes);
                }, true);
            case "NOT":
                return this.parseFilter(filter[filterType], dataSet, keyTypes);
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

    /**
     * Try to parse the given object as a Query, producing the dataSets that it references
     *
     * @param filter the query to try to parse
     * @returns {null} the dataSets referenced in the query, or null if the query is invalid
     */
    private static parseFilterDataSets(filter: any): string[] | null {
        if (typeof filter !== "object")
            return null; // malformed

        if (filter === null)
            return null; // malformed

        if (Object.keys(filter).length !== 1)
            return null; // malformed

        const filterType = Object.keys(filter)[0];

        switch (filterType) {
            case "OR":
            case "AND":
                if (!(filter[filterType] instanceof Array))
                    return null; // malformed

                if (filter[filterType].length === 0)
                    return null; // malformed

                return filter[filterType].reduce((acc: string[], innerFilter: any) => {
                    const innerResult = this.parseFilterDataSets(innerFilter);

                    if (innerResult === null)
                        return null;

                    acc.push(...innerResult);

                    return acc;
                }, []);
            case "NOT":
                return this.parseFilterDataSets(filter[filterType]);
            case "LT":
            case "GT":
            case "EQ":
            case "IS":
                const value = filter[filterType];

                if (typeof value !== "object")
                    return null;

                if (value === null)
                    return null;

                if (Object.keys(value).length !== 1)
                    return null;

                const key = Object.keys(value)[0];

                const matches = key.match(keyRegex);

                if (matches === null)
                    return null;

                if (filterType === 'IS') {
                    if (typeof value[key] !== 'string') {
                        return null;
                    } else {
                        return [matches[1]];
                    }
                } else { // EQ, GT, LT
                    if (typeof value[key] !== 'number') {
                        return null;
                    } else {
                        return [matches[1]];
                    }
                }
            default:
                return null;
        }
    }
}

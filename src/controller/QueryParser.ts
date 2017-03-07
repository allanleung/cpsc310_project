/**
 * Created by jerome on 2017-02-07.
 *
 * Contains the class for QueryRequest, which is responsible for parsing Queries.
 */
import {dataSetDefinitions, keyRegex, isUnknownDataset} from "./IInsightFacade";
import Query from "./Query";
import {Transformations} from "./Query";
import {isApplyFunction} from "./Query";
import {isApplyCount} from "./Query";
import {isApplyMax} from "./Query";
import {isApplyMin} from "./Query";
import {isApplyAvg} from "./Query";
import {isApplySum} from "./Query";

export class ParsingResult {
    constructor(readonly query: Query, readonly dataset: string) {}
}

export default class QueryParser {
    /**
     * Parses a query into a new Query object
     *
     * @param query the query to parse
     * @returns {any} a new QueryParser, or a list of missing dataSets, or null if the query is invalid
     */
    public static parseQuery(query: any): ParsingResult | null {
        if (!this.verifyToplevelQueryObject(query))
            return null;

        // extractAllDatasets is also tasked with checking syntax, maybe change that
        const datasets = this.extractAllDatasets(query);

        if (datasets === null)
            return null;

        const uniqueDatasets = this.removeDuplicates(datasets);

        if (uniqueDatasets.length > 1)
            return null;

        const dataset = uniqueDatasets[0];

        if (!isUnknownDataset(dataset)) {
            if (!this.verifyFilterDataTypes(dataset, query.WHERE))
                return null;

            if (!this.verifyTransformations(dataset, query.TRANSFORMATIONS))
                return null;
        }

        const applyKeys = this.extractApplyKeys(query.TRANSFORMATIONS);

        return new ParsingResult(new Query(query.WHERE, query.OPTIONS), dataset);
    }

    private static verifyToplevelQueryObject(query: any): boolean {
        if (query === null || typeof query !== 'object')
            return false;

        if (query.OPTIONS === null || typeof query.OPTIONS !== 'object')
            return false;

        if (query.WHERE === null || typeof query.WHERE !== 'object')
            return false;

        return (typeof query.TRANSFORMATIONS === 'undefined' || typeof query.TRANSFORMATIONS === 'object')
    }

    private static extractAllDatasets(query: any): string[] | null {
        const optionsDatasets = this.extractOptionsDatasets(query.OPTIONS);

        const filterDatasets = this.extractFilterDatasets(query.WHERE);

        const transformationsDatasets = this.extractTransformationsDatasets(query.TRANSFORMATIONS);

        if (optionsDatasets === null || filterDatasets === null || transformationsDatasets === null)
            return null;

        return [...optionsDatasets, ...filterDatasets, ...transformationsDatasets]
    }

    private static removeDuplicates(datasets: string[]): string[] {
        return datasets.filter((value, index) => datasets.indexOf(value) === index)
    }

    private static verifyFilterDataTypes(dataset: string, filter: any): boolean {
        return this.verifyFilterTypes(filter, dataset, dataSetDefinitions[dataset].keys)
    }

    private static verifyTransformations(dataset: string, transformations: any): boolean {
        // two things to do here: all GROUP entries should be found in a dataset
        // APPLY entries should reference datasets that exist
        const groupCorrect = this.verifyGroup(transformations.GROUP, dataSetDefinitions[dataset].keys);

        const applyCorrect = this.verifyApply(transformations.APPLY, dataSetDefinitions[dataset].keys);

        return groupCorrect && applyCorrect;
    }

    private static extractApplyKeys(transformations: any): string[] {
        if (transformations === null || typeof transformations !== 'object')
            return [];

        return transformations.APPLY.map((entry: any) => Object.keys(entry)[0])
    }

    private static verifyOptions(options: any, applyKeys: string[], keySet: {[key: string]: string}): boolean {
        return false;
    }

    private static verifyGroup(group: any, keySet: {[key: string]: string}): boolean {
        if (!(group instanceof Array))
            return false;

        const keys = Object.keys(keySet);

        return group
                .map(maybeKey => typeof maybeKey === 'string' ? maybeKey : "")
                .map(key => {
                    const matches = key.match(keyRegex);

                    return matches !== null ? matches[1] : null
                })
                .map(dataset => keys.indexOf(dataset))
                .every(datasetIndex => datasetIndex !== -1)
    }

    private static verifyApply(apply: any[], keys: {[key: string]: string}): boolean {
        const applyKeys = apply.map(entry => Object.keys(entry)[0]);

        const applyValues = apply.map(entry => entry[Object.keys(entry)[0]]);

        const applyKeysCorrect = applyKeys.every(key => key.indexOf('_') !== -1);

        const applyValuesCorrect = applyValues.every(value => this.verifyApplyValue(value, keys));

        return applyKeysCorrect && applyValuesCorrect
    }

    private static verifyApplyValue(applyValue: any, keys: {[key: string]: string}): boolean {
        // in here we have to check two categories. If the type of apply is MAX, MIN, AVG, or SUM,
        // then we need to ensure that the key referred to is numeric. If the type is COUNT, check
        // that the key is either number or string.

        if (!isApplyFunction(applyValue))
            return false;

        if (isApplyCount(applyValue)) {
            return keys[applyValue.COUNT] === 'string'
                || keys[applyValue.COUNT] === 'number'
        } else if (isApplyMax(applyValue)) {
            return keys[applyValue.MAX] === 'number'
        } else if (isApplyMin(applyValue)) {
            return keys[applyValue.MIN] === 'number'
        } else if (isApplyAvg(applyValue)) {
            return keys[applyValue.AVG] === 'number'
        } else {
            return keys[applyValue.SUM] === 'number'
        }
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

            if (orderMatches === null && options.ORDER.indexOf('_') !== -1)
                return null;

            if (options.COLUMNS.indexOf(options.ORDER) === -1)
                return null;
        }

        return options.COLUMNS.reduce((acc: string[], item: string) => {
            if (acc === null)
                return null;

            const matches = item.match(keyRegex);

            if (matches === null && item.indexOf('_') !== -1) {
                return null;
            } else if (matches !== null) {
                acc.push(matches[1]);
            }

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

    private static extractTransformationsDatasets(transformations: any): string[] | null {
        if (transformations === null || transformations === undefined) {
            return [];
        }

        if (!(transformations.APPLY instanceof Array))
            return null;

        if (transformations.APPLY.length < 1)
            return null;

        const applyDatasets = transformations.APPLY
            .map((applyKey: any) => {
                if (typeof applyKey !== 'object' || applyKey === null)
                    return null;

                if (Object.keys(applyKey).length !== 1)
                    return null;

                const key = Object.keys(applyKey)[0];

                if (key.indexOf('_') !== -1)
                    return null;

                const value = applyKey[key];

                if (!isApplyFunction(value))
                    return null;

                if (Object.keys(value).length !== 1)
                    return null;

                const datasetKey = (<any>value)[Object.keys(value)[0]];

                if (typeof datasetKey !== 'string')
                    return null;

                const matches = datasetKey.match(keyRegex);

                if (matches === null)
                    return null;

                return matches[1];
            });

        if (!(transformations.GROUP instanceof Array))
            return null;

        if (transformations.GROUP.length < 1)
            return null;

        const groupDatasets: string[] = transformations.GROUP.map((group: any) => {
            if (typeof group !== 'string')
                return null;

            const matches = group.match(keyRegex);

            if (matches === null)
                return null;

            return matches[1];
        });

        if (groupDatasets.indexOf(null) !== -1)
            return null;

        if (applyDatasets.indexOf(null) !== -1)
            return null;

        return [...groupDatasets, ...applyDatasets]
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

/**
 * Created by jerome on 2017-02-07.
 *
 * Contains the class for QueryRequest, which is responsible for parsing Queries.
 */
import {dataSetDefinitions, keyRegex, isUnknownDataset, isEmptyObject} from "./IInsightFacade";
import Query, {
    Transformations,
    isApplyCount,
    isApplyMax,
    isApplyMin,
    isApplyAvg,
    Filter,
    isAndFilter,
    isOrFilter,
    isNotFilter,
    isLtFilter,
    isGtFilter,
    isEqFilter,
    isIsFilter,
    Comparator,
    Logic,
    QueryOptions,
    Apply,
    ApplyFunction
} from "./Query";

export class ParsingResult {
    constructor(readonly query: Query, readonly dataset: string) {}
}

export default class QueryParser {
    /**
     * Parses a query into a new Query object
     *
     * @param queryLike the query to parse
     * @returns {any} a new QueryParser, or a list of missing dataSets, or null if the query is invalid
     */
    public static parseQuery(queryLike: any): ParsingResult | null {
        if (!Query.isQueryLike(queryLike)) {
            return null;
        }

        const query = new Query(queryLike.WHERE, queryLike.OPTIONS, queryLike.TRANSFORMATIONS);

        const datasets = this.extractAllDatasets(query);

        const uniqueDatasets = this.removeDuplicates(datasets);

        if (uniqueDatasets.length > 1)
            return null;

        const dataset = uniqueDatasets[0];

        if (!isUnknownDataset(dataset)) {
            if (!this.verifyFilterDataTypes(dataset, query.WHERE))
                return null;

            if (query.hasTransformations() && !this.verifyTransformations(dataset, query.TRANSFORMATIONS))
                return null;

            // NOTE we might need to do part of this step anyways, even if we don't know dataset
            if (!this.verifyOptions(query.OPTIONS, this.getAcceptableColumns(query, dataset)))
                return null;
        }

        return new ParsingResult(query, dataset);
    }

    private static getAcceptableColumns(query: Query, dataset: string): string[] {
        if (query.hasTransformations()) {
            return this.extractTransformationsKeys(query.TRANSFORMATIONS);
        } else {
            return Object.keys(dataSetDefinitions[dataset].keys);
        }
    }

    private static extractAllDatasets(query: Query): string[] {
        const optionsDatasets = this.extractOptionsDatasets(query.OPTIONS);

        const filterDatasets = isEmptyObject(query.WHERE) ? [] : this.extractFilterDatasets(query.WHERE);

        const transformationsDatasets = query.hasTransformations() ?
            this.extractTransformationsDatasets(query.TRANSFORMATIONS) : [];

        return [...optionsDatasets, ...filterDatasets, ...transformationsDatasets]
    }

    private static removeDuplicates(datasets: string[]): string[] {
        return datasets.filter((value, index) => datasets.indexOf(value) === index)
    }

    private static verifyFilterDataTypes(dataset: string, filter: Filter | {}): boolean {
        return isEmptyObject(filter) || this.verifyFilterTypes(filter, dataset, dataSetDefinitions[dataset].keys)
    }

    private static verifyTransformations(dataset: string, transformations: Transformations): boolean {
        // two things to do here: all GROUP entries should be found in a dataset
        // APPLY entries should reference datasets that exist
        const groupCorrect = this.verifyGroup(transformations.GROUP, dataSetDefinitions[dataset].keys);

        const applyCorrect = this.verifyApply(transformations.APPLY, dataSetDefinitions[dataset].keys);

        return groupCorrect && applyCorrect;
    }

    private static extractTransformationsKeys(transformations: Transformations): string[] {
        return [...transformations.APPLY.map(entry => Object.keys(entry)[0]), ...transformations.GROUP]
    }

    private static verifyOptions(options: QueryOptions, keys: string[]): boolean {
        return options.COLUMNS.every(key => keys.indexOf(key) > -1)
    }

    private static verifyGroup(group: string[], keySet: {[key: string]: string}): boolean {
        const keys = Object.keys(keySet);

        return group.every(key => keys.indexOf(key) !== -1)
    }

    private static verifyApply(apply: Apply[], keys: {[key: string]: string}): boolean {
        return apply
            .map(entry => entry[Object.keys(entry)[0]])
            .every(value => this.verifyApplyValue(value, keys));
    }

    private static verifyApplyValue(applyValue: ApplyFunction, keys: {[key: string]: string}): boolean {
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
    private static extractOptionsDatasets(options: QueryOptions): string[] {
        return options.COLUMNS.map(key => {
            const matches = key.match(keyRegex);

            if (matches === null) {
                // column references an APPLY key
                return null;
            } else {
                return key.match(keyRegex)[1]
            }
        }).filter(dataset => dataset !== null)
    }

    /**
     * Try to parse the given object as a Query, producing the dataSets that it references
     *
     * @param filter the query to try to parse
     * @returns {null} the dataSets referenced in the query, or null if the query is invalid
     */
    private static extractFilterDatasets(filter: Filter): string[] {
        if (isAndFilter(filter))
            return this.extractLogicFilterDatasets(filter.AND);
        else if (isOrFilter(filter))
            return this.extractLogicFilterDatasets(filter.OR);
        else if (isNotFilter(filter))
            return this.extractFilterDatasets(filter.NOT);
        else if (isLtFilter(filter))
            return this.extractComparisonFilterDatasets(filter.LT);
        else if (isGtFilter(filter))
            return this.extractComparisonFilterDatasets(filter.GT);
        else if (isEqFilter(filter))
            return this.extractComparisonFilterDatasets(filter.EQ);
        else if (isIsFilter(filter))
            return this.extractIsFilterDatasets(filter.IS);
    }

    private static extractIsFilterDatasets(entry: {[key: string]: string}): string[] {
        return Object.keys(entry).map(key => key.match(keyRegex)[1])
    }

    private static extractTransformationsDatasets(transformations: Transformations): string[] {
        const groupDatasets = transformations.GROUP.map(key => key.match(keyRegex)[1]);

        const applyDatasets = transformations.APPLY
            .map(item => (<any>item)[Object.keys(item)[0]])
            .map(applyFunction => (<any>applyFunction)[Object.keys(applyFunction)[0]])
            .map(key => key.match(keyRegex)[1]);

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

                return typeof value === keyTypes[key];
        }
    }

    private static extractLogicFilterDatasets(filters: Logic): string[] {
        return filters.reduce((acc, filter) => {
            return [...acc, ...this.extractFilterDatasets(filter)];
        }, []);
    }

    private static extractComparisonFilterDatasets(comparator: Comparator): string[] {
        return Object.keys(comparator).map(key => key.match(keyRegex)[1])
    }
}

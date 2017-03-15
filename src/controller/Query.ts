import {keyRegex, isEmptyObject, isObject} from "./IInsightFacade";

/**
 * Created by jerome on 2017-02-11.
 *
 * Contains a Typescript description of the EBNF query format. The purpose of these definitions is to provide a
 * saner interface to the query information, once all the invariants have been verified.
 */
export default class Query {
    constructor(
        public readonly WHERE: Filter | {},
        public readonly OPTIONS: QueryOptions,
        public readonly TRANSFORMATIONS?: Transformations
    ) {}

    public static isQueryLike(item: any): boolean {
        if (!isObject(item))
            return false;

        const keys = Object.keys(item);

        if (keys.length !== 3 && keys.length !== 2)
            return false;

        if (keys.length === 3 && !isTransformations(item.TRANSFORMATIONS))
            return false;

        if (!isQueryOptions(item.OPTIONS))
            return false;

        return isFilter(item.WHERE) || isEmptyObject(item.WHERE)
    }

    public hasOrder(): boolean {
        return isObject(this.OPTIONS.ORDER) || typeof this.OPTIONS.ORDER === 'string';
    }

    public hasTransformations(): boolean {
        return isObject(this.TRANSFORMATIONS)
    }
}

export type Filter = IsFilter | LtFilter | GtFilter | EqFilter | AndFilter | OrFilter | NotFilter;

export interface QueryOptions {
    COLUMNS: string[];
    ORDER?: Order | string;
    FORM: string;
}

export interface Transformations {
    GROUP: string[];
    APPLY: Apply[];
}

export interface IsFilter {
    IS: {[key: string]: string;};
}

export interface LtFilter {
    LT: Comparator;
}

export interface GtFilter {
    GT: Comparator;
}

export interface EqFilter {
    EQ: Comparator;
}

export interface AndFilter {
    AND: Logic;
}

export interface OrFilter {
    OR: Logic;
}

export interface NotFilter {
    NOT: Filter;
}

export interface Order {
    dir: string;
    keys: string[];
}

export interface Apply {
    [key: string]: ApplyFunction
}

export type Comparator = {[key: string]: number};

export type Logic = Filter[];

export type ApplyFunction = ApplyMax | ApplyMin | ApplyAvg | ApplyCount | ApplySum;

export interface ApplyMax {
    MAX: string
}

export interface ApplyMin {
    MIN: string
}

export interface ApplyAvg {
    AVG: string
}

export interface ApplyCount {
    COUNT: string
}

export interface ApplySum {
    SUM: string
}

function isTransformations(item: any): item is Transformations {
    if (!isObject(item))
        return false;

    if (Object.keys(item).length !== 2)
        return false;

    if (!Array.isArray(item.GROUP))
        return false;

    if (!Array.isArray(item.APPLY))
        return false;

    if (item.GROUP.length < 1)
        return false;

    if (item.GROUP.some((key: any) => typeof key !== 'string'))
        return false;

    if (item.GROUP.some((key: any) => key.match(keyRegex) === null))
        return false;

    if (item.APPLY.some((value: any) => !isApply(value)))
        return false;

    const applyKeys: string[] = item.APPLY.map((item: any) => Object.keys(item)[0]);

    return (new Set(applyKeys)).size === applyKeys.length;
}

function isQueryOptions(item: any): item is QueryOptions {
    if (!isObject(item))
        return false;

    const keys = Object.keys(item);

    if (keys.length !== 2 && keys.length !== 3)
        return false;

    if (!Array.isArray(item.COLUMNS))
        return false;

    if (item.COLUMNS.length < 1)
        return false;

    if (item.COLUMNS.some((entry: any) => typeof entry !== 'string'))
        return false;

    if (item.COLUMNS.some((entry: any) => entry.indexOf('_') > -1 && entry.match(keyRegex) === null))
        return false;

    if (keys.length === 3 && !isOrder(item.ORDER, item.COLUMNS))
        return false;

    return item.FORM === 'TABLE';
}

function isFilter(item: any): item is Filter {
    if (!isObject(item))
        return false;

    if (Object.keys(item).length !== 1)
        return false;

    return isLtFilter(item) || isGtFilter(item) || isEqFilter(item)
        || isAndFilter(item) || isOrFilter(item) || isNotFilter(item) || isIsFilter(item)
}

function isApply(item: any): item is Apply {
    if (!isObject(item))
        return false;

    if (Object.keys(item).length !== 1)
        return false;

    const token = Object.keys(item)[0];
    const value = item[token];

    if (token.indexOf('_') > -1)
        return false;

    return isApplyFunction(value);
}

function isApplyFunction(item: any): item is ApplyFunction {
    const apply = <ApplyFunction>item;

    if (!isObject(item))
        return false;

    if (Object.keys(item).length !== 1)
        return false;

    return isApplyMax(apply) || isApplyMin(apply) || isApplyAvg(apply) || isApplyCount(apply) || isApplySum(apply)
}

function isOrder(item: any, columns: string[]): boolean {
    if (typeof item === 'string') {
        return isOrderString(item, columns);
    } else if (isObject(item)) {
        return isOrderObject(item, columns);
    } else {
        return false;
    }
}

function isOrderString(item: string, columns: string[]): boolean {
    return columns.indexOf(item) >= 0;
}

function isOrderObject(item: any, columns: string[]): boolean {
    const keys = Object.keys(item);

    if (keys.indexOf('dir') === -1)
        return false;

    if (keys.indexOf('keys') === -1)
        return false;

    if (keys.length !== 2)
        return false;

    if (!Array.isArray(item.keys))
        return false;

    if (item.keys.length < 1)
        return false;

    for (let key of item.keys) {
        if (columns.indexOf(key) < 0)
            return false;
    }

    return item.dir === 'UP' || item.dir === 'DOWN';
}

export function isApplyMax(apply: ApplyFunction): apply is ApplyMax {
    return isKey((<ApplyMax>apply).MAX)
}

export function isApplyMin(apply: ApplyFunction): apply is ApplyMin {
    return isKey((<ApplyMin>apply).MIN)
}

export function isApplyAvg(apply: ApplyFunction): apply is ApplyAvg {
    return isKey((<ApplyAvg>apply).AVG)
}

export function isApplyCount(apply: ApplyFunction): apply is ApplyCount {
    return isKey((<ApplyCount>apply).COUNT)
}

export function isApplySum(apply: ApplyFunction): apply is ApplySum {
    return isKey((<ApplySum>apply).SUM)
}

export function isIsFilter(item: any): item is IsFilter {
    if (!couldBeFilter(item))
        return false;

    if (!isObject(item.IS))
        return false;

    if (Object.keys(item.IS).length !== 1)
        return false;

    const key = Object.keys(item.IS)[0];

    const value = item.IS[key];

    if (key.match(keyRegex) === null)
        return false;

    return typeof value === 'string'
}

export function isGtFilter(item: any): item is GtFilter {
    if (!couldBeFilter(item))
        return false;

    return isComparator(item.GT)
}

export function isLtFilter(item: any): item is LtFilter {
    if (!couldBeFilter(item))
        return false;

    return isComparator(item.LT)
}

export function isEqFilter(item: any): item is EqFilter {
    if (!couldBeFilter(item))
        return false;

    return isComparator(item.EQ)
}

export function isAndFilter(item: any): item is AndFilter {
    if (!couldBeFilter(item))
        return false;

    return isLogic(item.AND)
}

export function isOrFilter(item: any): item is OrFilter {
    if (!couldBeFilter(item))
        return false;

    return isLogic(item.OR)
}

export function isNotFilter(item: any): item is NotFilter {
    if (!couldBeFilter(item))
        return false;

    return isFilter(item.NOT)
}

function isKey(item: any): boolean {
    if (typeof item !== 'string')
        return false;

    return item.match(keyRegex) !== null
}

function couldBeFilter(item: any): boolean {
    if (!isObject(item))
        return false;

    return Object.keys(item).length === 1
}

function isComparator(item: any): item is Comparator {
    if (!isObject(item))
        return false;

    if (Object.keys(item).length !== 1)
        return false;

    const key = Object.keys(item)[0];

    if (key.match(keyRegex) === null)
        return false;

    return typeof item[key] === 'number'
}

function isLogic(item: any): item is Logic {
    if (!Array.isArray(item))
        return false;

    if (item.length < 1)
        return false;

    return item.every((item: any) => isFilter(item))
}

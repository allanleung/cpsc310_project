import {App} from "../App";
/**
 * Created by jerome on 2017-02-11.
 *
 * Contains a Typescript description of the EBNF query format. The purpose of these definitions is to provide a
 * saner interface to the query information, once all the invariants have been verified.
 */
export default class Query {
    constructor(
        public readonly WHERE: Filter,
        public readonly OPTIONS: QueryOptions,
        public readonly TRANSFORMATIONS?: Transformations
    ) {}

    public hasOrder(): boolean {
        return typeof this.OPTIONS.ORDER === 'string';
    }

    public hasTransformations(): boolean {
        return typeof this.TRANSFORMATIONS === 'object';
    }
}

export interface QueryOptions {
    COLUMNS: string[];
    ORDER?: string;
    FORM: string;
}

export interface Transformations {
    GROUP: string[];
    APPLY: Apply[];
}

export interface Apply {
    [key: string]: ApplyFunction
}

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

export function isApplyFunction(item: any): item is ApplyFunction {
    const apply = <ApplyFunction>item;

    if (typeof item !== 'object' || item === null)
        return false;

    if (Object.keys(item).length !== 1)
        return false;

    return isApplyMax(apply) || isApplyMin(apply) || isApplyAvg(apply) || isApplyCount(apply) || isApplySum(apply)
}

export function isApplyMax(apply: ApplyFunction): apply is ApplyMax {
    return typeof (<ApplyMax>apply).MAX === 'string'
}

export function isApplyMin(apply: ApplyFunction): apply is ApplyMin {
    return typeof (<ApplyMin>apply).MIN === 'string'
}

export function isApplyAvg(apply: ApplyFunction): apply is ApplyAvg {
    return typeof (<ApplyAvg>apply).AVG === 'string'
}

export function isApplyCount(apply: ApplyFunction): apply is ApplyCount {
    return typeof (<ApplyCount>apply).COUNT === 'string'
}

export function isApplySum(apply: ApplyFunction): apply is ApplySum {
    return typeof (<ApplySum>apply).SUM === 'string'
}

export type Filter = IsFilter | LtFilter | GtFilter | EqFilter | AndFilter | OrFilter | NotFilter;

export type Comparator = {[key: string]: number};

export type Logic = Filter[];

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

export function isIsFilter(item: Filter): item is IsFilter {
    return (<IsFilter>item).IS !== undefined;
}

export function isGtFilter(item: Filter): item is GtFilter {
    return (<GtFilter>item).GT !== undefined;
}

export function isLtFilter(item: Filter): item is LtFilter {
    return (<LtFilter>item).LT !== undefined;
}

export function isEqFilter(item: Filter): item is EqFilter {
    return (<EqFilter>item).EQ !== undefined;
}

export function isAndFilter(item: Filter): item is AndFilter {
    return (<AndFilter>item).AND !== undefined;
}

export function isOrFilter(item: Filter): item is OrFilter {
    return (<OrFilter>item).OR !== undefined;
}

export function isNotFilter(item: Filter): item is NotFilter {
    return (<NotFilter>item).NOT !== undefined;
}
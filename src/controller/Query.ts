/**
 * Created by jerome on 2017-02-11.
 *
 * Contains a Typescript description of the EBNF query format. The purpose of these definitions is to provide a
 * saner interface to the query information, once all the invariants have been verified.
 */
export default class Query {
    public readonly WHERE: Filter;
    public readonly OPTIONS: QueryOptions;

    constructor(WHERE: Filter, OPTIONS: QueryOptions) {
        this.WHERE = WHERE;
        this.OPTIONS = OPTIONS;
    }

    public hasOrder(): boolean {
        return typeof this.OPTIONS.ORDER === 'string';
    }
}

export interface QueryOptions {
    COLUMNS: string[];
    ORDER?: string;
    FORM: string;
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
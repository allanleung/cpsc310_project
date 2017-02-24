import {expect} from 'chai';
import QueryParser from "../src/controller/QueryParser";
import Query from "../src/controller/Query";

describe('QueryParser.parseQuery', () => {
    it('should produce a correct query when the query is valid', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                "IS": {
                    courses_id: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE",
            }
        })).to.deep.eq(new Query(
            {
                "IS": {
                    courses_id: "325"
                }
            },
            {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE",
            }
        ))
    });

    it('should accept queries with room keys', () => {
        return expect(QueryParser.parseQuery({
            "WHERE": {
                "IS": {
                    "rooms_name": "DMP_*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        })).to.deep.eq(new Query(
            {
                "IS": {
                    "rooms_name": "DMP_*"
                }
            },
            {
                "COLUMNS": [
                    "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        ))
    });

    it('should fail when given a query without an OPTIONS', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    courses_id: "315"
                }
            }
        })).to.be.null;
    });

    it('should fail when given a query without a WHERE', () => {
        return expect(QueryParser.parseQuery({
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                FORM: "TABLE"
            }
        })).to.be.null;
    });

    it('should produce the same two missing datasets when they are missing in both WHERE and COLUMNS', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                OR: [
                    {
                        IS: {
                            fake_instructor: "*pamela*"
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "fake_instructor",
                    "courses_avg"
                ],
                ORDER: "fake_instructor",
                FORM: "TABLE"
            }
        })).to.deep.eq(["fake", "fake"]);
    });

    it('should fail when given an undefined query', () => {
        return expect(QueryParser.parseQuery(undefined)).to.be.null
    });

    it('should fail when given a null query', () => {
        return expect(QueryParser.parseQuery(null)).to.be.null
    });

    it('should show nested missing datasets', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                NOT: {
                    IS: {
                        fake_avgs: "325"
                    }
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.deep.eq(["fake"])
    });

    it('should fail with a key that is not the right type in the dataset', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    courses_avg: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail with a key that is not a part of the dataset', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    courses_ids: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail with an order not found in COLUMNS', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    courses_id: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_id",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when given a bad key in order', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    courses_id: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "bad",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should produce a missing dataset in order', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    courses_id: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                    "fake_id"
                ],
                ORDER: "fake_id",
                FORM: "TABLE"
            }
        })).to.deep.eq(['fake'])
    });

    it('should produce a missing dataset in an AND', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                AND: [
                    {
                        IS: {
                            "fake_id": "325"
                        }
                    },
                    {
                        IS: {
                            "courses_id": "325"
                        }
                    }
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.deep.eq(['fake'])
    });

    it('should produce a missing dataset in an IS', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    "fake_id": "325"
                },
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.deep.eq(['fake'])
    });

    it('should fail when WHERE has more than one item', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    "courses_id": "325"
                },
                GT: {
                    "courses_avg": 90.5
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when NOT has more than one item', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                NOT: {
                    IS: {
                        "courses_id": "325"
                    },
                    GT: {
                        "courses_avg": 90.5
                    }
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when NOT is not an array', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                NOT: null
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when IS is has more than one entry', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    "courses_id": "325",
                    "courses_title": "test"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when AND is empty', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                AND: []
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when IS is empty', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when COLUMNS is empty', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    "courses_id": "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when COLUMNS is not an array', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    "courses_id": "325"
                }
            },
            OPTIONS: {
                COLUMNS: null,
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when the value of a key in an IS is a number', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: {
                    "courses_avg": 90.5
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when the value of an IS is null', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: null
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when the value of an IS is undefined', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                IS: undefined
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when one of the inner items of AND is invalid', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                AND: [
                    {
                        EQ: {
                            "courses_avg": 90,
                        },
                    },
                    null
                ]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when given an invalid AND query', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                "AND": "bad"
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when given an undefined query', () => {
        return expect(QueryParser.parseQuery({
            WHERE: null,
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail when given an undefined query', () => {
        return expect(QueryParser.parseQuery({
            WHERE: undefined,
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    });

    it('should fail on a malformed EQ', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {
                    GT: {
                        "courses_avg": { "bad": "object" }
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should fail on a malformed GT', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {
                    GT: {
                        "courses_avg": "value"
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should fail on a malformed LT', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {
                    LT: {
                        "courses_avg": "value"
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should fail on a malformed IS', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {
                    IS: {
                        IS: {
                            "bad": "value"
                        }
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should fail if FORM is not TABLE', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: [
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "OEU",
                }
            }
        )).to.be.null
    });

    it('should fail on malformed columns', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: [
                        "fake_sham",
                        "bad",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should return missing IDs if columns include non-courses ids', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {
                    "IS": {
                        "courses_dept": "asia"
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "instructors_name",
                        "fake_sham",
                        "courses_avg"
                    ],
                    ORDER: "courses_dept",
                    FORM: "TABLE",
                }
            }
        )).to.deep.eq(['instructors', 'fake'])
    });

    it('should fail if ORDER is not in COLUMNS', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_id",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should fail for an empty query', () => {
        return expect(QueryParser.parseQuery({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        )).to.be.null
    });

    it('should fail when a query contains more than one dataset', () => {
        return expect(QueryParser.parseQuery({
            WHERE: {
                OR: [{
                    AND: [
                        {
                            GT: {
                                courses_avg: 90
                            }
                        },
                        {
                            IS: {
                                rooms_shortname: "DMP"
                            }
                        }
                    ]
                }, {
                    EQ: {
                        courses_avg: 95
                    }
                }]
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        })).to.be.null
    })
});
/**
 * Created by jerome on 2017-01-19.
 *
 * Contains testst for InsightFacade.
 */

import InsightFacade from "../src/controller/InsightFacade";
const rp = require('request-promise-native');
import {expect} from 'chai';

describe("InsightFacade.addDataset", () => {
    let insightFacade: InsightFacade = null;
    let content: string;

    before(function() {
        this.timeout(10000);
        return rp({
            uri: 'https://github.com/ubccpsc/310/blob/2017jan/project/courses.zip?raw=true',
            encoding: null
        }).then((response: any) => {
            content = response;
        });
    });

    beforeEach(() => {
        insightFacade = new InsightFacade(false);
    });

    afterEach(() => {
        insightFacade = null;
    });

    it('should add an id to the dataset successfully', function() {
        this.timeout(10000);
        return insightFacade.addDataset("courses", content)
            .then((response) => {
                expect(response).to.deep.eq({
                    code: 204,
                    body: {}
                });
            });
    });

    it('should add an id to the dataset successfully twice', function() {
        this.timeout(10000);
        return insightFacade.addDataset("courses", content).then((response) => {
            expect(response).to.deep.eq({
                code: 204,
                body: {}
            });

            return insightFacade.addDataset("courses", content);
        }).then((response) => {
            expect(response).to.deep.eq({
                code: 201,
                body: {}
            });
        });
    });

    it('should cache a dataset and load the data', function() {
        this.timeout(10000);
        return insightFacade.addDataset("courses", content).then((response) => {
            expect(response).to.deep.eq({
                code: 204,
                body: {}
            });

            insightFacade = new InsightFacade();
            return insightFacade.addDataset("courses", content);
        }).then((response) => {
            expect(response).to.deep.eq({
                code: 201,
                body: {}
            });
        });
    });

    it('should fail to add an invalid dataset', () => {
        return insightFacade.addDataset("courses", null).then(response => {
            throw new Error("Should not have gotten response: " + response);
        }, err => {
            expect(err).to.deep.eq({
                code: 400,
                body: {
                    error: "Error loading zipfile"
                }
            });
        })
    })
});

describe("InsightFacade.removeDataset", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade(false);
        insightFacade.dataSet["courses"] = [];
    });

    afterEach(() => {
        insightFacade = null;
    });

    it('should remove an existing ID successfully', () => {
        return insightFacade.removeDataset("courses").then((response) => {
            expect(response).to.deep.eq({
                code: 204,
                body: {}
            });
        });
    });

    it('should fail to remove an id that hasn\'t been added', () => {
        return insightFacade.removeDataset("fake").then(response => {
            throw new Error("Should not have gotten response: " + response);
        }, err => {
            expect(err).to.deep.eq({
                code: 404,
                body: {
                    error: "Resource not found"
                }
            });
        })
    });
});

describe("InsightFacade.performQuery integration tests", () => {
    let insightFacade = new InsightFacade(false);

    before(function() {
        this.timeout(10000);
        return rp({
            uri: 'https://github.com/ubccpsc/310/blob/2017jan/project/courses.zip?raw=true',
            encoding: null
        }).then((response: any) => {
            return insightFacade.addDataset("courses", response);
        });
    });

    it('should return the correct result for a complex query', () => {
       return insightFacade.performQuery({
           "WHERE":{
               "OR":[
                   {
                       "AND":[
                           {
                               "GT":{
                                   "courses_avg":90
                               }
                           },
                           {
                               "IS":{
                                   "courses_dept":"adhe"
                               }
                           }
                       ]
                   },
                   {
                       "EQ":{
                           "courses_avg":95
                       }
                   }
               ]
           },
           "OPTIONS":{
               "COLUMNS":[
                   "courses_dept",
                   "courses_id",
                   "courses_avg"
               ],
               "ORDER":"courses_avg",
               "FORM":"TABLE"
           }
       }).then(response => {
           expect(response).to.deep.equal({
               code: 200,
               body: { render: 'TABLE',
                   result:
                       [ { courses_dept: 'adhe', courses_id: '329', courses_avg: 90.02 },
                           { courses_dept: 'adhe', courses_id: '412', courses_avg: 90.16 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.17 },
                           { courses_dept: 'adhe', courses_id: '412', courses_avg: 90.18 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.5 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.72 },
                           { courses_dept: 'adhe', courses_id: '329', courses_avg: 90.82 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.85 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.29 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.33 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.33 },
                           { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.48 },
                           { courses_dept: 'adhe', courses_id: '329', courses_avg: 92.54 },
                           { courses_dept: 'adhe', courses_id: '329', courses_avg: 93.33 },
                           { courses_dept: 'rhsc', courses_id: '501', courses_avg: 95 },
                           { courses_dept: 'bmeg', courses_id: '597', courses_avg: 95 },
                           { courses_dept: 'bmeg', courses_id: '597', courses_avg: 95 },
                           { courses_dept: 'cnps', courses_id: '535', courses_avg: 95 },
                           { courses_dept: 'cnps', courses_id: '535', courses_avg: 95 },
                           { courses_dept: 'cpsc', courses_id: '589', courses_avg: 95 },
                           { courses_dept: 'cpsc', courses_id: '589', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'sowk', courses_id: '570', courses_avg: 95 },
                           { courses_dept: 'econ', courses_id: '516', courses_avg: 95 },
                           { courses_dept: 'edcp', courses_id: '473', courses_avg: 95 },
                           { courses_dept: 'edcp', courses_id: '473', courses_avg: 95 },
                           { courses_dept: 'epse', courses_id: '606', courses_avg: 95 },
                           { courses_dept: 'epse', courses_id: '682', courses_avg: 95 },
                           { courses_dept: 'epse', courses_id: '682', courses_avg: 95 },
                           { courses_dept: 'kin', courses_id: '499', courses_avg: 95 },
                           { courses_dept: 'kin', courses_id: '500', courses_avg: 95 },
                           { courses_dept: 'kin', courses_id: '500', courses_avg: 95 },
                           { courses_dept: 'math', courses_id: '532', courses_avg: 95 },
                           { courses_dept: 'math', courses_id: '532', courses_avg: 95 },
                           { courses_dept: 'mtrl', courses_id: '564', courses_avg: 95 },
                           { courses_dept: 'mtrl', courses_id: '564', courses_avg: 95 },
                           { courses_dept: 'mtrl', courses_id: '599', courses_avg: 95 },
                           { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                           { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                           { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                           { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                           { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                           { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                           { courses_dept: 'nurs', courses_id: '424', courses_avg: 95 },
                           { courses_dept: 'nurs', courses_id: '424', courses_avg: 95 },
                           { courses_dept: 'obst', courses_id: '549', courses_avg: 95 },
                           { courses_dept: 'psyc', courses_id: '501', courses_avg: 95 },
                           { courses_dept: 'psyc', courses_id: '501', courses_avg: 95 },
                           { courses_dept: 'econ', courses_id: '516', courses_avg: 95 },
                           { courses_dept: 'adhe', courses_id: '329', courses_avg: 96.11 } ] }
           })
       })
    });

    it('should return the correct reuslt for an instructor', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "EQ":{
                    "courses_instructor": "smulders, dave"
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg",
                    "courses_instructor"
                ],
                "ORDER": "courses_id",
                "FORM":"TABLE"
            }
        }).then(response => {
            expect(response.code).to.equal(200);
            expect(response.body["result"]).to.not.be.empty;
            for (var entry of response.body["result"]) {
                expect(entry.courses_instructor).to.equal('smulders, dave');
            }
        });
    });

    it('should return the correct result for courses with a lot of auditors', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "GT":{
                    "courses_audit": 5
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_audit"
                ],
                "ORDER": "courses_id",
                "FORM":"TABLE"
            }
        }).then(response => {
            expect(response.code).to.equal(200);
            expect(response.body["result"]).to.not.be.empty;
            for (var entry of response.body["result"]) {
                expect(entry.courses_audit).to.be.above(5);
            }
        });
    });

    it('should return the correct result for courses in a dept with an average between 70 and 80', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "AND": [
                    {
                        "GT":{
                            "courses_avg": 70
                        }
                    },
                    {
                        "LT":{
                            "courses_avg": 80
                        }
                    },
                    {
                        "EQ":{
                            "courses_dept": "biol"
                        }
                    }
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_id",
                "FORM":"TABLE"
            }
        }).then(response => {
            expect(response.code).to.equal(200);
            expect(response.body["result"]).to.not.be.empty;
            for (var entry of response.body["result"]) {
                expect(entry.courses_avg).to.be.above(70);
                expect(entry.courses_avg).to.be.below(80);
                expect(entry.courses_dept).to.be.eq("biol")
            }
        });
    });



    it('should return the correct result for a simple query', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "GT":{
                    "courses_avg":97
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        }).then(response => {
            expect(response).to.deep.equal({
                code: 200,
                body: { render: 'TABLE',
                result:
                    [ { courses_dept: 'epse', courses_avg: 97.09 },
                        { courses_dept: 'math', courses_avg: 97.09 },
                        { courses_dept: 'math', courses_avg: 97.09 },
                        { courses_dept: 'epse', courses_avg: 97.09 },
                        { courses_dept: 'math', courses_avg: 97.25 },
                        { courses_dept: 'math', courses_avg: 97.25 },
                        { courses_dept: 'epse', courses_avg: 97.29 },
                        { courses_dept: 'epse', courses_avg: 97.29 },
                        { courses_dept: 'nurs', courses_avg: 97.33 },
                        { courses_dept: 'nurs', courses_avg: 97.33 },
                        { courses_dept: 'epse', courses_avg: 97.41 },
                        { courses_dept: 'epse', courses_avg: 97.41 },
                        { courses_dept: 'cnps', courses_avg: 97.47 },
                        { courses_dept: 'cnps', courses_avg: 97.47 },
                        { courses_dept: 'math', courses_avg: 97.48 },
                        { courses_dept: 'math', courses_avg: 97.48 },
                        { courses_dept: 'educ', courses_avg: 97.5 },
                        { courses_dept: 'nurs', courses_avg: 97.53 },
                        { courses_dept: 'nurs', courses_avg: 97.53 },
                        { courses_dept: 'epse', courses_avg: 97.67 },
                        { courses_dept: 'epse', courses_avg: 97.69 },
                        { courses_dept: 'epse', courses_avg: 97.78 },
                        { courses_dept: 'crwr', courses_avg: 98 },
                        { courses_dept: 'crwr', courses_avg: 98 },
                        { courses_dept: 'epse', courses_avg: 98.08 },
                        { courses_dept: 'nurs', courses_avg: 98.21 },
                        { courses_dept: 'nurs', courses_avg: 98.21 },
                        { courses_dept: 'epse', courses_avg: 98.36 },
                        { courses_dept: 'epse', courses_avg: 98.45 },
                        { courses_dept: 'epse', courses_avg: 98.45 },
                        { courses_dept: 'nurs', courses_avg: 98.5 },
                        { courses_dept: 'nurs', courses_avg: 98.5 },
                        { courses_dept: 'epse', courses_avg: 98.58 },
                        { courses_dept: 'nurs', courses_avg: 98.58 },
                        { courses_dept: 'nurs', courses_avg: 98.58 },
                        { courses_dept: 'epse', courses_avg: 98.58 },
                        { courses_dept: 'epse', courses_avg: 98.7 },
                        { courses_dept: 'nurs', courses_avg: 98.71 },
                        { courses_dept: 'nurs', courses_avg: 98.71 },
                        { courses_dept: 'eece', courses_avg: 98.75 },
                        { courses_dept: 'eece', courses_avg: 98.75 },
                        { courses_dept: 'epse', courses_avg: 98.76 },
                        { courses_dept: 'epse', courses_avg: 98.76 },
                        { courses_dept: 'epse', courses_avg: 98.8 },
                        { courses_dept: 'spph', courses_avg: 98.98 },
                        { courses_dept: 'spph', courses_avg: 98.98 },
                        { courses_dept: 'cnps', courses_avg: 99.19 },
                        { courses_dept: 'math', courses_avg: 99.78 },
                        { courses_dept: 'math', courses_avg: 99.78 } ] }})
        })
    })
});

describe("InsightFacade.performQuery", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade(false);
        insightFacade.dataSet["courses"] = [
            {
                courses_title: "hong kong cinema",
                courses_uuid: 39426,
                courses_instructor: "bailey, c. d. alison",
                courses_audit: 1,
                courses_id: "325",
                courses_pass: 71,
                courses_fail: 1,
                courses_avg: 71.18,
                courses_dept: "asia"
            },
            {
                courses_title: "hong kong cinema",
                courses_uuid: 39427,
                courses_instructor: "",
                courses_audit: 1,
                courses_id: "325",
                courses_pass: 71,
                courses_fail: 1,
                courses_avg: 71.18,
                courses_dept: "asia"
            },
            {
                courses_title: "hong kong cinema 2",
                courses_uuid: 39428,
                courses_instructor: "some guy",
                courses_audit: 1,
                courses_id: "315",
                courses_pass: 71,
                courses_fail: 1,
                courses_avg: 98.5,
                courses_dept: "asia"
            },
            {
                courses_title: "vancouver cinema",
                courses_uuid: 39429,
                courses_instructor: "some guy 2",
                courses_audit: 1,
                courses_id: "385",
                courses_pass: 71,
                courses_fail: 1,
                courses_avg: 90.5,
                courses_dept: "asia"
            }
        ];
    });
    afterEach(() => {
        insightFacade = null;
    });

    it('should return the matching entries with a simple query', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "IS": {
                        courses_id: "325"
                    }},
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_id",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result: [
                        {courses_dept: "asia", courses_id: "325", courses_avg: 71.18},
                        {courses_dept: "asia", courses_id: "325", courses_avg: 71.18}
                    ]
                }
            });
        });
    });

    it('should correctly filter when given a metric', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "GT":{
                        "courses_avg":97
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 98.5}
                    ]
                }
            });
        });
    });

    it('should correctly filter when given a metric to be less than', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "LT":{
                        "courses_avg": 80
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 71.18}
                    ]
                }
            });
        });
    });

    it('should correctly filter when using NOT', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "NOT": {
                        "IS": {
                            "courses_id": "325"
                        }
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 90.5},
                        {courses_dept: "asia", courses_avg: 98.5}
                    ]
                }
            });
        });
    });

    it('should correctly filter when using a double NOT', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "NOT": {
                        "NOT": {
                            "IS": {
                                "courses_id": "325"
                            }
                        }
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 71.18}
                    ]
                }
            });
        });
    });

    it('should correctly apply an OR query', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "OR": [
                        {
                            "GT": {
                                "courses_avg": 97
                            }
                        },
                        {
                            "IS": {
                                "courses_id": "325"
                            }
                        }
                    ]
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg",
                        "courses_id",
                    ],
                    ORDER: "courses_id",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 98.5, courses_id: "315"},
                        {courses_dept: "asia", courses_avg: 71.18, courses_id: "325"},
                        {courses_dept: "asia", courses_avg: 71.18, courses_id: "325"}
                    ]
                }
            });
        });
    });

    it('should correctly process stars in IS statements', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "IS": {
                        "courses_title": "*cinema"
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 90.5},
                    ]
                }
            });
        });
    });

    it('should correctly process final stars in IS statements', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "IS": {
                        "courses_title": "hong kong*"
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 98.5},
                    ]
                }
            });
        });
    });

    it('should produce all the data for an empty query', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 90.5},
                        {courses_dept: "asia", courses_avg: 98.5},
                    ]
                }
            });
        });
    });

    it('should work with EQ and a double value', () => {
        return insightFacade.performQuery({
                WHERE: {
                    EQ: {
                        "courses_avg": 71.18
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "TABLE",
                }
            }
        ).then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {
                    render: 'TABLE',
                    result:  [
                        {courses_dept: "asia", courses_avg: 71.18},
                        {courses_dept: "asia", courses_avg: 71.18},
                    ]
                }
            });
        });
    });

    it('should fail if ORDER is not in COLUMNS', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "ORDER was not in COLUMNS"
                }
            });
        });
    });

    it('should return missing IDs if columns include non-courses ids', () => {
        return insightFacade.performQuery({
                WHERE: {},
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 424,
                body: {
                    missing: ['instructors', 'fake']
                }
            });
        });
    });

    it('should fail on malformed columns', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "COLUMNS contained malformed key"
                }
            });
        });
    });

    it('should fail if FORM is not TABLE', () => {
        return insightFacade.performQuery({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: [
                        "courses_avg"
                    ],
                    ORDER: "courses_avg",
                    FORM: "OEU",
                }
            }
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "FORM was not TABLE"
                }
            });
        });
    });

    it('should fail on a malformed IS', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "Malformed query"
                }
            });
        });
    });

    it('should fail on a malformed LT', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "Malformed query"
                }
            });
        });
    });

    it('should fail on a malformed GT', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "Malformed query"
                }
            });
        });
    });

    it('should fail on a malformed EQ', () => {
        return insightFacade.performQuery({
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
        ).then((response) => {
            throw new Error("Test should have failed: " + response);
        }, (err) => {
            expect(err).to.deep.equal({
                code: 400,
                body: {
                    error: "Malformed query"
                }
            });
        });
    });
});

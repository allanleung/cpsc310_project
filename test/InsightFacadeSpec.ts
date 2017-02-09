/**
 * Created by jerome on 2017-01-19.
 *
 * Contains testst for InsightFacade.
 */

import InsightFacade from "../src/controller/InsightFacade";
import {expect} from 'chai';
import * as fs from 'fs';
import Log from '../src/Util';
import DataController from "../src/controller/DataController";

describe("Log", () => {
    it('should not fail when logging', () => {
        Log.trace('trace message');
        Log.info('info message');
        Log.warn('warn message');
        Log.error('error message');
        Log.test('test message');
    });
});

describe("InsightFacade.addDataset", () => {
    let insightFacade: InsightFacade = null;
    let content: string;

    before(function() {
        this.timeout(10000);
        content = fs.readFileSync('test/courses.zip').toString('base64');
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
        DataController.resetCache();
        insightFacade = new InsightFacade(true);
        return insightFacade.addDataset("courses", content).then((response) => {
            expect(response).to.deep.eq({
                code: 204,
                body: {}
            });

            insightFacade = new InsightFacade(true);
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
        insightFacade.dataSet.addDataset('courses', []);
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

describe("InsightFacade.Integration.performQuery", () => {
    let insightFacade = new InsightFacade(false);

    before(function() {
        this.timeout(10000);
        const content = fs.readFileSync('test/courses.zip').toString('base64');
        return insightFacade.addDataset('courses', content);
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

    it('should find all courses in a dept with a partial name', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "IS":{
                    "courses_dept": "*psc"
                }
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_dept",
                "FORM":"TABLE"
            }
        }).then(response => {
            expect(response.code).to.equal(200);
            expect(response.body.result).to.not.be.empty;
            for (let entry of response.body["result"]) {
                expect(entry.courses_dept).to.contain('psc');
            }
        });
    });

    it('should return courses taught by an instructor', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "IS":{
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
            expect(response.body.result).to.not.be.empty;
            for (let entry of response.body["result"]) {
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
            for (let entry of response.body["result"]) {
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
                        "IS":{
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
            for (let entry of response.body["result"]) {
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
    });


    it('should work correctly', () => {
        return insightFacade.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "IS": {
                            "courses_dept": "stat"
                        }
                    },
                    {
                        "AND": [
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_instructor": "*krishnamurthy, vikram*"
                                    }
                                }
                            },
                            {
                                "NOT": {
                                    "IS": {
                                        "courses_instructor": "*zamar, ruben*"
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_instructor",
                    "courses_avg"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {
                "render": "TABLE",
                "result": [
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 60.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 61.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "petkau, a john",
                        "courses_avg": 61.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce",
                        "courses_avg": 62.69
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 63.9
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "tait, david e n",
                        "courses_avg": 64.91
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 65.07
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 65.12
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 65.27
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 65.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce;gustafson, paul",
                        "courses_avg": 65.71
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 65.71
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "nolde, natalia",
                        "courses_avg": 65.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "nolde, natalia",
                        "courses_avg": 66.21
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 66.21
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 66.68
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 66.68
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 66.72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 67.03
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 67.2
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 67.55
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.08
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce",
                        "courses_avg": 68.08
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 68.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.18
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.24
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.43
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 68.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 68.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.59
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "burkett, craig",
                        "courses_avg": 68.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.62
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 68.68
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 68.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 68.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 68.88
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 68.9
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 68.92
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 69
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "gustafson, paul",
                        "courses_avg": 69.03
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.03
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.06
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.2
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce",
                        "courses_avg": 69.2
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.23
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 69.23
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "nolde, natalia",
                        "courses_avg": 69.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.63
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 69.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.84
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 69.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 69.96
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 70.38
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.39
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 70.41
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.43
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "petkau, a john",
                        "courses_avg": 70.43
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 70.49
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.59
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 70.59
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "tsai, yu-ling",
                        "courses_avg": 70.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 70.61
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.66
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 70.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 70.69
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 70.76
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 70.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.92
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 70.99
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "nolde, natalia",
                        "courses_avg": 70.99
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 71.02
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.06
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 71.07
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.09
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 71.09
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 71.14
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "ushey, kevin michael",
                        "courses_avg": 71.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "burkett, craig",
                        "courses_avg": 71.19
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.19
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 71.28
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.28
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.3
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 71.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.38
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 71.41
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 71.42
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 71.47
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.47
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 71.48
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 71.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.56
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 71.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 71.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 71.61
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.62
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 71.62
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei;yapa, gaitri",
                        "courses_avg": 71.65
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.74
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 71.74
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 71.76
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.78
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.78
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.87
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 71.87
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 71.9
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.95
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 71.97
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 71.99
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.01
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.04
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce",
                        "courses_avg": 72.04
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 72.08
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.08
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 72.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 72.18
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 72.21
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 72.24
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.24
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 72.27
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 72.27
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.3
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 72.32
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 72.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "tsai, yu-ling;yu, hoi yin eugenia",
                        "courses_avg": 72.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.38
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 72.42
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.46
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "gustafson, paul",
                        "courses_avg": 72.46
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "tsai, yu-ling;yu, hoi yin eugenia",
                        "courses_avg": 72.48
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "casquilho resende, camila",
                        "courses_avg": 72.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "salibian-barrera, matias",
                        "courses_avg": 72.54
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.59
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 72.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.63
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.65
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.66
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 72.66
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 72.71
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.74
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 72.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 72.76
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce",
                        "courses_avg": 72.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.81
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 72.93
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 72.97
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "murphy, kevin",
                        "courses_avg": 73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.02
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 73.06
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 73.07
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 73.12
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 73.13
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.14
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 73.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.18
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bouchard-cote, alexandre",
                        "courses_avg": 73.3
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 73.47
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.49
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 73.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei;yapa, gaitri",
                        "courses_avg": 73.54
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bouchard-cote, alexandre",
                        "courses_avg": 73.56
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bouchard-cote, alexandre",
                        "courses_avg": 73.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 73.68
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.68
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.69
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 73.71
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "gustafson, paul",
                        "courses_avg": 73.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "doucet, arnaud",
                        "courses_avg": 73.77
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 73.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 73.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.85
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.85
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 73.93
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 73.99
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.04
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.07
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 74.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 74.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 74.27
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.3
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "tsai, yu-ling",
                        "courses_avg": 74.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 74.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 74.38
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.39
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.47
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.47
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bouchard-cote, alexandre",
                        "courses_avg": 74.53
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lee, melissa",
                        "courses_avg": 74.66
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 74.81
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 74.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 74.85
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.85
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.96
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "joe, harry sue wah",
                        "courses_avg": 74.98
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 74.98
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "ushey, kevin michael",
                        "courses_avg": 75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 75.12
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.28
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.37
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 75.37
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 75.46
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 75.47
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 75.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "erdelyi, shannon",
                        "courses_avg": 75.74
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "ushey, kevin michael",
                        "courses_avg": 75.76
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 75.81
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.81
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 75.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 75.87
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.88
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yapa, gaitri",
                        "courses_avg": 75.88
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.89
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "yu, hoi yin eugenia",
                        "courses_avg": 75.93
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 75.97
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "salibian-barrera, matias",
                        "courses_avg": 76.3
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 76.49
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.51
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 76.54
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.66
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.66
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 76.8
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 76.81
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "lim, yew wei",
                        "courses_avg": 77.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 77.22
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 77.22
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "welch, william",
                        "courses_avg": 77.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 77.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "dunham, bruce",
                        "courses_avg": 77.41
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 77.41
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 77.84
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 77.84
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 78.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 78.72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 78.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 78.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 79.24
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "salibian-barrera, matias",
                        "courses_avg": 79.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 79.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "marin, michael",
                        "courses_avg": 79.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 79.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 79.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 79.92
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 79.92
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 80.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang;yapa, gaitri",
                        "courses_avg": 80.17
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "petkau, a john",
                        "courses_avg": 80.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 80.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 81.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 81.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "leung, andy chun yin",
                        "courses_avg": 82.08
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 82.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 82.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 82.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 82.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 82.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "brant, rollin frederick",
                        "courses_avg": 82.6
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 82.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 82.86
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 83.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 83.31
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 83.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 83.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 84.44
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 84.44
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 84.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 84.79
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.29
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.29
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 85.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 85.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 86.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 86.71
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 86.71
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 86.95
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "mostafavi, sara",
                        "courses_avg": 86.95
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87.11
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87.33
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "brant, rollin frederick",
                        "courses_avg": 87.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87.67
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bryan, jennifer frazier;pavlidis, paul",
                        "courses_avg": 87.8
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87.8
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 87.93
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.09
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.18
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bryan, jennifer frazier;pavlidis, paul",
                        "courses_avg": 88.18
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.2
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 88.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.5
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 88.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 88.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 89.23
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.23
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 89.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.25
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "chen, jiahua",
                        "courses_avg": 89.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.57
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bryan, jennifer frazier;cohen freue, gabriela;pavlidis, paul",
                        "courses_avg": 89.59
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.59
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 89.72
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "wu, lang",
                        "courses_avg": 89.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.75
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 89.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bouchard-cote, alexandre",
                        "courses_avg": 89.83
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "cohen freue, gabriela",
                        "courses_avg": 90.29
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 90.29
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 90.9
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "bryan, jennifer frazier;cohen freue, gabriela",
                        "courses_avg": 90.9
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 91.73
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 92
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 93
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 93
                    },
                    {
                        "courses_dept": "stat",
                        "courses_instructor": "",
                        "courses_avg": 94.7
                    }
                ]
            }
        }))
    });

    it('should be able to find all the courses in a department not taught by a specific person', () => {
        return insightFacade.performQuery({
            "WHERE": {
                "AND": [
                    {
                        "NOT": {
                            "IS": {
                                "courses_instructor": "*prince, richard*"
                            }
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "visa"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_id",
                    "courses_instructor"
                ],
                "ORDER": "courses_avg",
                "FORM": "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {
                "render": "TABLE",
                "result": [{
                    "courses_dept": "visa",
                    "courses_avg": 65.5,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 68.72,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 68.75,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 68.86,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69,
                    "courses_id": "210",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.06,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.13,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.26,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.46,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.53,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.62,
                    "courses_id": "183",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.77,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 69.79,
                    "courses_id": "230",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.05,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.14,
                    "courses_id": "240",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.18,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.18,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.24,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.25,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.27,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.35,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.48,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.56,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.61,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.76,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.82,
                    "courses_id": "311",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.82,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 70.94,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71,
                    "courses_id": "180",
                    "courses_instructor": "lee, evan"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71,
                    "courses_id": "210",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.03,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.06,
                    "courses_id": "220",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.06,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.08,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.11,
                    "courses_id": "210",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.21,
                    "courses_id": "210",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.21,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.32,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.43,
                    "courses_id": "180",
                    "courses_instructor": "peter, ryan"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.5,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.53,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.6,
                    "courses_id": "240",
                    "courses_instructor": "lemmens, marilou"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.64,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.64,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.67,
                    "courses_id": "183",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.75,
                    "courses_id": "110",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.85,
                    "courses_id": "341",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.86,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.86,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.87,
                    "courses_id": "381",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.87,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.9,
                    "courses_id": "183",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 71.94,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.23,
                    "courses_id": "380",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.23,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.28,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.35,
                    "courses_id": "250",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.41,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.5,
                    "courses_id": "220",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.57,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.57,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.62,
                    "courses_id": "250",
                    "courses_instructor": "yumang, jade"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.63,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.63,
                    "courses_id": "311",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.65,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.65,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.74,
                    "courses_id": "250",
                    "courses_instructor": "yumang, jade"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.83,
                    "courses_id": "241",
                    "courses_instructor": "tamer, damla"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.88,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.88,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.92,
                    "courses_id": "183",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.97,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 72.97,
                    "courses_id": "380",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.04,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.07,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.1,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.14,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.15,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.15,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.16,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.16,
                    "courses_id": "230",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.18,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.18,
                    "courses_id": "183",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.23,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.23,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.25,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.27,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.39,
                    "courses_id": "230",
                    "courses_instructor": "donald, rebecca"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.39,
                    "courses_id": "241",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.4,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.4,
                    "courses_id": "330",
                    "courses_instructor": "donald, rebecca"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.48,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.55,
                    "courses_id": "180",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.68,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.74,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.79,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.81,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.82,
                    "courses_id": "210",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.93,
                    "courses_id": "320",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.94,
                    "courses_id": "250",
                    "courses_instructor": "hawrysio, denise"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 73.97,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74,
                    "courses_id": "311",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.01,
                    "courses_id": "110",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.05,
                    "courses_id": "230",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.05,
                    "courses_id": "210",
                    "courses_instructor": "petrova, lux"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.11,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.11,
                    "courses_id": "210",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.14,
                    "courses_id": "331",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.14,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.15,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.2,
                    "courses_id": "210",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.22,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.29,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.29,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.3,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.32,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.35,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.35,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.35,
                    "courses_id": "110",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.38,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.4,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.4,
                    "courses_id": "370",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.4,
                    "courses_id": "370",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.4,
                    "courses_id": "351",
                    "courses_instructor": "yumang, jade"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.4,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.41,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.41,
                    "courses_id": "340",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.43,
                    "courses_id": "330",
                    "courses_instructor": "donald, rebecca"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.43,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.45,
                    "courses_id": "250",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.46,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.5,
                    "courses_id": "220",
                    "courses_instructor": "cesar marin, nelly"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.5,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.5,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.52,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.52,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.52,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.55,
                    "courses_id": "110",
                    "courses_instructor": "levin, simon"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.55,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.55,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.59,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.59,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.61,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.67,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.67,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.7,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.7,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.74,
                    "courses_id": "330",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.75,
                    "courses_id": "321",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.76,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.76,
                    "courses_id": "480",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.77,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.79,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.94,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 74.98,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.02,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.02,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.05,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.05,
                    "courses_id": "320",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.06,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.07,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.1,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.14,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.14,
                    "courses_id": "380",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.14,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.17,
                    "courses_id": "183",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.18,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.18,
                    "courses_id": "381",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.18,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.25,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.25,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio e;mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.25,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.25,
                    "courses_id": "310",
                    "courses_instructor": "hite, joshua"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.29,
                    "courses_id": "260",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.3,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.31,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.42,
                    "courses_id": "320",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.45,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.47,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.5,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.5,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.52,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.57,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.58,
                    "courses_id": "230",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.59,
                    "courses_id": "210",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.6,
                    "courses_id": "241",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.6,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.62,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.62,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.63,
                    "courses_id": "250",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.63,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.63,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.67,
                    "courses_id": "331",
                    "courses_instructor": "peter, ryan"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.73,
                    "courses_id": "230",
                    "courses_instructor": "donald, rebecca"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.76,
                    "courses_id": "220",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.76,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.78,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.79,
                    "courses_id": "183",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.81,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.85,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.86,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.87,
                    "courses_id": "110",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.92,
                    "courses_id": "220",
                    "courses_instructor": "grafton, frances"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.93,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.95,
                    "courses_id": "241",
                    "courses_instructor": "tamer, damla"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.95,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.95,
                    "courses_id": "230",
                    "courses_instructor": "james-kretschmar, katherine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.95,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 75.97,
                    "courses_id": "210",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76,
                    "courses_id": "320",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.03,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.03,
                    "courses_id": "381",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.04,
                    "courses_id": "110",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.06,
                    "courses_id": "240",
                    "courses_instructor": "hite, joshua"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.07,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.11,
                    "courses_id": "230",
                    "courses_instructor": "donald, rebecca"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.11,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.11,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.13,
                    "courses_id": "321",
                    "courses_instructor": "peter, ryan"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.14,
                    "courses_id": "180",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.15,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.15,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.18,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.19,
                    "courses_id": "250",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.25,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.25,
                    "courses_id": "351",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.27,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.36,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.39,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.4,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.4,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.41,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.44,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.44,
                    "courses_id": "241",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.45,
                    "courses_id": "230",
                    "courses_instructor": "peter, ryan"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.46,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.48,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.5,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.52,
                    "courses_id": "380",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.52,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.53,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.55,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.56,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.58,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.59,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.59,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.61,
                    "courses_id": "110",
                    "courses_instructor": "levin, simon"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.67,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.67,
                    "courses_id": "240",
                    "courses_instructor": "hite, joshua"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.68,
                    "courses_id": "381",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.68,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.68,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.69,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.73,
                    "courses_id": "352",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.73,
                    "courses_id": "352",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.74,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.74,
                    "courses_id": "241",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.74,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.75,
                    "courses_id": "330",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.76,
                    "courses_id": "220",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.77,
                    "courses_id": "310",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.77,
                    "courses_id": "310",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.79,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.82,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.83,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.84,
                    "courses_id": "210",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.84,
                    "courses_id": "330",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.85,
                    "courses_id": "230",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.86,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.87,
                    "courses_id": "250",
                    "courses_instructor": "yumang, jade"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.88,
                    "courses_id": "210",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.9,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.91,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.91,
                    "courses_id": "341",
                    "courses_instructor": "starling, dan"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.93,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.95,
                    "courses_id": "330",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 76.96,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "210",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.1,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.1,
                    "courses_id": "351",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.11,
                    "courses_id": "220",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.15,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.15,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.16,
                    "courses_id": "230",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.19,
                    "courses_id": "210",
                    "courses_instructor": "hite, joshua"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.19,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.21,
                    "courses_id": "220",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.21,
                    "courses_id": "230",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.22,
                    "courses_id": "183",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.23,
                    "courses_id": "480",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.23,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.28,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.31,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.31,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.34,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.35,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.38,
                    "courses_id": "210",
                    "courses_instructor": "levin, simon"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.38,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.42,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.42,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.44,
                    "courses_id": "240",
                    "courses_instructor": "hite, joshua"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.44,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.47,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.47,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.48,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.5,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.5,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.5,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.5,
                    "courses_id": "320",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.5,
                    "courses_id": "380",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.51,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.52,
                    "courses_id": "180",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.53,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.55,
                    "courses_id": "183",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.56,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.58,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.6,
                    "courses_id": "230",
                    "courses_instructor": "aitken, stephanie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.65,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.65,
                    "courses_id": "321",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.68,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.71,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.74,
                    "courses_id": "480",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.74,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.74,
                    "courses_id": "311",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.74,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.75,
                    "courses_id": "381",
                    "courses_instructor": "mccrum, phillip;weih, jennifer"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.75,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.75,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.75,
                    "courses_id": "321",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.76,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.77,
                    "courses_id": "481",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.77,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.78,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.79,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.82,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.83,
                    "courses_id": "360",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.83,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.84,
                    "courses_id": "210",
                    "courses_instructor": "levin, simon"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.86,
                    "courses_id": "241",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.88,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.88,
                    "courses_id": "180",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.9,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.93,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.93,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.93,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.93,
                    "courses_id": "481",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.94,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.94,
                    "courses_id": "220",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 77.95,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "210",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "241",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78,
                    "courses_id": "321",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.04,
                    "courses_id": "311",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.04,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.05,
                    "courses_id": "341",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.08,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.09,
                    "courses_id": "240",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.1,
                    "courses_id": "351",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.1,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.12,
                    "courses_id": "240",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.15,
                    "courses_id": "340",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.17,
                    "courses_id": "360",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.19,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.25,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.25,
                    "courses_id": "321",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.25,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.28,
                    "courses_id": "330",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.29,
                    "courses_id": "220",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.29,
                    "courses_id": "341",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.29,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.31,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.31,
                    "courses_id": "480",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.32,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.32,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.33,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.33,
                    "courses_id": "331",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.33,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.33,
                    "courses_id": "320",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.36,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.39,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.4,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.4,
                    "courses_id": "360",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.4,
                    "courses_id": "331",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.41,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.41,
                    "courses_id": "320",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.43,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.43,
                    "courses_id": "331",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.44,
                    "courses_id": "230",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.44,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.44,
                    "courses_id": "230",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.46,
                    "courses_id": "480",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.46,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.47,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.48,
                    "courses_id": "351",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.48,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.49,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.5,
                    "courses_id": "340",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.53,
                    "courses_id": "311",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.53,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.53,
                    "courses_id": "220",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.56,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.56,
                    "courses_id": "481",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.57,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.57,
                    "courses_id": "321",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.59,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.59,
                    "courses_id": "331",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.6,
                    "courses_id": "480",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.6,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.66,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.69,
                    "courses_id": "250",
                    "courses_instructor": "yumang, jade"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.75,
                    "courses_id": "230",
                    "courses_instructor": "aitken, stephanie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.76,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.76,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.81,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.82,
                    "courses_id": "260",
                    "courses_instructor": "billings, scott"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.84,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.85,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.86,
                    "courses_id": "241",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.9,
                    "courses_id": "321",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.9,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.91,
                    "courses_id": "481",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.91,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.94,
                    "courses_id": "330",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.95,
                    "courses_id": "250",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.97,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 78.97,
                    "courses_id": "481",
                    "courses_instructor": "d'onofrio, christine"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79,
                    "courses_id": "250",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79,
                    "courses_id": "311",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.1,
                    "courses_id": "250",
                    "courses_instructor": "smolinski, mikolaj"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.14,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.15,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.21,
                    "courses_id": "480",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.21,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.24,
                    "courses_id": "260",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.25,
                    "courses_id": "360",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.25,
                    "courses_id": "220",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.26,
                    "courses_id": "320",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.27,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.27,
                    "courses_id": "351",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.28,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.29,
                    "courses_id": "340",
                    "courses_instructor": "jones, barrie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.29,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.29,
                    "courses_id": "230",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.3,
                    "courses_id": "220",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.33,
                    "courses_id": "241",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.35,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.35,
                    "courses_id": "481",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.35,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.35,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.38,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.42,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.42,
                    "courses_id": "320",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.42,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.46,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.47,
                    "courses_id": "331",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.47,
                    "courses_id": "331",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.5,
                    "courses_id": "220",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.5,
                    "courses_id": "340",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.5,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.56,
                    "courses_id": "220",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.56,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.62,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.67,
                    "courses_id": "330",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.68,
                    "courses_id": "220",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.68,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.71,
                    "courses_id": "321",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.76,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.87,
                    "courses_id": "220",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.94,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.94,
                    "courses_id": "480",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 79.94,
                    "courses_id": "260",
                    "courses_instructor": "billings, scott"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80,
                    "courses_id": "183",
                    "courses_instructor": "fernandez rodriguez, antonio e"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80,
                    "courses_id": "481",
                    "courses_instructor": "gu, xiong"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80,
                    "courses_id": "481",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.05,
                    "courses_id": "240",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.11,
                    "courses_id": "210",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.14,
                    "courses_id": "330",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.15,
                    "courses_id": "240",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.15,
                    "courses_id": "321",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.15,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.22,
                    "courses_id": "220",
                    "courses_instructor": "fernandez rodriguez, antonio"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.31,
                    "courses_id": "220",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.32,
                    "courses_id": "340",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.44,
                    "courses_id": "320",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.47,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.47,
                    "courses_id": "380",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.5,
                    "courses_id": "330",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.63,
                    "courses_id": "330",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.63,
                    "courses_id": "250",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.64,
                    "courses_id": "321",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.79,
                    "courses_id": "380",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.79,
                    "courses_id": "380",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.84,
                    "courses_id": "220",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 80.86,
                    "courses_id": "330",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81,
                    "courses_id": "330",
                    "courses_instructor": "aitken, stephanie"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81,
                    "courses_id": "360",
                    "courses_instructor": "levin, simon"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81,
                    "courses_id": "360",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81,
                    "courses_id": "320",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.26,
                    "courses_id": "351",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.26,
                    "courses_id": "351",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.28,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.28,
                    "courses_id": "180",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.33,
                    "courses_id": "331",
                    "courses_instructor": "mccrum, phillip"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.56,
                    "courses_id": "352",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.56,
                    "courses_id": "352",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.57,
                    "courses_id": "321",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.6,
                    "courses_id": "220",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.63,
                    "courses_id": "381",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.63,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.79,
                    "courses_id": "250",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.84,
                    "courses_id": "320",
                    "courses_instructor": "zeigler, barbara"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 81.9,
                    "courses_id": "220",
                    "courses_instructor": "mackenzie, elizabeth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 82.29,
                    "courses_id": "311",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 82.29,
                    "courses_id": "311",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 83.04,
                    "courses_id": "381",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 83.04,
                    "courses_id": "381",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 83.05,
                    "courses_id": "240",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 84.14,
                    "courses_id": "370",
                    "courses_instructor": "busby, cathy"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 84.14,
                    "courses_id": "370",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 84.29,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 84.33,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 85.83,
                    "courses_id": "581",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 85.83,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86,
                    "courses_id": "581",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.33,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.33,
                    "courses_id": "582",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.4,
                    "courses_id": "582",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.4,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.8,
                    "courses_id": "581",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.83,
                    "courses_id": "581",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.83,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.86,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 86.86,
                    "courses_id": "582",
                    "courses_instructor": "james, gareth"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87,
                    "courses_id": "581",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.17,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.6,
                    "courses_id": "581",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.6,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.78,
                    "courses_id": "370",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.78,
                    "courses_id": "370",
                    "courses_instructor": "busby, cathy;kennedy, garry"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.83,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 87.83,
                    "courses_id": "582",
                    "courses_instructor": "roy, marina"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88,
                    "courses_id": "582",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.33,
                    "courses_id": "581",
                    "courses_instructor": "pina, manuel"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.33,
                    "courses_id": "581",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.45,
                    "courses_id": "370",
                    "courses_instructor": "busby, cathy;kennedy, garry"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.45,
                    "courses_id": "370",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.5,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.67,
                    "courses_id": "582",
                    "courses_instructor": ""
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 88.67,
                    "courses_id": "582",
                    "courses_instructor": "claxton, dana"
                }, {
                    "courses_dept": "visa",
                    "courses_avg": 89,
                    "courses_id": "582",
                    "courses_instructor": "james, gareth"
                }]
            }
        }));
    });

    it('should produce the correct partial list', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "OR": [
                    {"IS":{"courses_instructor": "*pamela*"}}
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_instructor",
                    "courses_avg"
                ],
                "ORDER":"courses_avg",
                "FORM":"TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {"render":"TABLE","result":[{"courses_dept":"math","courses_instructor":"desaulniers, shawn;leung, fok-shuen;sargent, pamela","courses_avg":56.43},{"courses_dept":"math","courses_instructor":"leung, fok-shuen;sargent, pamela;tba","courses_avg":58.42},{"courses_dept":"math","courses_instructor":"leung, fok-shuen;sargent, pamela;wong, tom","courses_avg":62.47},{"courses_dept":"math","courses_instructor":"leung, fok-shuen;sargent, pamela;tba","courses_avg":63.03},{"courses_dept":"biol","courses_instructor":"couch, brett;kalas, pamela","courses_avg":63.13},{"courses_dept":"geob","courses_instructor":"gaitan, carlos;o, pamela","courses_avg":65.19},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":66.2},{"courses_dept":"geob","courses_instructor":"donner, simon;o, pamela","courses_avg":67.08},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":68.02},{"courses_dept":"geob","courses_instructor":"gaitan, carlos;o, pamela","courses_avg":68.05},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":68.28},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":68.28},{"courses_dept":"geob","courses_instructor":"donner, simon;o, pamela","courses_avg":70.78},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":72.1},{"courses_dept":"biol","courses_instructor":"kalas, pamela;leander, celeste","courses_avg":73.47},{"courses_dept":"engl","courses_instructor":"dalziel, pamela","courses_avg":73.5},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":73.7},{"courses_dept":"engl","courses_instructor":"dalziel, pamela","courses_avg":73.96},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":75.17},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":76.39},{"courses_dept":"engl","courses_instructor":"dalziel, pamela","courses_avg":76.47},{"courses_dept":"apsc","courses_instructor":"berndt, annette;jaeger, carol patricia;rogalski, pamela","courses_avg":76.58},{"courses_dept":"medg","courses_instructor":"hoodless, pamela;juriloff, diana;robinson, wendy","courses_avg":76.68},{"courses_dept":"biol","courses_instructor":"kalas, pamela;klenz, jennifer","courses_avg":77.74},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":78.87},{"courses_dept":"biol","courses_instructor":"kalas, pamela;klenz, jennifer","courses_avg":79.18},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":79.29},{"courses_dept":"apsc","courses_instructor":"rogalski, pamela","courses_avg":79.66},{"courses_dept":"medg","courses_instructor":"hoodless, pamela;lefebvre, louis;van raamsdonk, catherine","courses_avg":80.18},{"courses_dept":"biol","courses_instructor":"kalas, pamela;nomme, kathy margaret;sun, chin","courses_avg":80.34},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":80.48},{"courses_dept":"nurs","courses_instructor":"ratner, pamela","courses_avg":80.78},{"courses_dept":"nurs","courses_instructor":"ratner, pamela","courses_avg":80.8},{"courses_dept":"biol","courses_instructor":"kalas, pamela","courses_avg":81.32},{"courses_dept":"biol","courses_instructor":"couch, brett;germano, bernardita;kalas, pamela;kopp, christopher;moussavi, maryam;nomme, kathy margaret;norman, lynn;sun, chin","courses_avg":81.42},{"courses_dept":"medg","courses_instructor":"hoodless, pamela;juriloff, diana;lefebvre, louis;robinson, wendy","courses_avg":81.53},{"courses_dept":"medg","courses_instructor":"hoodless, pamela;juriloff, diana;lefebvre, louis;robinson, wendy","courses_avg":81.62},{"courses_dept":"engl","courses_instructor":"dalziel, pamela","courses_avg":82},{"courses_dept":"medg","courses_instructor":"hoodless, pamela;juriloff, diana;lefebvre, louis;robinson, wendy","courses_avg":83.07},{"courses_dept":"apsc","courses_instructor":"rogalski, pamela","courses_avg":83.28},{"courses_dept":"nurs","courses_instructor":"ratner, pamela","courses_avg":85.56},{"courses_dept":"nurs","courses_instructor":"ratner, pamela;varcoe, colleen","courses_avg":86.92},{"courses_dept":"nurs","courses_instructor":"ratner, pamela;varcoe, colleen","courses_avg":87.13},{"courses_dept":"nurs","courses_instructor":"ratner, pamela;varcoe, colleen","courses_avg":87.48},{"courses_dept":"cnps","courses_instructor":"hirakata, pamela","courses_avg":87.55}]}
        }));
    });

    it('should produce the correct list of instructors', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "OR": [
                    {"IS":{"courses_instructor": "*pamela*"}}
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_instructor"
                ],
                "ORDER":"courses_instructor",
                "FORM":"TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {"render":"TABLE","result":[{"courses_instructor":"berndt, annette;jaeger, carol patricia;rogalski," + " pamela"},{"courses_instructor":"couch, brett;germano, bernardita;kalas, pamela;kopp, christopher;moussavi, maryam;nomme, kathy margaret;norman, lynn;sun, chin"},{"courses_instructor":"couch, brett;kalas, pamela"},{"courses_instructor":"dalziel, pamela"},{"courses_instructor":"dalziel, pamela"},{"courses_instructor":"dalziel, pamela"},{"courses_instructor":"dalziel, pamela"},{"courses_instructor":"desaulniers, shawn;leung, fok-shuen;sargent, pamela"},{"courses_instructor":"donner, simon;o, pamela"},{"courses_instructor":"donner, simon;o, pamela"},{"courses_instructor":"gaitan, carlos;o, pamela"},{"courses_instructor":"gaitan, carlos;o, pamela"},{"courses_instructor":"hirakata, pamela"},{"courses_instructor":"hoodless, pamela;juriloff, diana;lefebvre, louis;robinson, wendy"},{"courses_instructor":"hoodless, pamela;juriloff, diana;lefebvre, louis;robinson, wendy"},{"courses_instructor":"hoodless, pamela;juriloff, diana;lefebvre, louis;robinson, wendy"},{"courses_instructor":"hoodless, pamela;juriloff, diana;robinson, wendy"},{"courses_instructor":"hoodless, pamela;lefebvre, louis;van raamsdonk, catherine"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela"},{"courses_instructor":"kalas, pamela;klenz, jennifer"},{"courses_instructor":"kalas, pamela;klenz, jennifer"},{"courses_instructor":"kalas, pamela;leander, celeste"},{"courses_instructor":"kalas, pamela;nomme, kathy margaret;sun, chin"},{"courses_instructor":"leung, fok-shuen;sargent, pamela;tba"},{"courses_instructor":"leung, fok-shuen;sargent, pamela;tba"},{"courses_instructor":"leung, fok-shuen;sargent, pamela;wong, tom"},{"courses_instructor":"ratner, pamela"},{"courses_instructor":"ratner, pamela"},{"courses_instructor":"ratner, pamela"},{"courses_instructor":"ratner, pamela;varcoe, colleen"},{"courses_instructor":"ratner, pamela;varcoe, colleen"},{"courses_instructor":"ratner, pamela;varcoe, colleen"},{"courses_instructor":"rogalski, pamela"},{"courses_instructor":"rogalski, pamela"}]}
        }));
    });
});

describe("InsightFacade.performQuery", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade(false);
        insightFacade.dataSet.addDataset('courses', [
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
        ]);
    });
    afterEach(() => {
        insightFacade = null;
    });

    it('should produce the courses with averages between 85 and 98', () => {
        return insightFacade.performQuery({
            WHERE: {
                AND: [
                    {
                        GT: {
                            courses_avg: 85
                        }
                    },
                    {
                        LT: {
                            courses_avg: 95
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
                FORM: "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {
                render: 'TABLE',
                result: [
                    {courses_dept: "asia", courses_id: "385", courses_avg: 90.5}
                ]
            }
        }));
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

    it('should correctly process surrounding stars in IS statements', () => {
        return insightFacade.performQuery({
                WHERE: {
                    "IS": {
                        "courses_title": "*kong*"
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

    it('should fail for an empty query', () => {
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
            throw new Error("Should not have produce response");
        }, err => {
            expect(err).to.deep.eq({
                code: 400,
                body: {
                    error: "Malformed query"
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
                    error: "Malformed query"
                }
            });
        });
    });

    it('should return missing IDs if columns include non-courses ids', () => {
        return insightFacade.performQuery({
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
                    error: "Malformed query"
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
                    error: "Malformed query"
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

    it('should fail when given an undefined query', () => {
        return insightFacade.performQuery({
            WHERE: undefined,
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }).then(response => {
            throw new Error("Should not have gotten response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when given an undefined query', () => {
        return insightFacade.performQuery({
            WHERE: null,
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }).then(() => {
            throw new Error("Should not have gotten response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when given an invalid AND query', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have gotten response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when one of the inner items of AND is invalid', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have gotten result");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }));
    });

    it('should fail when the value of an IS is undefined', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when the value of an IS is null', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when the value of a key in an IS is a number', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when COLUMNS is not an array', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when COLUMNS is empty', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when IS is empty', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when AND is empty', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when IS is has more than one entry', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when NOT is not an array', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when NOT has more than one item', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when WHERE has more than one item', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should produce a missing dataset in an IS', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ['fake']
            }
        }))
    });

    it('should produce a missing dataset in an AND', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ['fake']
            }
        }))
    });

    it('should produce a missing dataset in order', () => {
        return insightFacade.performQuery({
            WHERE: {
                IS: {
                    "courses_id": "325"
                },
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg",
                    "fake_id"
                ],
                ORDER: "fake_id",
                FORM: "TABLE"
            }
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ['fake']
            }
        }))
    });

    it('should fail when given a bad key in order', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: 'Malformed query'
            }
        }))
    });

    it('should fail with an order not found in COLUMNS', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail with a key that is not part of the dataset', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail with a key that is not the right type in the dataset', () => {
        return insightFacade.performQuery({
            WHERE: {
                IS: {
                    courses_avg: "325"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_avg"
                ],
                ORDER: "courses_avg",
                FORM: "TABLE"
            }
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should show nested missing datasets', () => {
        return insightFacade.performQuery({
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
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ['fake']
            }
        }))
    });

    it('should fail when given a null query', () => {
        return insightFacade.performQuery(null).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: 'Malformed query'
            }
        }))
    });

    it('should fail when given an undefined query', () => {
        return insightFacade.performQuery(undefined).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: 'Malformed query'
            }
        }))
    });

    it('should produce the same two missing datasets when they are missing in both WHERE and COLUMNS', () => {
        return insightFacade.performQuery({
            "WHERE":{
                "OR": [
                    {"IS":{"fake_instructor": "*pamela*"}}
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "fake_instructor",
                    "courses_avg"
                ],
                "ORDER":"fake_instructor",
                "FORM":"TABLE"
            }
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ["fake", "fake"]
            }
        }))
    });

    it('should return a correct result when not given a sorting order', () => {
        return insightFacade.performQuery({
            WHERE: {
                IS: {
                    courses_id: "315"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                FORM: "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {
                render: 'TABLE',
                result: [
                    {courses_dept: "asia", courses_id: "315", courses_avg: 98.5}
                ]
            }
        }))
    });

    it('should fail when given a query without a WHERE', () => {
        return insightFacade.performQuery({
            OPTIONS: {
                COLUMNS: [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                FORM: "TABLE"
            }
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });

    it('should fail when given a query without an OPTIONS', () => {
        return insightFacade.performQuery({
            WHERE: {
                IS: {
                    courses_id: "315"
                }
            }
        }).then(() => {
            throw new Error("Should not have received response");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: "Malformed query"
            }
        }))
    });
});

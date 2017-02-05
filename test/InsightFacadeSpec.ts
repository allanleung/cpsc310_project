/**
 * Created by jerome on 2017-01-19.
 */

import InsightFacade from "../src/controller/InsightFacade";
const rp = require('request-promise-native');
import {expect} from 'chai';
import {QueryRequest} from "../src/controller/IInsightFacade";

describe("InsightFacade.addDataset", () => {
    let insightFacade: InsightFacade = null;
    let content: string;

    before(() => {
        return rp({
            uri: 'https://github.com/ubccpsc/310/blob/2017jan/project/courses.zip?raw=true',
            encoding: null
        }).then((response: any) => {
            content = response;
        });
    });

    beforeEach(() => {
        insightFacade = new InsightFacade();
    });

    afterEach(() => {
        insightFacade = null;
    });

    it('should add an id to the dataset successfully', (done) => {
        insightFacade.addDataset("courses/VISA110", content)
            .then((response) => {
                expect(response).to.deep.eq({
                    code: 204,
                    body: {}
                });

                done();
            }).catch((err) => {
            done(err);
        });
    });

    it('should add an id to the dataset successfully twice', (done) => {
        (function (insightFacade) {
            insightFacade.addDataset("courses/VISA110", content).then((response) => {
                expect(response).to.deep.eq({
                    code: 204,
                    body: {}
                });

                return insightFacade.addDataset("courses/VISA110", content);
            }).then((response) => {
                expect(response).to.deep.eq({
                    code: 201,
                    body: {}
                });

                done();
            }).catch((err) => {
                done(err);
            });
        })(insightFacade);
    });

    it('should fail to add an invalid id', (done) => {
        (function (insightFacade) {
            insightFacade.addDataset("courses/invalid", content).then((response) => {
                done(new Error('there should not be a response'));
            }).catch((err) => {
                expect(err).to.deep.eq({
                    code: 400,
                    body: {
                        error: {}
                    }
                });

                done();
            });
        })(insightFacade);
    });

});

describe("InsightFacade.removeDataset", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade();
        insightFacade.dataSet.set("courses/VISA110", []);
    });

    afterEach(() => {
        insightFacade = null;
    });

    it('should remove an existing ID successfully', () => {
        insightFacade.removeDataset("courses/VISA110").then((response) => {
            expect(response).to.deep.eq({
                code: 200,
                body: {}
            });
        });
    });
});

describe("InsightFacade.performQuery", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade();
        insightFacade.dataSet.set("dataset1", [
            // this is the part i dontk now what dataset1 is...
            // i want to
            {
                courses_dept: "Econ",
                courses_id: 1,
                courses_avg:50,
                courses_instructor: "kevin",
                courses_title: "Baby Econ",
                courses_pass: 100,
                courses_fail: 200,
                courses_audit: 300,
                courses_uuid: "999",
            }
        ]);
    });
    afterEach(() => {
        insightFacade = null;
    });

    it('This is sample from D1 Page', () => {
        insightFacade.performQuery({
                WHERE: {
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
                    ]},
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
                code: 400,
                body: {
                    render: 'TABLE',
                    result: [ { courses_dept: 'adhe', courses_id: '329', courses_avg: 90.02 },
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
                        { courses_dept: 'adhe', courses_id: '329', courses_avg: 96.11 } ]
                }
            });
        });

    });
    it('This is sample from D1 Page', () => {
        insightFacade.performQuery({
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
                code: 400,
                body: {
                    render: 'TABLE',
                    result:  [ { courses_dept: 'epse', courses_avg: 97.09 },
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
                        { courses_dept: 'math', courses_avg: 99.78 } ]
                }
            });
        });

    });

});

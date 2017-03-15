/**
 * Created by jerome on 2017-01-19.
 *
 * Contains testst for InsightFacade.
 */
import InsightFacade from "../src/controller/InsightFacade";
import {expect} from "chai";
import * as fs from "fs";
import DataController from "../src/controller/DataController";

describe("InsightFacade.addDataset", () => {
    let insightFacade: InsightFacade = null;
    let courses: string;
    let rooms: string;

    before(function() {
        this.timeout(10000);
        courses = fs.readFileSync('test/courses.zip').toString('base64');
        rooms = fs.readFileSync('test/rooms.zip').toString('base64');
    });

    beforeEach(() => {
        insightFacade = new InsightFacade(false);
    });

    afterEach(() => {
        insightFacade = null;
    });

    it('should add courses to the dataset successfully', function() {
        this.timeout(10000);
        return insightFacade.addDataset("courses", courses)
            .then((response) => {
                expect(response).to.deep.eq({
                    code: 204,
                    body: {}
                });
            });
    });

    it('should add rooms to the dataset successfully', function() {
        this.timeout(10000);
        return insightFacade.addDataset("rooms", rooms)
            .then((response) => {
                expect(response).to.deep.eq({
                    code: 204,
                    body: {}
                });
            });
    });

    it('should add an id to the dataset successfully twice', function() {
        this.timeout(10000);
        return insightFacade.addDataset("courses", courses).then((response) => {
            expect(response).to.deep.eq({
                code: 204,
                body: {}
            });

            return insightFacade.addDataset("courses", courses);
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
        return insightFacade.addDataset("courses", courses).then((response) => {
            expect(response).to.deep.eq({
                code: 204,
                body: {}
            });

            insightFacade = new InsightFacade(true);
            return insightFacade.addDataset("courses", courses);
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
        insightFacade._addDataset('courses', []);
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

describe("InsightFacade.performQuery", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade(false);
        insightFacade._addDataset('courses', [
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
                courses_instructor: "some guy 1",
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

    it('should produce 400 for an invalid query', () => {
        return insightFacade.performQuery(null).then(() => {
            throw new Error("Test should have failed");
        }, err => expect(err).to.deep.eq({
            code: 400,
            body: {
                error: 'Malformed query'
            }
        }))
    });

    it('should produce 424 for missing datasets', () => {
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
                    "fake_avgs"
                ],
                ORDER: "fake_avgs",
                FORM: "TABLE"
            }
        }).then(() => {
            throw new Error("Test should have failed")
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ['fake']
            }
        }))
    });

    it('should not be able to perform query when dataset has not been added', () => {
        insightFacade = new InsightFacade(false);

        return insightFacade.performQuery({
            WHERE: {
                IS: {
                    courses_title: "hong kong cinema"
                }
            },
            OPTIONS: {
                COLUMNS: [
                    "courses_title"
                ],
                FORM: "TABLE"
            }
        }).then(() => {
            throw new Error("Test should have failed")
        }, err => expect(err).to.deep.eq({
            code: 424,
            body: {
                missing: ['courses']
            }
        }))
    });

    it('should not be able to perform query when dataset has been removed', () => {
        return insightFacade.removeDataset('courses').then(response => {
            expect(response.code).eq(204);

            return insightFacade.performQuery({
                WHERE: {
                    IS: {
                        courses_title: "hong kong cinema"
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_title"
                    ],
                    FORM: "TABLE"
                }
            }).then(() => {
                throw new Error("Test should have failed")
            }, err => expect(err).to.deep.eq({
                code: 424,
                body: {
                    missing: ['courses']
                }
            }))
        })
    });
});

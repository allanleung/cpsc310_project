/**
 * Created by jerome on 2017-01-19.
 *
 * Contains testst for InsightFacade.
 */
import InsightFacade from "../src/controller/InsightFacade";
import {expect} from "chai";
import * as fs from "fs";
import Log from "../src/Util";
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

/**
* Created by jerome on 2017-01-19.
*/

import InsightFacade from "../src/controller/InsightFacade";
const rp = require('request-promise-native');
import {expect} from 'chai';

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

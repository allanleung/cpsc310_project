/**
 * Created by jerome on 2017-01-19.
 */

import InsightFacade from "../src/controller/InsightFacade";
import {expect} from 'chai';

describe("InsightFacade.removeDataset", () => {
    let insightFacade: InsightFacade = null;

    beforeEach(() => {
        insightFacade = new InsightFacade();
        insightFacade.dataSet.set("VISA110", {});
    });

    afterEach(() => {
        insightFacade = null;
    });

    it('should remove an existing ID successfully', () => {
        insightFacade.removeDataset("VISA110").then((response) => {
            expect(response).to.eq({
                code: 200,
                body: {}
            });
        });
    });
});
import {expect} from 'chai';
import InsightFacade from "../src/controller/InsightFacade";
import * as fs from 'fs';

describe("DatasetSpec", () => {
    const insightFacade = new InsightFacade(false);

    before(function() {
        this.timeout(10000);
        const content = fs.readFileSync('test/testCourses.zip').toString('base64');
        return insightFacade.addDataset('courses', content);
    });

    it('should have loaded the courses dataset correctly', () => {
        return insightFacade.performQuery({
            WHERE: {},
            OPTIONS: {
                COLUMNS: ["courses_dept", "courses_id", "courses_avg", "courses_instructor", "courses_title", "courses_pass", "courses_fail", "courses_audit", "courses_uuid", "courses_year"],
                ORDER: "courses_uuid",
                FORM: "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {
                render: "TABLE",
                result: [{
                    courses_dept: "test",
                    courses_id: "414",
                    courses_avg: 77.14,
                    courses_instructor: "creighton, millie",
                    courses_title: "well formatted",
                    courses_pass: 22,
                    courses_fail: 0,
                    courses_audit: 0,
                    courses_uuid: "25214",
                    courses_year: 2015
                },{
                    courses_dept: "test",
                    courses_id: "416",
                    courses_avg: 77.14,
                    courses_instructor: "creighton, millie",
                    courses_title: "formatted like the actual data",
                    courses_pass: 22,
                    courses_fail: 0,
                    courses_audit: 0,
                    courses_uuid: "25215",
                    courses_year: 2015
                },{
                    courses_dept: "test",
                    courses_id: "416",
                    courses_avg: 77.14,
                    courses_instructor: "creighton, millie",
                    courses_title: "another example of actual data",
                    courses_pass: 22,
                    courses_fail: 0,
                    courses_audit: 0,
                    courses_uuid: "25216",
                    courses_year: 2015
                },{
                    courses_dept: "test",
                    courses_id: "417",
                    courses_avg: 77.14,
                    courses_instructor: "creighton, millie",
                    courses_title: "weird but acceptable data",
                    courses_pass: 22,
                    courses_fail: 5,
                    courses_audit: 0,
                    courses_uuid: "25217",
                    courses_year: 2015
                }]
            }
        }))
    });
});

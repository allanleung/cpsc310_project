import InsightFacade from "../src/controller/InsightFacade";
import {expect} from 'chai';
import * as fs from 'fs';

describe("RoomsSpec", () => {
    let insightFacade = new InsightFacade(false);

    before(function() {
        this.timeout(100000);
        const content = fs.readFileSync('test/rooms.zip').toString('base64');
        return insightFacade.addDataset('rooms', content);
    });

    it('should perform example query A correctly', () => {
        return insightFacade.performQuery({
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
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {
                "render": "TABLE",
                "result": [{
                    "rooms_name": "DMP_101"
                }, {
                    "rooms_name": "DMP_110"
                }, {
                    "rooms_name": "DMP_201"
                }, {
                    "rooms_name": "DMP_301"
                }, {
                    "rooms_name": "DMP_310"
                }]
            }
        }))
    });

    it('should perform example query B correctly', () => {
        return insightFacade.performQuery({
            "WHERE": {
                "IS": {
                    "rooms_address": "*Agrono*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {"render":"TABLE","result":[{"rooms_address":"6245 Agronomy Road V6T 1Z4","rooms_name":"DMP_101"},{"rooms_address":"6245 Agronomy Road V6T 1Z4","rooms_name":"DMP_110"},{"rooms_address":"6245 Agronomy Road V6T 1Z4","rooms_name":"DMP_201"},{"rooms_address":"6245 Agronomy Road V6T 1Z4","rooms_name":"DMP_301"},{"rooms_address":"6245 Agronomy Road V6T 1Z4","rooms_name":"DMP_310"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_1001"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3002"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3004"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3016"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3018"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3052"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3058"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3062"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3068"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3072"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_3074"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4002"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4004"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4016"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4018"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4052"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4058"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4062"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4068"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4072"},{"rooms_address":"6363 Agronomy Road","rooms_name":"ORCH_4074"}]}
        }))
    });

    it('should perform a query that includes lat and lon correctly', () => {
        return insightFacade.performQuery({
            "WHERE": {
                "IS": {
                    "rooms_name": "DMP_*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_name",
                    "rooms_lat",
                    "rooms_lon"
                ],
                "ORDER": "rooms_name",
                "FORM": "TABLE"
            }
        }).then(response => expect(response).to.deep.eq({
            code: 200,
            body: {"render":"TABLE","result":[{"rooms_name":"DMP_101","rooms_lat":49.26125,"rooms_lon":-123.24807},{"rooms_name":"DMP_110","rooms_lat":49.26125,"rooms_lon":-123.24807},{"rooms_name":"DMP_201","rooms_lat":49.26125,"rooms_lon":-123.24807},{"rooms_name":"DMP_301","rooms_lat":49.26125,"rooms_lon":-123.24807},{"rooms_name":"DMP_310","rooms_lat":49.26125,"rooms_lon":-123.24807}]}
        }))
    })
});
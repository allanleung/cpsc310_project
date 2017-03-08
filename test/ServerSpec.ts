/**
 * Created by rtholmes on 2016-10-31.
 *
 * Some basic tests for the server.
 */
import Server from "../src/rest/Server";
import {expect} from "chai";
import Log from "../src/Util";
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import * as fs from 'fs';
import Response = ChaiHttp.Response;

chai.use(chaiHttp);

describe("ServerSpec", function () {
    let server: Server = null;

    before(() => {
        server = new Server(8000);
        return server.start().then(success => expect(success));
    });

    after(() => {
        return server.stop().then(success => expect(success));
    });

    it('should successfully perform a request', () => {
        return chai.request("http://localhost:8000")
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync("./test/rooms.zip"), "rooms.zip")
            .then(res => {
                Log.trace('then: ' + res);
                // some assertions
            }, err => {
                Log.trace('catch: ' + err);
                // some assertions
                expect.fail();
            });
    });
});

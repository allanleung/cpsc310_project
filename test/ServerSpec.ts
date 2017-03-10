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
import Response = ChaiHttp.Response;
import * as fs from "fs";

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

    it('Should successfully put', function () {
        this.timeout(20000);
        return chai.request("http://localhost:8000")
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync("test/rooms.zip"), "rooms.zip")
            .then(res => {
                Log.trace('then: ' + res);
                // some assertions
            }, err => {
                Log.trace('catch: ' + err);
                // some assertions
                expect.fail();
            });
    });

    it('Should successfully delete', () => {


        return chai.request("http://localhost:8000")
            .del('/dataset/rooms')
            .then(res => {
                Log.trace('then: ' + JSON.stringify(res));
                // some assertions
                expect(res).to.have.status(204);
            })
            .catch(err => {
                Log.trace('catch: ' + JSON.stringify(err));
                // some assertions
                expect.fail();
            });
    });

    it('Should successfully post', () => {
        return chai.request("http://localhost:8000")
            .post('/query')
            .then(res => {
                Log.trace('then: ' + res);
                // some assertions
            }, err => {
                Log.trace('catch: ' + err);
                // some assertions
                expect.fail();
            });
    });
    it('201: the operation was successful and the id already existed (was added in this session or was previously cached).', function () {
        this.timeout(20000);
        return chai.request("http://localhost:8000")
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync("test/rooms.zip"), "rooms.zip")
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

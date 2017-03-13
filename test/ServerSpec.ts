/**
 * Created by rtholmes on 2016-10-31.
 *
 * Some basic tests for the server.
 */
import Server from "../src/rest/Server";
import {expect} from "chai";
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import Response = ChaiHttp.Response;
import * as fs from "fs";
import {isObject} from "util";

chai.use(chaiHttp);

describe("ServerSpec", function () {
    let server: Server = null;

    before(function () {
        this.timeout(10000);

        server = new Server(8000);
        return server.start()
            .then(success => expect(success))
            .then(() => {
                return chai.request("http://localhost:8000")
                    .put('/dataset/courses')
                    .attach("body", fs.readFileSync("test/courses.zip"), "courses.zip")
            });
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
                expect(res.status).to.eq(204);
            }, err => {
                // some assertions
                expect.fail(err);
            });
    });

    it('Should fail with an unknown ID', function () {
        this.timeout(20000);
        return chai.request("http://localhost:8000")
            .put('/dataset/fake')
            .attach("body", fs.readFileSync("test/rooms.zip"), "rooms.zip")
            .then(res => {
                expect.fail(res);
            }, err => {
                expect(err.status).to.eq(400);
                expect(isObject(err.response.body));
                expect(Object.keys(err.response.body)).to.deep.eq(['error']);
                expect(typeof err.response.body.error).to.eq('string');
            });
    });

    it('Should successfully delete', () => {
        return chai.request("http://localhost:8000")
            .del('/dataset/rooms')
            .then(res => {
                // some assertions
                expect(res).to.have.status(204);
            })
            .catch(err => {
                // some assertions
                expect.fail(err);
            });
    });

    it('Should report missing datasets', () => {
        return chai.request("http://localhost:8000")
            .post('/query')
            .send({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: ['fake_id'],
                    FORM: 'TABLE'
                }
            })
            .then(res => {
                expect.fail(res);
            }, err => {
                expect(err.status).to.eq(424);
                expect(err.response.body).to.deep.eq({
                    missing: ['fake']
                })
            })
    });

    it('Should fail to remove unknown datasets', () => {
        return chai.request("http://localhost:8000")
            .del("/dataset/fake")
            .then(res => {
                expect.fail(res);
            }, err => {
                expect(err.status).to.eq(404);
                expect(isObject(err.response.body));
                expect(Object.keys(err.response.body)).to.deep.eq(['error']);
                expect(typeof err.response.body.error).to.eq('string');
            })
    });

    it('Should produce a 400 on an invalid query', () => {
        return chai.request('http://localhost:8000')
            .post('/query')
            .send({
                WHERE: {},
                OPTIONS: {
                    COLUMNS: [],
                    FORM: 'TABLE'
                }
            })
            .then(res => {
                expect.fail(res);
            }, err => {
                expect(err.status).to.eq(400);
                expect(isObject(err.response.body));
                expect(Object.keys(err.response.body)).to.deep.eq(['error']);
                expect(typeof err.response.body.error).to.eq('string');
            })
    });

    it('Should successfully post', () => {
        return chai.request("http://localhost:8000")
            .post('/query')
            .send({
                "WHERE": {
                    "AND": [
                        {"IS": {"courses_id": "317"}},
                        {"IS": {"courses_dept": "biol"}}
                    ]
                },
                "OPTIONS": {
                    "COLUMNS": ["courses_id", "courses_avg", "courses_dept"],
                    "ORDER": {"dir": "DOWN", "keys": ["courses_avg"]},
                    "FORM": "TABLE"
                }
            })
            .then(res => {
                expect(res.status).to.eq(200);
                expect(res.body).to.deep.eq({"render":"TABLE","result":[{"courses_id":"317","courses_avg":72.73,"courses_dept":"biol"},{"courses_id":"317","courses_avg":72.73,"courses_dept":"biol"},{"courses_id":"317","courses_avg":72.5,"courses_dept":"biol"},{"courses_id":"317","courses_avg":72.5,"courses_dept":"biol"},{"courses_id":"317","courses_avg":70.83,"courses_dept":"biol"},{"courses_id":"317","courses_avg":70.83,"courses_dept":"biol"},{"courses_id":"317","courses_avg":70.78,"courses_dept":"biol"},{"courses_id":"317","courses_avg":70.78,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.57,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.57,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.35,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.35,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.1,"courses_dept":"biol"},{"courses_id":"317","courses_avg":69.1,"courses_dept":"biol"},{"courses_id":"317","courses_avg":65.24,"courses_dept":"biol"},{"courses_id":"317","courses_avg":65.24,"courses_dept":"biol"}]})
            }, err => {
                // some assertions
                expect.fail(err);
            });
    });

    it('201: the operation was successful and the id already existed (was added in this session or was previously cached).', function () {
        this.timeout(20000);
        return chai.request("http://localhost:8000")
            .put('/dataset/courses')
            .attach("body", fs.readFileSync("test/courses.zip"), "courses.zip")
            .then(res => {
                expect(res.status).to.eq(201);
            }, err => {
                // some assertions
                expect.fail(err);
            });
    });

});

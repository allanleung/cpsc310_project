/**
 * Created by rtholmes on 2016-10-31.
 *
 * Some basic tests for the server.
 */

import Server from "../src/rest/Server";
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
const rp = require('request-promise-native');

describe("EchoSpec", function () {
    let server: Server = null;

    function sanityCheck(response: InsightResponse) {
        expect(response).to.have.property('code');
        expect(response).to.have.property('body');
        expect(response.code).to.be.a('number');
    }

    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
        server = new Server(8000);
        return server.start();
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
        return server.stop().then(() => {
            server = null;
        });
    });

    it("Should be able to echo", function () {
        let out = Server.performEcho('echo');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: 'echo...echo'});
    });

    it("Should be able to echo silence", function () {
        let out = Server.performEcho('');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: '...'});
    });

    it("Should be able to handle a missing echo message sensibly", function () {
        let out = Server.performEcho(undefined);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("Should be able to handle a null echo message sensibly", function () {
        let out = Server.performEcho(null);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.have.property('error');
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it('Should reply to get requests', () => {
        return rp('http://localhost:8000/')
    });

    it('Should fail gracefully if the port is already taken', () => {
        return (new Server(8000)).start().then(() => {
            throw new Error("Should not have worked");
        }, err => expect(err.port).to.eq(8000));
    });

    it('should provide the echo service', () => {
        return rp('http://localhost:8000/echo/hello')
            .then((body: string) => expect(JSON.parse(body)).to.deep.eq({
                message: 'hello...hello'
            }))
    });

    it('should provide the query service', () => {
        return rp('http://localhost:8000/query').then(() => {
            throw new Error("Did not expect to receive response");
        }, (err: any) => expect(err).to.not.be.null)
    });
});

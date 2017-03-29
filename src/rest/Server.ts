/**
 * This is the REST entry point for the project.
 * Restify is configured here.
 */

import restify = require('restify');

import Log from "../Util";
import InsightFacade from "../controller/InsightFacade";
import {InsightResponse} from "../controller/IInsightFacade";

import * as fs from 'fs';

/**
 * This configures the REST endpoints for the server.
 */
export default class Server {

    private port: number;
    private rest: restify.Server;
    private inface: InsightFacade;

    constructor(port: number) {
        Log.info("Server::<init>( " + port + " )");
        this.port = port;
        this.inface = new InsightFacade();
    }

    public register(): Promise<InsightResponse> {
        const courses = fs.readFileSync(__dirname + '/../../test/courses.zip').toString('base64');
        const rooms = fs.readFileSync(__dirname + '/../../test/rooms.zip').toString('base64');

        return this.inface.addDataset('courses', courses)
            .then(() => this.inface.addDataset('rooms', rooms))
    }

    /**
     * Stops the server. Again returns a promise so we know when the connections have
     * actually been fully closed and the port has been released.
     *
     * @returns {Promise<boolean>}
     */
    public stop(): Promise<boolean> {
        Log.info('Server::close()');
        return new Promise(fulfill => {
            this.rest.close(function () {
                fulfill(true);
            });
        });
    }

    /**
     * Starts the server. Returns a promise with a boolean value. Promises are used
     * here because starting the server takes some time and we want to know when it
     * is done (and if it worked).
     *
     * @returns {Promise<boolean>}
     */
    public start(): Promise<boolean> {
        return new Promise((fulfill, reject) => {

            this.rest = restify.createServer({
                name: 'insightUBC'
            });

            this.rest.use(restify.bodyParser({mapParams: true, mapFiles: true}));

            this.rest.put('/dataset/:id', (req, res, next) => {
                let dataStr = new Buffer(req.params.body).toString('base64');
                let id = req.params.id;
                this.inface.addDataset(id, dataStr).then (function (putStuff: InsightResponse) {
                    res.json(putStuff.code, putStuff.body);
                }).catch(function (putWrongStuff: InsightResponse) {
                    res.json(putWrongStuff.code, putWrongStuff.body);
                });
                return next();
            });

            this.rest.del('/dataset/:id', (req, res, next) => {
                let id = req.params.id;
                this.inface.removeDataset(id).then (function (deleteStuff: InsightResponse) {
                    res.json(deleteStuff.code, deleteStuff.body);
                }).catch(function (deleteWrongStuff: InsightResponse) {
                    res.json(deleteWrongStuff.code, deleteWrongStuff.body);

                });
                return next();
            });

            this.rest.post('/query', (req, res, next) => {
                this.inface.performQuery(req.body).then( postStuff => {
                    res.json(postStuff.code, postStuff.body);
                }).catch (postWrongStuff => {
                    res.json(postWrongStuff.code, postWrongStuff.body);
                });
                return next();
            });

            this.rest.get(/^[^.]+$/, restify.serveStatic({
                directory: __dirname + '/public',
                file: 'index.html'
            }));

            this.rest.get(/\/.*/, restify.serveStatic({
                directory: __dirname + '/public',
                'default': 'index.html'
            }));

            this.rest.listen(this.port, () => {
                Log.info('Restify listening: ' + this.rest.url);
                fulfill(true);
            });

            this.rest.on('error', err => {
                reject(err);
            });
        });
    }
}

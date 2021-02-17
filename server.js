const express = require('express');

/**
 * Creates an express server that serves the endpoints
 */
class Server{
    constructor(app){
        this.app = app || express();
        this.app.use(express.static('endpoints/'));
    }
    listen(){
        return this.app.listen(...arguments);
    }
}

module.exports = Server;
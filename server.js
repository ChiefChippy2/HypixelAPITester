const express = require('express');
const redirect = express.Router();
redirect.use((req,res,next)=>{
    req.url+='.json';
    next();
});
/**
 * Creates an express server that serves the endpoints
 */
class Server{
    constructor(app){
        this.app = app || express();
	this.app.use('*',redirect);
        this.app.use(express.static('endpoints/'));
    }
    listen(){
        return this.app.listen(...arguments);
    }
}

module.exports = Server;

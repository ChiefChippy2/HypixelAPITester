/* eslint valid-jsdoc: off*/
const express = require('express');
const redirect = new express.Router();
redirect.use((req, res, next)=>{
  req.url = (req.url+'.json').toLowerCase();
  next();
});
/**
 * Creates an express server that serves the endpoints
 */
class Server {
  /**
   * Initializes a server emulating the API
   * @param {*} [app] Express App
   */
  constructor(app) {
    this.app = app || express();
    this.app.use('*', redirect);
    this.app.use(express.static('endpoints/'));
    this.app.get('*', (req, res)=>{
      res.send('{"success":false,"cause":"Unknown endpoint"}');
    });
  }
  /**
   * Shortcut for this.app.listen
   */
  listen(...args) {
    return this.app.listen(...args);
  }
}

module.exports = Server;

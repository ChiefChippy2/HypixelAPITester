const fetch = require('node-fetch');
const {endpoints} = require('./constants.json');
const baseUrl = 'https://api.hypixel.net/';
const Utils = require('./Utils/');
const fs = require('fs').promises;

/**
 * Updater Class
 */
class Updater {
  /**
     *
     * @param {string} key A valid key for Hypixel API
     * @param {UpdaterOptions} options Options for the updater
     */
  constructor(key, options={}) {
    /**
         * API Key
         * @type {string}
         */
    this.key = key;
    /**
         * Integer for how close the limit can be to 120 after request, default 0
         * @type {number}
         */
    this.minimumLimitLeft = parseInt(options.minimumLimitLeft || 0);
    /**
         * UUID of player to use when fetching endpoints, preferably a player that has stats for about everything
         * Default Technoblade
         * @type {string}
         */
    this.defaultUUID = options.defaultUUID || 'b876ec32e396476ba1158438d83c67d4';
    /**
         * SB Profile UUID, default Technoblade or the default UUID's main profile
         * @type {string}
         */
    this.defaultProfile = options.defaultProfile || this.defaultUUID;
    /**
         * Page of auction to fetch, by default 0
         * @type {number}
         */
    this.defaultAuctionPage = parseInt(options.defaultAuctionPage || 0);
    /**
         * Computed default params
         * @type {object}
         */
    this.defaultParams = {
      'uuid': this.defaultUUID,
      'profile': this.defaultProfile,
      'page': this.defaultAuctionPage,
      'byUuid': this.defaultUUID, // For findGuild
      'player': this.defaultUUID, // For guild
    };
  }
  /**
     * fetches an endpoint with corresponding params
     * @private
     * @param {string} url Endpoint to fetch
     * @param {URLParamsResolvable} [params] Query Strings to be passed along with the URL
     * @return {Object} JSON returned by the API
     */
  async _fetchEndpoint(url, params='') {
    try {
      params = Utils.resolveURLParams(params);
      // Only case params would technically be undefined is when parser can't parse it
      if (params === undefined) throw new Error('Invalid Params');
      return await fetch(`${baseUrl}${url}?${params}`, {headers: {'Api-Key': this.key}}).then((r)=>r.json());
    } catch (e) {
      if (process.env.ENVIRONMENT === 'testing') console.error(e);
      throw new Error('Hypixel API is currently down, or something went wrong.');
    }
  }
  /**
     * Checks Key usability and returns blurred information
     * @private
     * @return {Object} Information about the Key
     */
  async _checkKey() {
    const keyInfo = await this._fetchEndpoint('player', 'uuid=f7c77d999f154a66a87dc4a51ef30d19');
    if (process.env.ENVIRONMENT === 'testing' && !keyInfo.success) console.log(keyInfo);
    if (!keyInfo.success) throw new Error('Invalid Key!');
    return true;
  }
  /**
     * Updates the provided Endpoints
     * @param {string[]} eps Endpoints to Update
     * @return {string} Success message
     */
  async updateEndpoints(eps) {
    // First backup and clear endpoints folder
    try {
      await fs.rename('endpoints/', 'endpoints_old/');
    } catch (e) {
      throw new Error('Error occurred whilst trying to make backup for old endpoints cache. Try deleting "endpoints_old" folder.');
    }
    await fs.mkdir('endpoints/');
    const sustainedWrites = [];
    // Remove dups
    const updateList = new Set(eps);
    await this._checkKey();
    // first create folders if they are not there already
    const pathToFolders = new Set(eps.filter((x)=>x.includes('/')).map((x)=>x.split('/').slice(0, -1).join('/')));
    pathToFolders.forEach((folder)=>{
      sustainedWrites.push(
          new Promise((resolve, reject)=>{
            fs.opendir(folder)
                .then(resolve)
                .catch(()=>fs.mkdir(`endpoints/${folder}`, {recursive: true})
                    .then(resolve)
                    .catch(reject),
                );
          }),
      );
    });
    try {
      await Promise.all(sustainedWrites);
    } catch (e) {
      throw new Error('Encountered an error whilst creating folders for endpoints...');
    }
    // clear all sustained because it is done
    sustainedWrites.splice(0, sustainedWrites.length);
    // then actually start writing
    updateList.forEach((endpoint)=>{
      sustainedWrites.push(
          new Promise((resolve, reject)=>{
            this._fetchEndpoint(endpoint, this.defaultParams)
                .then((data)=>fs.writeFile(`endpoints/${endpoint}.json`, JSON.stringify(data)))
                .then(resolve)
                .catch(reject);
          }));
    });
    try {
      await Promise.all(sustainedWrites);
    } catch (e) {
      throw new Error('Some endpoints couldn\'t be updated/written.');
    }

    // All good, remove backup
    await fs.rm('endpoints_old/', {recursive: true});
    return 'Success, all endpoints updated and written.';
  }
  /**
     * Updates ALL endpoints in constants.json
     * @return {string} Success message
     */
  async updateAll() {
    return await this.updateEndpoints(endpoints);
  }
  /**
     * Updates the endpoints in constants.json
     * @param {string} [githubUrl] String URL of the github URL
     * @param {branch} [branch] Branch to use, default master ( not main! )
     * @param {string} [pathToMethods] String Path to methods
     * @return {string} Success message
     * @deprecated
     */
  static async updateConstantFromGithub(githubUrl, branch, pathToMethods) {
    githubUrl = new URL(githubUrl || 'https://github.com/HypixelDev/PublicAPI').pathname.slice(1);
    branch = branch || 'master';
    pathToMethods = pathToMethods || 'Documentation/methods';
    if (!githubUrl || !pathToMethods) throw new Error('Bad Parameter(s) provided');
    if (pathToMethods.endsWith('/')) pathToMethods = pathToMethods.slice(-1);
    const structure = await fetch(`https://api.github.com/repos/${githubUrl}/git/trees/${branch}?recursive=1`).then((r)=>r.json());
    if (structure.message) console.log(structure.message);
    if (!structure.tree) throw new Error('Invalid tree, message logged in console.');
    const paths = structure.tree.filter((x)=>x.path.startsWith(pathToMethods) && x.type === 'blob');
    if (!paths.length) throw new Error('No endpoints found');
    // Transform paths into endpoints
    const regex = new RegExp(`${pathToMethods}\/([^.]+)\.md`);
    const newEndpoints = paths.map((x)=>x.path.match(regex)[1]);
    await fs.writeFile('constants.json', JSON.stringify({
      'endpoints': newEndpoints,
    }));
    return 'Success, new endpoints have been registered!';
  }
  /**
   * Updates constant
   * @param {string} [openAPIUrl] URL to the Open API documentations
   * @return {string} Success message
   */
  static async updateConstant(openAPIUrl) {
    const doc = await fetch(openAPIUrl || 'https://api.hypixel.net').then((r)=>r.text());
    const scripts = Array.from(doc.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gm)).map((x)=>x[1]);
    const redoc = scripts.map((element)=>element.match(/const __redoc_state\s?=\s?([^\n]+);/)).find((x)=>x&&x.length);
    if (!redoc) throw new Error('ReDoc not Found.');
    const newEndpoints = Array.from(Object.keys(JSON.parse(redoc[1]).spec.data.paths)).map((x)=>x.slice(1));
    await fs.writeFile('constants.json', JSON.stringify({
      'endpoints': newEndpoints,
    }));
    return 'Success, new endpoints have been registered!';
  }
  /**
     * Removes everything in endpoints
     * @return {string} Success message
     */
  static async removeAll() {
    // v12
    await fs.rmdir('endpoints/', {recursive: true});
    await fs.mkdir('endpoints/');
    return 'Success';
  }
}

/**
 * @typedef {Object|Map|string}URLParamsResolvable A map, object, or string that can be resolved into valid URL parameters.
 *
 */

module.exports = Updater;

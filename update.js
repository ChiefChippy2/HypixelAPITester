const fetch = require('node-fetch');
const {endpoints} = require('./constants.json');
const baseUrl = 'https://api.hypixel.net/';
const Utils = require('./Utils/');
const fs = require('fs/promises');
const {rmDir} = require('fs');

/**
 * Updater Class
 */
class Updater{
    /**
     * 
     * @param {string} key A valid key for Hypixel API
     * @param {UpdaterOptions} options Options for the updater
     */
    constructor(key,options={}){
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
         * Default Technoblade's
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
            'player': this.defaultUUID // For guild
        }
    }
    /**
     * fetches an endpoint with corresponding params
     * @private
     * @param {string} url Endpoint to fetch
     * @param {URLParamsResolvable} [params] Query Strings to be passed along with the URL
     * @returns {Object} JSON returned by the API
     */
    async _fetchEndpoint(url,params=''){
        try{
            params = Utils.resolveURLParams(params);
            // Only case params would technically be undefined is when parser can't parse it
            if(params === undefined) throw new Error('Invalid Params');
            return await fetch(`${baseUrl}${url}?key=${this.key}&${params}`).then(r=>r.json());
        }catch(e){
            if(process.env.ENVIRONMENT === 'testing') console.error(e);
            throw new Error('Hypixel API is currently down, or something went wrong.');
        }
    }
    /**
     * Checks Key usability and returns blurred information
     * @private
     * @returns {Object} Information about the Key
     */
    async _checkKey(){
        const keyInfo = await this._fetchEndpoint('key');
        if(!keyInfo.success) throw new Error('Invalid Key!');
        if(120 - keyInfo.record.queriesInPastMin - endpoints.length <= this.minimumLimitLeft) throw new Error('Refusing to use key because the limit will be hit.');
        keyInfo.record.key = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
        return keyInfo;
    }
    /**
     * Updates the provided Endpoints
     * @param {string[]} eps Endpoints to Update
     * @returns {string} Success message
     */
    async updateEndpoints(eps){
        const sustainedWrites = [];
        //Remove dups
        const updateList = new Set(eps);
        const keyInfo = await this._checkKey();
        if(updateList.delete('key')) sustainedWrites.push(fs.writeFile('endpoints/key.json',JSON.stringify(keyInfo)));
        //first create folders if they are not there already
        const pathToFolders = new Set(eps.filter(x=>x.includes('/')).map(x=>x.split('/').slice(0,-1).join('/')));
        pathToFolders.forEach(folder=>{
            sustainedWrites.push(
                new Promise((resolve,reject)=>{
                    fs.opendir(folder)
                    .then(resolve)
                    .catch(()=>fs.mkdir(`endpoints/${folder}`,{recursive:true})
                    .then(resolve)
                    .catch(reject)
                    )
                })
            )
        })
        try{
            await Promise.all(sustainedWrites)
        }catch(e){
            throw new Error('Encountered an error whilst creating folders for endpoints...');
        }
        //clear all sustained because it is done
        sustainedWrites.splice(0,sustainedWrites.length);
        //then actually start writing
        updateList.forEach((endpoint)=>{
            sustainedWrites.push(
		new Promise((resolve,reject)=>{
		    this._fetchEndpoint(endpoint,this.defaultParams)
                    .then(data=>fs.writeFile(`endpoints/${endpoint}.json`,JSON.stringify(data)))
                    .then(resolve)
                    .catch(reject)
		}))
        })
        try{
            await Promise.all(sustainedWrites)
        }catch(e){
            throw new Error('Some endpoints couldn\'t be updated/written.')
        }
        return 'Success, all endpoints updated and written.'
    }
    /**
     * Updates ALL endpoints in constants.json
     * @returns {string} Success message
     */
    async updateAll(){
        return await this.updateEndpoints(endpoints);
    }
    /**
     * Updates the endpoints in constants.json
     * @param {string} [githubUrl] String URL of the github URL
     * @param {branch} [branch] Branch to use, default master ( not main! )
     * @param {string} [pathToMethods] String Path to methods
     * @returns {string} Success message
     */
    static async updateConstant(githubUrl,branch,pathToMethods){
        githubUrl = new URL(githubUrl || 'https://github.com/HypixelDev/PublicAPI').pathname.slice(1);
        branch = branch || 'master'
        pathToMethods = pathToMethods || 'Documentation/methods';
        if(!githubUrl || !pathToMethods) throw new Error('Bad Parameter(s) provided');
        if(pathToMethods.endsWith('/')) pathToMethods = pathToMethods.slice(-1);
        const structure = await fetch(`https://api.github.com/repos/${githubUrl}/git/trees/${branch}?recursive=1`).then(r=>r.json());
        if(structure.message) console.log(structure.message);
        if(!structure.tree) throw new Error('Invalid tree, message logged in console.')
        const paths = structure.tree.filter(x=>x.path.startsWith(pathToMethods) && x.type === 'blob');
        if(!paths.length) throw new Error('No endpoints found');
        // Transform paths into endpoints
        const regex = new RegExp(`${pathToMethods}\/([^.]+)\.md`);
        const newEndpoints = paths.map(x=>x.path.match(regex)[1])
        await fs.writeFile('constants.json',JSON.stringify({
            'endpoints':newEndpoints
        }))
        return 'Success, new endpoints have been registered!'
    }
    /**
     * Removes everything in endpoints
     * @returns {string} Success message
     */
    static async removeAll(){
        //v12 
        await fs.rmdir('endpoints/',{recursive:true});
        await fs.mkdir('endpoints/');
        return 'Success';
    }

}

/**
 * @typedef {Object|Map|string}URLParamsResolvable A map, object, or string that can be resolved into valid URL parameters.
 * 
 */

 module.exports = Updater;

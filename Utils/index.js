/**
 * Parses parameters
 * @param {URLParamsResolvable} params 
 * @returns {string|undefined} String 
 */
function resolveURLParams(params){
    if(params instanceof Map) params = Array.from(map.entries()).map(x=>`&${x[0]}=${x[1]}`).slice(1);
    if(typeof params === 'object') params = Object.entries(params).map(x=>`&${x[0]}=${x[1]}`).slice(1);
    if(typeof params !== 'string' || params.includes('#')) return undefined;
    if(params.startsWith('?')) params = params.slice(1);
    return params;
}
/**
 * @typedef {Object|Map|string}URLParamsResolvable A map, object, or string that can be resolved into valid URL parameters.
 * 
 */

module.exports = {resolveURLParams};
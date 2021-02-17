const fs = require('fs');
const fetch = require('node-fetch');
/**
 * Test function, runs through all the functions
 */
async function test() {
  console.time('default');
  process.env.ENVIRONMENT = 'testing';
  const HypixelAPITester = require('./index');
  const Updater = new HypixelAPITester.Updater(process.argv[2]);
  const Server = new HypixelAPITester.Server();
  console.timeLog('default', 'Finished Initialization');
  console.log('Trying to update player and findGuild endpoint');
  await Updater.updateEndpoints(['player', 'findGuild']);
  console.timeLog('default', 'Finished updating the endpoints');
  console.log('Trying to update constants.json');
  await HypixelAPITester.Updater.updateConstant();
  console.timeLog('default', 'Successfully updated constants.json');
  console.log('Purging endpoints/');
  await HypixelAPITester.Updater.removeAll();
  console.timeLog('default', 'Finished purging');
  console.log('Trying to update every endpoint...');
  await Updater.updateAll();
  console.timeLog('default', 'Finished updating all endpoints');
  console.log('Trying to create server');
  return await new Promise((resolve, reject)=>{
    Server.listen(12345, async ()=>{
      console.timeLog('default', 'Server listening on port 12345');
      console.log('Emulating request...');
      const response = await fetch('http://localhost:12345/player').then((r)=>r.text());
      console.timeLog('default', 'Response received... Comparing response');
      if (fs.readFileSync('endpoints/player.json').toString() !== response) reject(new Error('Unexpected response!'));
      console.timeLog('default', 'Request Successful.');
      resolve('Done');
    });
  });
}

test().then(console.log.bind(null, 'Successfully finished test : ')).catch(console.error.bind(null, 'Failed to finish test, error : '));

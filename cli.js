const HypixelAPITester = require('./index');

/**
 * Logs errors and exits program if necessary
 * @param {string} msg Message to log
 * @param {boolean} fatal Whether program should exit due to error
 */
function err(msg, fatal=true) {
  console.error(msg);
  if (fatal) process.exit(9); // monkas
}
/**
 * Deals with argv and runs the correct functions
 */
async function processArgv() {
  if (!process.argv[2]) err('No action provided.');
  const action = process.argv[2].toLowerCase();
  if (action === 'updateconstant') return await HypixelAPITester.Updater.updateConstant(...process.argv.slice(3));
  const Server = new HypixelAPITester.Server();
  if (action === 'server') return await Server.listen(process.argv[3] || 80 );
  const Updater = new HypixelAPITester.Updater(process.argv[3]);
  if (action === 'update') return await Updater.updateAll();
  if (action === 'reinstall') {
    await HypixelAPITester.Updater.removeAll();
    await HypixelAPITester.Updater.updateConstant(...process.argv.slice(4));
    return await Updater.updateAll(process.argv[3]);
  }
  if (action === 'updatesome') return await Updater.updateEndpoints(process.argv.slice(3));
  err('Unknown Action');
}

processArgv().then((result)=>{
  console.log(result);
  if (process.argv[2].toLowerCase() !== 'server') process.exit(0);
}).catch((err)=>{
  console.error(err);
  process.exit(1);
});

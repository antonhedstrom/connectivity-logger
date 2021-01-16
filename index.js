const checkConnections = require('./check-connections');
const config = require('./config');

// Initial call
checkConnections();

// Start polling
setInterval(() => {
  checkConnections();
}, config.pollIntervall);


console.log(`
🚀  App started, will poll sites every ${Math.floor(config.pollIntervall / 1000)}s.
${config.pingSites
  .map((site) => `${site.name} (${site.url})`)
  .join('\n')
}
`);

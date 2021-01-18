const fs = require('fs');
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');

const checkConnections = require('./check-connections');
const config = require('./config');
const { getFilePath, openAndParseFile, slugifySiteName } = require('./util');

const app = express();
const publicPath = path.join(__dirname, 'public');

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Updates everytime we check connection.
let lastPinged = null;

app.use('/', express.static(publicPath));
app.get('/', function(req, res) {
  const data = config.pingSites.map((pingSite) => {
    const filePath = getFilePath(pingSite.name);
    let lastEntry = {};
    try {
      const entries = openAndParseFile(filePath);
      lastEntry = entries.pop();
    } catch (parseError) {
      console.error(`Unable to parse ${filePath}`, parseError.message);
    }
    return {
      ...pingSite,
      ...lastEntry,
      slug: slugifySiteName(pingSite.name),
    };
  });
  res.render('sites', {
    sites: data,
    lastPinged: lastPinged && lastPinged.toLocaleString(),
  });
});

app.get('/:site', function(req, res) {
  const siteSlug = req.params.site;
  const limit = req.query.limit || 100;

  const site = config.pingSites.find((site) => slugifySiteName(site.name) === siteSlug);
  if (!site) {
    return res.render('site-not-found');
  }
  const filePath = getFilePath(site.name);
  let logEntries = [];
  try {
    logEntries = openAndParseFile(filePath);
  } catch (parseError) {
    console.error(`Unable to parse ${filePath}`, parseError.message);
  }
  res.render('site', {
    site,
    limit,
    lastPinged: lastPinged && lastPinged.toLocaleString(),
    logEntries: logEntries
      .reverse()
      .slice(0, limit)
      .map((log) => ({
        ...log,
        ts: new Date(log.ts).toLocaleString(),
        data: {
          ...log.data,
          ping_time: Math.floor(log.data.ping_time),
        }
      })),
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀  Connectivity checker started. http://localhost:${PORT}`);

  // Initial call
    checkConnections().then(({ logtime }) => lastPinged = logtime);

  // Start polling
  setInterval(() => {
    checkConnections().then(({ logtime }) => lastPinged = logtime);
  }, config.pollIntervall);

  console.log(`
⏱ Every ${Math.floor(config.pollIntervall / 1000)}s these sites will be checked:
${config.pingSites
  .map((site) => `\t${site.name} (${site.url})`)
  .join('\n')
}
  `);
});

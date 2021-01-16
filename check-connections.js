const domainPing = require('domain-ping');
const LRU = require('lru-cache');

const { pingSites } = require('./config');
const writeEvent = require('./file-log');

const siteCache = new LRU({
  max: pingSites.length * 2, // max items in cache. Multiple by 2 too be sure :)
  maxAge: 1000 * 60 * 60 * 1, // After a day we store a new record in file
});

// Setup cache
pingSites.map((site) => {
  siteCache.set(site.url, initValues(site));
});

function initValues(site) {
  return {
    url: site.url,
    name: site.name,
    ts: new Date(),
    data: {},
  };
}

/**
 * Example response from domain-ping:
 * {
     domain: 'github.com',
     ip: '192.30.253.112',
     ping: true,
     ping_time: 53.480,
     online: true,
     statusCode: 200,
     success: true,
   }
 */

function detectConnectivityChange(site, newResponse = {}, timeOfRequest) {
  const cacheKey = site.url;

  // Make sure site exists in cache
  let cachedSite = siteCache.get(cacheKey);
  if (!cachedSite) {
    const reInitialize = initValues(site);
    siteCache.set(cacheKey, reInitialize);
    cachedSite = reInitialize;
  }

  // Compare to previous value
  if (cachedSite.data.success !== newResponse.success
    || cachedSite.data.statusCode !== newResponse.statusCode
    || cachedSite.data.online !== newResponse.online
  ) {
    // If connectivity seems to be different, write to file and update cache!
    const newData = {
      ...cachedSite,
      ts: timeOfRequest,
      data: newResponse,
    };
    siteCache.set(cacheKey, newData);
    writeEvent(newData);
    return newData;
  }
  return false;
}

module.exports = () => {
  const logtime = new Date();
  const promises = pingSites.map((site) => {
    return domainPing(site.url)
      .then((response) => {
        detectConnectivityChange(site, response, logtime);
      }).catch((errorResponse) => {
        detectConnectivityChange(site, errorResponse, logtime);
      });
  });

  return Promise.all(promises);
};

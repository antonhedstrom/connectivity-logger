const fs = require('fs');
const path = require('path');

const config = require('./config');

/**
 *
 * @param {String} namespace, i.e. https://github.com
 * @param {Object} event, what to be written to then line.
 * Example of event:
 * {
 *   url: site.url,
 *   name: site.name,
 *   ts: new Date(),
 *   data: { success: true, online: true, ping: true, ping_time: 34.43 },
 * }
 */
module.exports = function writeEvent(event) {
  const safeFileName = event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filePath = path.join(config.fileFolder, `site-${safeFileName}.csv`);
  const newLine = JSON.stringify(event);

  return new Promise((resolve, reject) => {
    fs.appendFile(
      filePath,
      `${newLine}\n`,
      (err) => {
        if (err) {
          reject(err);
          return console.error(err);
        }
        resolve();
      },
    );
  });
}

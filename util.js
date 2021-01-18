const fs = require('fs');
const path = require('path');

const config = require('./config');

/**
 * getFileName
 * @param {String} siteName, i.e. Google
 */
function getFilePath(siteName) {
  const safeFileName = slugifySiteName(siteName);
  return path.join(config.fileFolder, `site-${safeFileName}.csv`);
}

/**
 * Read and parse file based on filePath
 * @param {String} filePath I.e. /data/site-google.csv
 */
function openAndParseFile(filePath) {
  let fileContent = '';
  try {
    fileContent = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
  } catch (fileError) {
    throw Error(fileError);
  }

  return fileContent
    .split('\n')
    .filter((line) => line !== '')
    .map((jsonLine) => {
      try {
        return JSON.parse(jsonLine);
      } catch (parseError) {
        console.error(`Unable to parse line in ${filePath}`, parseError.message);
        return {};
      }
    })
}

function slugifySiteName(siteName) {
  return siteName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

module.exports = {
  getFilePath,
  openAndParseFile,
  slugifySiteName,
};

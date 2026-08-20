const fs = require('fs');
const https = require('https');
const path = require('path');

const outputDirectory = path.join(__dirname, 'static', 'assets');
const libraryDirectory = path.join(__dirname, 'src', 'lib', 'libraries');
const libraryFiles = ['sprites.json', 'backdrops.json', 'costumes.json', 'sounds.json'];
const assetFilePattern = /[a-f0-9]{32}\.[a-z0-9]+/g;
const concurrency = 5;

fs.mkdirSync(outputDirectory, {recursive: true});

const assetFiles = new Set();
for (const libraryFile of libraryFiles) {
    const contents = fs.readFileSync(path.join(libraryDirectory, libraryFile), 'utf8');
    for (const assetFile of contents.match(assetFilePattern) || []) {
        assetFiles.add(assetFile);
    }
}

const downloadFile = assetFile => new Promise((resolve, reject) => {
    const destination = path.join(outputDirectory, assetFile);
    if (fs.existsSync(destination) && fs.statSync(destination).size > 0) {
        resolve(false);
        return;
    }

    const temporaryDestination = `${destination}.part`;
    const url = `https://cdn.assets.scratch.mit.edu/internalapi/asset/${assetFile}/get/`;
    const request = https.get(url, {timeout: 15000}, response => {
        if (response.statusCode !== 200) {
            response.resume();
            reject(new Error(`HTTP ${response.statusCode} for ${assetFile}`));
            return;
        }

        const output = fs.createWriteStream(temporaryDestination);
        response.pipe(output);
        output.on('finish', () => {
            output.close(() => {
                fs.renameSync(temporaryDestination, destination);
                resolve(true);
            });
        });
        output.on('error', reject);
    });
    request.on('timeout', () => request.destroy(new Error(`Timeout while downloading ${assetFile}`)));
    request.on('error', error => {
        fs.rmSync(temporaryDestination, {force: true});
        reject(error);
    });
});

const main = async () => {
    const files = Array.from(assetFiles);
    let downloaded = 0;
    for (let index = 0; index < files.length; index += concurrency) {
        const results = await Promise.all(files.slice(index, index + concurrency).map(downloadFile));
        downloaded += results.filter(Boolean).length;
    }
    console.log(`Offline assets ready: ${files.length} required, ${downloaded} downloaded.`);
};

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const buildDirectory = path.join(packageRoot, 'build');
const buildAssetDirectory = path.join(buildDirectory, 'static', 'assets');
const libraryDirectory = path.join(packageRoot, 'src', 'lib', 'libraries');
const libraryFiles = ['sprites.json', 'backdrops.json', 'costumes.json', 'sounds.json'];
const assetFilePattern = /[a-f0-9]{32}\.[a-z0-9]+/g;
const verifyOptimizedBuild = process.argv.includes('--optimized');

const requiredAssets = new Set();
for (const libraryFile of libraryFiles) {
    const contents = fs.readFileSync(path.join(libraryDirectory, libraryFile), 'utf8');
    for (const assetFile of contents.match(assetFilePattern) || []) {
        requiredAssets.add(assetFile);
    }
}

const missingAssets = Array.from(requiredAssets).filter(assetFile => {
    const assetPath = path.join(buildAssetDirectory, assetFile);
    return !fs.existsSync(assetPath) || fs.statSync(assetPath).size === 0;
});

if (missingAssets.length > 0) {
    throw new Error(`Offline build is missing ${missingAssets.length} library assets: ${missingAssets.slice(0, 5)}`);
}

const guiPath = path.join(buildDirectory, 'gui.js');
if (!fs.existsSync(path.join(buildDirectory, 'index.html')) || !fs.existsSync(guiPath)) {
    throw new Error('Offline build must contain index.html and gui.js');
}

const guiContents = fs.readFileSync(guiPath, 'utf8');
for (const bridgeName of ['AndroidScratchLoadProjectUrl', 'AndroidProjectSaver']) {
    if (!guiContents.includes(bridgeName)) {
        throw new Error(`Offline build does not contain the ${bridgeName} bridge`);
    }
}

const includesPersianFont = fs.readdirSync(buildAssetDirectory)
    .some(assetFile => assetFile.startsWith('BYekan') && assetFile.endsWith('.woff2'));
if (!includesPersianFont) {
    throw new Error('Offline build does not contain the BYekan font');
}

if (verifyOptimizedBuild) {
    const filesToVisit = [buildDirectory];
    const sourceMaps = [];
    while (filesToVisit.length > 0) {
        const directory = filesToVisit.pop();
        for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
            const entryPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                filesToVisit.push(entryPath);
            } else if (entry.name.endsWith('.map')) {
                sourceMaps.push(path.relative(buildDirectory, entryPath));
            }
        }
    }

    if (sourceMaps.length > 0) {
        throw new Error(`Optimized offline build contains source maps: ${sourceMaps.slice(0, 5)}`);
    }

    const alternatePlaygroundFiles = [
        'blocksonly.js',
        'blocks-only.html',
        'compatibilitytesting.js',
        'compatibility-testing.html',
        'guistandalone.js',
        'player.js',
        'player.html',
        'standalone.html'
    ];
    const unexpectedFiles = alternatePlaygroundFiles.filter(file => fs.existsSync(path.join(buildDirectory, file)));
    if (unexpectedFiles.length > 0) {
        throw new Error(`Optimized offline build contains alternate playground files: ${unexpectedFiles}`);
    }
}

console.log(`Offline build verified with ${requiredAssets.size} library assets.`);

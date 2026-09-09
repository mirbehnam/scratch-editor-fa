import {
    access,
    cp,
    mkdir,
    readFile,
    readdir,
    rename,
    rm,
    stat,
    writeFile
} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const electronVersion = '42.11.2';
const rceditVersion = '2.0.0';
const productExecutable = 'ScratchFA.exe';
const fallbackProxy = 'http://127.0.0.1:10808';
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(packageRoot, '..', '..');
const buildDirectory = path.join(packageRoot, 'build');
const outputDirectory = path.join(packageRoot, 'build-windows');
const installerOutputDirectory = path.join(outputDirectory, 'installers');
const desktopDirectory = path.join(packageRoot, 'desktop');
const iconPath = path.join(desktopDirectory, 'icon.ico');
const ia32IconPath = path.join(desktopDirectory, 'icon-ia32.ico');
const cacheDirectory = path.join(
    repositoryRoot,
    'node_modules',
    '.cache',
    'scratch-electron',
    electronVersion
);
const rceditPath = path.join(cacheDirectory, `rcedit-x64-v${rceditVersion}.exe`);

const architectures = [
    {name: 'x64', is64Bit: true, executableIcon: iconPath},
    {name: 'ia32', is64Bit: false, executableIcon: ia32IconPath}
];

const pathExists = async targetPath => {
    try {
        await access(targetPath);
        return true;
    } catch {
        return false;
    }
};

const downloadFile = async (url, destination) => {
    const partialDestination = `${destination}.partial`;
    await rm(partialDestination, {force: true});
    console.log(`Downloading ${url}`);

    const curlArguments = [
        '--fail',
        '--location',
        '--retry', '3',
        '--retry-all-errors',
        '--connect-timeout', '30',
        '--output', partialDestination,
        url
    ];
    let result = spawnSync('curl.exe', curlArguments, {stdio: 'inherit'});
    if (result.status !== 0) {
        console.warn(`Direct download failed; retrying through ${fallbackProxy}`);
        await rm(partialDestination, {force: true});
        result = spawnSync('curl.exe', [
            '--proxy', fallbackProxy,
            ...curlArguments
        ], {stdio: 'inherit'});
    }
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`Electron download failed directly and through ${fallbackProxy}`);
    }
    await rename(partialDestination, destination);
};

const run = (command, args) => {
    const result = spawnSync(command, args, {stdio: 'inherit'});
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error(`${command} exited with code ${result.status}`);
    }
};

const findInnoCompiler = () => {
    if (process.env.ISCC_PATH) {
        return process.env.ISCC_PATH;
    }
    const result = spawnSync('where.exe', ['ISCC.exe'], {encoding: 'utf8'});
    if (result.status === 0) {
        const compilerPath = result.stdout.split(/\r?\n/).find(Boolean);
        return compilerPath.trim();
    }
    const commonInstallPaths = [
        'C:\\Program Files\\Inno Setup 7\\ISCC.exe',
        'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
        'C:\\Program Files\\Inno Setup 6\\ISCC.exe'
    ];
    const compilerPath = commonInstallPaths.find(existsSync);
    if (compilerPath) {
        return compilerPath;
    }
    throw new Error('Inno Setup compiler was not found. Install Inno Setup or set ISCC_PATH.');
};

const listFiles = async (directory, baseDirectory = directory) => {
    const files = [];
    for (const entry of await readdir(directory, {withFileTypes: true})) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...await listFiles(entryPath, baseDirectory));
        } else {
            const fileStat = await stat(entryPath);
            files.push(`${path.relative(baseDirectory, entryPath)}:${fileStat.size}`);
        }
    }
    return files.sort();
};

const prepareArchitecture = async (architecture, version) => {
    const archiveName = `electron-v${electronVersion}-win32-${architecture.name}.zip`;
    const archivePath = path.join(cacheDirectory, archiveName);
    const electronUrl = `https://github.com/electron/electron/releases/download/v${electronVersion}/${archiveName}`;
    const architectureDirectory = path.join(outputDirectory, `win-${architecture.name}-unpacked`);

    if (await pathExists(archivePath)) {
        console.log(`Using cached ${archiveName}`);
    } else {
        await downloadFile(electronUrl, archivePath);
    }

    await mkdir(architectureDirectory, {recursive: true});
    run('tar.exe', ['-xf', archivePath, '-C', architectureDirectory]);

    const resourcesDirectory = path.join(architectureDirectory, 'resources');
    const appDirectory = path.join(resourcesDirectory, 'app');
    await rm(path.join(resourcesDirectory, 'default_app.asar'), {force: true});
    await mkdir(appDirectory, {recursive: true});
    await cp(buildDirectory, path.join(appDirectory, 'build'), {recursive: true});
    await cp(path.join(desktopDirectory, 'main.cjs'), path.join(appDirectory, 'main.cjs'));
    await cp(path.join(desktopDirectory, 'icon.png'), path.join(appDirectory, 'icon.png'));
    await writeFile(path.join(appDirectory, 'package.json'), `${JSON.stringify({
        name: 'scratch-fa-desktop',
        productName: 'Scratch فارسی',
        version,
        main: 'main.cjs'
    }, null, 2)}\n`);
    await writeFile(path.join(architectureDirectory, 'VERSION.txt'), `${version}\n`);
    await rename(path.join(architectureDirectory, 'electron.exe'), path.join(architectureDirectory, productExecutable));
    const executablePath = path.join(architectureDirectory, productExecutable);
    run(rceditPath, [executablePath, '--set-icon', architecture.executableIcon]);

    const sourceFiles = await listFiles(buildDirectory);
    const packagedFiles = await listFiles(path.join(appDirectory, 'build'));
    if (JSON.stringify(sourceFiles) !== JSON.stringify(packagedFiles)) {
        throw new Error(`Windows ${architecture.name} package does not contain an exact copy of the Android build`);
    }

    return architectureDirectory;
};

if (process.platform !== 'win32') {
    throw new Error('The Windows and Inno Setup build must run on Windows.');
}
if (!await pathExists(path.join(buildDirectory, 'index.html'))) {
    throw new Error('Android build is missing. Run npm run build:android from the repository root.');
}

const rootPackage = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
const version = rootPackage.version;
const innoCompiler = findInnoCompiler();

await rm(outputDirectory, {recursive: true, force: true});
await mkdir(cacheDirectory, {recursive: true});
await mkdir(installerOutputDirectory, {recursive: true});

if (!await pathExists(rceditPath)) {
    await downloadFile(
        `https://github.com/electron/rcedit/releases/download/v${rceditVersion}/rcedit-x64.exe`,
        rceditPath
    );
}

for (const architecture of architectures) {
    const architectureDirectory = await prepareArchitecture(architecture, version);
    const outputBaseFilename = `Scratch-FA-${version}-win-${architecture.name}-Setup`;
    run(innoCompiler, [
        `/DAppVersion=${version}`,
        `/DSourceDir=${architectureDirectory}`,
        `/DOutputDir=${installerOutputDirectory}`,
        `/DOutputBaseFilename=${outputBaseFilename}`,
        `/DIs64Bit=${architecture.is64Bit ? 1 : 0}`,
        `/DIconFile=${iconPath}`,
        path.join(desktopDirectory, 'installer.iss')
    ]);
}

for (const architecture of architectures) {
    const installerPath = path.join(
        installerOutputDirectory,
        `Scratch-FA-${version}-win-${architecture.name}-Setup.exe`
    );
    if (!await pathExists(installerPath) || (await stat(installerPath)).size === 0) {
        throw new Error(`Expected installer was not created: ${installerPath}`);
    }
}

console.log(`Windows ${version} installers created in ${installerOutputDirectory}`);

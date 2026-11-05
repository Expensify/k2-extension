const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');

const projectDirectory = path.resolve(__dirname, '..');
const distDirectory = path.join(projectDirectory, 'dist');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'k2-package-'));

try {
    const manifest = JSON.parse(fs.readFileSync(path.join(distDirectory, 'manifest.json'), 'utf8'));

    // The key pins the unpacked development ID, not the Chrome Web Store ID.
    delete manifest.key;
    const manifestPath = path.join(temporaryDirectory, 'manifest.json');
    const archivePath = path.join(temporaryDirectory, 'dist.zip');
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 4)}\n`);
    execFileSync('zip', ['-r', '-X', archivePath, '.', '-x', 'manifest.json'], {cwd: distDirectory, stdio: 'inherit'});
    execFileSync('zip', ['-j', '-X', archivePath, manifestPath], {stdio: 'inherit'});
    fs.copyFileSync(archivePath, path.join(projectDirectory, 'dist.zip'));
} finally {
    fs.rmSync(temporaryDirectory, {recursive: true, force: true});
}

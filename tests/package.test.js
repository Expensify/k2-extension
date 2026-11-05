const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const projectDirectory = path.resolve(__dirname, '..');

test('Chrome development key pins a distinct extension ID', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(projectDirectory, 'assets/manifest.json'), 'utf8'));
    assert.equal(crypto.createPublicKey({key: Buffer.from(manifest.key, 'base64'), format: 'der', type: 'spki'}).asymmetricKeyType, 'rsa');
    const id = crypto.createHash('sha256').update(Buffer.from(manifest.key, 'base64')).digest('hex').slice(0, 32)
        .replace(/[0-9a-f]/g, digit => String.fromCharCode(97 + parseInt(digit, 16)));
    assert.equal(id, 'goponelbopkkdppllniggobmpndhbpba');
    assert.notEqual(id, 'hmhoemhekchomabhoccbidjnoenbphno');
});

test('packaging strips the development key without changing the unpacked manifest', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'k2-package-test-'));
    try {
        fs.mkdirSync(path.join(directory, 'tools'));
        fs.mkdirSync(path.join(directory, 'dist'));
        fs.copyFileSync(path.join(projectDirectory, 'tools/package.js'), path.join(directory, 'tools/package.js'));
        const manifest = {
            manifest_version: 3,
            name: 'test',
            version: '1.0',
            key: 'development-key',
        };
        const manifestPath = path.join(directory, 'dist/manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest));
        fs.writeFileSync(path.join(directory, 'dist/content.js'), 'content');

        execFileSync(process.execPath, [path.join(directory, 'tools/package.js')]);
        const archive = path.join(directory, 'dist.zip');
        const packagedManifest = JSON.parse(execFileSync('unzip', ['-p', archive, 'manifest.json'], {encoding: 'utf8'}));
        assert.deepEqual(packagedManifest, {manifest_version: 3, name: 'test', version: '1.0'});
        assert.deepEqual(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), manifest);
        assert.equal(execFileSync('unzip', ['-p', archive, 'content.js'], {encoding: 'utf8'}), 'content');

        fs.unlinkSync(path.join(directory, 'dist/content.js'));
        fs.writeFileSync(path.join(directory, 'dist/events.js'), 'events');
        execFileSync(process.execPath, [path.join(directory, 'tools/package.js')]);
        assert.equal(execFileSync('unzip', ['-Z1', archive], {encoding: 'utf8'}).includes('content.js'), false);
        assert.equal(execFileSync('unzip', ['-p', archive, 'events.js'], {encoding: 'utf8'}), 'events');
    } finally {
        fs.rmSync(directory, {recursive: true, force: true});
    }
});

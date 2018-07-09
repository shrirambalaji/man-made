const path = require('path');
const fs = require('fs-extra');
const test = require('ava');
const SRCDIR = path.join('..', '..', 'src');
const manMade = require(path.join(SRCDIR));
const fileUtil = require('util-box').fileUtil;
const postInstall = require(path.join(SRCDIR, 'install'));
const config = require(path.join(SRCDIR, 'config'));

test('createManualDirectory creates the Manual Directory', async (t) => {
	const manPath = config.test.defaultDir;
	try {
		const srcDir = await manMade.createManualDirectory();
		t.is(srcDir, '__tests__/unit/fixtures/.man-made');
	} catch (error) {
		t.falsy(error);
	}
});

test('updateManPath adds MANPATH to the directory', async (t) => {
	const shellPath = `${config.test.defaultShell}`;
	const manPath = `~/.man-made`;
	try {
		const shellFile = await fs.ensureFile(shellPath); // create or return existing shell file
		const manDir = await fs.ensureDir(manPath); // create or return existing directory
		const truncate = await fileUtil.truncateFile(shellPath);
		const modifiedShellFile = await manMade.updateManPath(shellPath, manPath);
		const readModifiedShellFile = await fileUtil.readFile(shellPath);
		t.regex(readModifiedShellFile, new RegExp(/export MANPATH=\$MANPATH:~\/.man-made/));
		const truncateShellFile = await fileUtil.truncateFile(shellPath);
		const readTruncatedFile = await fileUtil.readFile(shellPath);
		t.is(readTruncatedFile.length, 0);
	} catch (error) {
		t.falsy(error);
	}
});

test('findGlobalModules returns the list of global modules installed', async (t) => {
	try {
		const globalModules = await manMade.findGlobalModules();
		Object.keys(globalModules).map((el) => {
			const pkg = globalModules[el];
			t.truthy(pkg);
			t.truthy(pkg.name);
			t.truthy(pkg.description);
			t.truthy(pkg.version);
			t.truthy(pkg.readme);
		});
	} catch (e) {
		t.falsy(e);
	}
});

test('generate ManPages generates manDocs for global Modules', async (t) => {
	try {
		const manualDirectoryPath = `${config.test.defaultDir}/man${config.test.defaultSection}`;
		const generatedManPages = await manMade.generateManPages(manualDirectoryPath);
		const directories = await fs.readdir(manualDirectoryPath);
		directories.forEach((dir) => {
			t.regex(dir, new RegExp('.gz'));
		});
	} catch (err) {
		t.falsy(err);
	}
});

test('finds the global module directory path', async (t) => {
	try {
		const dir = await manMade.getGlobalModuleDirectory();
		t.is(dir, '/usr/local/lib/node_modules');
	} catch (error) {
		t.falsy(error);
	}
});

// test('watch for newly added modules', async (t) => {});
test('end-to-end post install script', async (t) => {
	const install = postInstall();
	const manualDirectoryPath = `./${config.test.defaultDir}/man${config.test.defaultSection}`;
	try {
		const directories = await fs.readdir(manualDirectoryPath);
		directories.forEach((dir) => {
			t.regex(dir, new RegExp('.gz'));
		});
	} catch (e) {
		t.falsy(e);
	}
});

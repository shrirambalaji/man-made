const path = require('path');
const fs = require('fs-extra');
const test = require('ava');
const manMade = require('../../');
const HOMEDIR = path.join(__dirname, '..', '..');
const TESTDIR = path.join(HOMEDIR, '__tests__', 'unit');
const fileUtil = require('util-box').fileUtil;

test('addManDirectoryToPath adds MANPATH to the directory', async (t) => {
	const shellPath = `${TESTDIR}/fixtures/.zshrc`;
	const manPath = `~/.man-made`;
	try {
		const shellFile = await fs.ensureFile(shellPath); // create or return existing shell file
		const manDir = await fs.ensureDir(manPath); // create or return existing directory
		const modifiedShellFile = await manMade.addManDirectoryToPath(shellPath, manPath);
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
		});
	} catch (e) {
		t.falsy(e);
	}
});

test.serial('generate ManPages generates manDocs for global Modules', async (t) => {
	try {
		const manualDirectoryPath = `${TESTDIR}/fixtures/.man-made/man1`;
		const generatedManPages = await manMade.generateManPages(manualDirectoryPath);
		const directories = await fs.readdir(manualDirectoryPath);
		directories.forEach((dir) => {
			t.regex(dir, new RegExp('.gz'));
		});
	} catch (err) {
		t.falsy(err);
	}
});

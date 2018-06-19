const path = require('path');
const fs = require('fs-extra');
const test = require('ava');
const manMade = require('../../');
const HOMEDIR = path.join(__dirname, '..', '..');
const TESTDIR = path.join(HOMEDIR, '__tests__', 'unit');
const fileUtil = require('util-box').fileUtil;

test('createWritableStream returns a writable file stream', async (t) => {
	try {
		const fileName = `${TESTDIR}/fixtures/writeFile.txt`;
		const out = await manMade.createWritableStream(fileName);
		const date = `${new Date().toDateString()}`;
		out.write(`Running Test at ${date}`);
		const fileOutput = await fileUtil.readFile(fileName);
		t.regex(fileOutput.trim(), new RegExp(`Running Test at ${date}`), 'Regex matched');
		const truncatedFile = await fileUtil.truncateFile(fileName);
		const readTruncatedFile = await fileUtil.readFile(fileName);
		t.is(readTruncatedFile.length, 0);
	} catch (error) {
		t.falsy(error);
	}
});

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

test('generate ManPages generates manDocs for global Modules', async (t) => {
	try {
		const generatedManPages = await manMade.generateManPages(`${TESTDIR}/fixtures/.man-made`);
		t.pass();
	} catch (err) {
		t.falsy(err);
	}
});

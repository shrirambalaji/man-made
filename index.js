#!/usr/bin/env node

const readMeToManual = require('readme-to-man-page');
const os = require('os');
const fse = require('fs-extra');
const findUp = require('find-up');
const chokidar = require('chokidar');
const pick = require('object.pick');
const Promise = require('bluebird');
const promisifiedExec = Promise.promisify(require('child_process').exec);
const fileUtil = require('util-box').fileUtil;
const { error, success, debug } = require('util-box').outputUtil;
const DEFAULT_DIRECTORY = `${os.homedir()}/.man-made`;
const REQUIRED_MODULE_PROPERTIES = [
	'name',
	'path',
	'readme',
	'readmeFilename',
	'description',
	'version'
];
module.exports = {
	addManDirectoryToPath(shellPath, manualDirectory) {
		return this.createWritableStream(shellPath)
			.then((out) => {
				out.write(`export MANPATH=$MANPATH:${manualDirectory}`);
				return out;
			})
			.then((out) => {
				out.end();
			});
	},

	createManDirectory(dir) {
		if (!dir) dir = DEFAULT_DIRECTORY;
		return Promise.resolve(fse.ensureDir(dir));
	},

	createWritableStream(destination) {
		return Promise.resolve(fse.createWriteStream(destination));
	},

	findGlobalModules() {
		return new Promise((resolve, reject) => {
			promisifiedExec('npm list -g --depth=0 --json=true --long=true')
				.then((result) => JSON.parse(result))
				.then((json) => {
					const globalModules = json['dependencies'];
					Object.keys(globalModules).map((pkg) => {
						globalModules[pkg] = pick(globalModules[pkg], REQUIRED_MODULE_PROPERTIES);
					});
					resolve(globalModules);
				})
				.then((globalModules) => resolve(globalModules))
				.catch((err) => reject(err));
		});
	},

	findShellConfigurationFile() {
		const shell = process.env['SHELL']
			.split(process.platform !== 'win32' ? '/' : '\\')
			.slice(-1)[0];
		const defaultShellPaths = {
			bash: '~/.bashrc',
			zsh: '~/.zshrc',
			ksh: '~/.kshrc',
			csh: '~/.cshrc',
			fish: '~/.config/fish/config.fish'
		};
		for (x in defaultShellPaths) {
			if (RegExp(`${x}`).test(shell)) {
				return defaultShellPaths[x].replace('~', process.env.HOME);
			}
		}
	},

	maybeLookupReadme(pkgName) {
		return new Promise((resolve, reject) => {
			npmMan(pkgName, (err, man) => {
				err ? reject(err) : resolve(man);
			});
		});
	},

	convertReadmeToManual(readmeFilePath, options) {
		return new Promise((resolve, reject) => {
			fileUtil
				.readFile(readmeFilePath, 'utf-8')
				.then((readme) => {
					resolve(readMeToManual(readme, options));
				})
				.catch((err) => reject(err));
		});
	},

	writeManualToFile(data, filePath) {
		return new Promise((resolve, reject) => {
			fileUtil
				.writeFile(filePath, data)
				.then((fileName) => resolve(fileName))
				.catch((err) => reject(err));
		});
	},

	convertPackageToManual(pkg, manualDir) {
		return new Promise((resolve, reject) => {
			if (!pkg) reject(new Error('Invalid package'));
			else {
				const options = {
					name: pkg.name,
					version: pkg.version,
					description: pkg.description
				};
				if (pkg.readmeFilename) {
					const readme = `${pkg.path}/${pkg.readmeFilename}`;
					const manualFileName = `${manualDir}/${pkg.name}.1`;
					this.convertReadmeToManual(readme, options)
						.then((manualDoc) => {
							this.writeManualToFile(manualDoc, manualFileName)
								.then((filePath) => {
									resolve(filePath);
								})
								.catch((err) => reject(err));
						})
						.catch((err) => reject(err));
				}
			}
		});
	},

	generateManPages(manualDir) {
		this.createManDirectory(manualDir).then(() => {
			const shellPath = '__tests__/unit/fixtures/.zshrc';
			this.addManDirectoryToPath(shellPath, manualDir).then(() => {
				return this.findGlobalModules()
					.then((globalModules) => {
						Object.keys(globalModules).map((el) => {
							const pkg = globalModules[el];
							this.convertPackageToManual(pkg, manualDir)
								.then((filePath) => success(filePath))
								.catch((err) => error(err));
						});
					})
					.catch((e) => {
						error(e);
					});
			});
		});
	}
};

#!/usr/bin/env node
const os = require('os');
const zlib = require('zlib');
const fse = require('fs-extra');
const fs = require('fs');
const chokidar = require('chokidar');
const pick = require('object.pick');
const Promise = require('bluebird');
const readMeToManual = require('readme-to-man-page');
const npmMan = require('npm-man');
const { outputUtil, fileUtil } = require('util-box');
const { error, success, debug } = outputUtil;
const promisifiedExec = Promise.promisify(require('child_process').exec);
const shellUtil = require('./util/shell.util');
const config = require('./config');
const wait = require('./wait');
const DEFAULT_DIRECTORY = process.env.TEST ? config.test.defaultDir : `${os.homedir()}/.man-made`;
const DEFAULT_SECTION = process.env.TEST
	? config.test.defaultSection
	: config.manual.defaultSection;
const PACKAGE_PROPERTIES = config.packageProps;

class ManMade {
	constructor() {
		this.watcher = null;
	}

	main() {
		let isTestShell = false;
		if (process.env.TEST || process.env.test) isTestShell = true;
		let mainDirectory = this.getDirectory();
		let section = this.getSection();
		this.createManualDirectory(mainDirectory, section)
			.then((createdDirectory) => {
				const shellOptions = { default: isTestShell };
				const shellPath = shellUtil.findShellConfigurationFile(shellOptions);
				this.updateManPath(shellPath, mainDirectory).then(() => {
					this.generateManPages(createdDirectory);
				});
			})
			.catch((err) => error(err));
	}

	getDirectory() {
		return DEFAULT_DIRECTORY;
	}

	getSection() {
		return DEFAULT_SECTION;
	}

	createManualDirectory(srcDir, section) {
		return new Promise((resolve, reject) => {
			if (!srcDir) srcDir = this.getDirectory();
			else {
				if (!section) section = this.getSection();
				srcDir = `${srcDir}/man${section}`;
			}
			fse
				.ensureDir(srcDir)
				.then(() => {
					resolve(srcDir);
				})
				.catch((err) => reject(err));
		});
	}

	updateManPath(shellPath, manualDirectory) {
		return new Promise((resolve, reject) => {
			const data = config.manual.shellExportText(manualDirectory);
			fileUtil
				.appendFile(shellPath, data)
				.then((shellPath) => resolve(shellPath))
				.catch((err) => reject(err));
		});
	}

	generateManPages(destination) {
		return this.findGlobalModules()
			.then((globalModules) => {
				Object.keys(globalModules).map((el) => {
					const pkg = globalModules[el];
					const fileName = `${destination}/${pkg.name}.${this.getSection()}.gz`;
					this.getPackageReadme(pkg)
						.then((readmeContents) => {
							this.writeToCompressedFile(readmeContents, fileName).catch((err) =>
								error(err)
							);
						})
						.catch((err) => error(err));
				});
			})
			.then(() => success('Successfully Generated ManPages for Global Modules'));
	}

	findGlobalModules() {
		return new Promise((resolve, reject) => {
			const stopSpinner = wait('Finding Globally Installed Node Modules');
			promisifiedExec(config.cmd.listModules)
				.then((result) => JSON.parse(result))
				.then((json) => {
					const globalModules = json['dependencies'];
					Object.keys(globalModules).map((pkg) => {
						globalModules[pkg] = pick(globalModules[pkg], PACKAGE_PROPERTIES);
					});
					return globalModules;
				})
				.then((globalModules) => {
					stopSpinner();
					resolve(globalModules);
				})
				.catch((err) => reject(err));
		});
	}

	getPackageReadme(pkg) {
		return new Promise((resolve, reject) => {
			if (!pkg) reject(new Error('Invalid package'));
			else {
				const options = {
					name: pkg.name,
					version: pkg.version,
					description: pkg.description,
					section: this.getSection()
				};
				if (!pkg.readmeFilename) {
					// package lacks local readme - npm readme lookup
					this.npmReadmeLookup(pkg.name)
						.then((readme) => resolve(readme))
						.catch((err) => reject(err));
				} else {
					// package has local readme
					const readmeSourcePath = `${pkg.path}/${pkg.readmeFilename}`;
					this.convertReadmeToManual(readmeSourcePath, options)
						.then((manualData) => resolve(manualData))
						.catch((err) => reject(err));
				}
			}
		});
	}

	npmReadmeLookup(pkgName) {
		return new Promise((resolve, reject) => {
			npmMan(pkgName, (err, man) => {
				err ? reject(err) : resolve(man);
			});
		});
	}

	convertReadmeToManual(readmeFilePath, options) {
		return new Promise((resolve, reject) => {
			fileUtil
				.readFile(readmeFilePath, 'utf-8')
				.then((readme) => resolve(readMeToManual(readme, options)))
				.catch((err) => reject(err));
		});
	}

	// write compressed data to file
	writeToCompressedFile(data, filePath) {
		return new Promise((resolve, reject) => {
			this._compressData(data).then((buffer) => {
				fs.writeFile(filePath, buffer, (err) => {
					err ? reject(err) : resolve(filePath);
				});
			});
		});
	}

	// performs gzip compression on input data and returns a buffer
	_compressData(data) {
		return new Promise((resolve, reject) => {
			zlib.gzip(data, (err, buffer) => {
				err ? reject(err) : resolve(buffer);
			});
		});
	}
}

module.exports = new ManMade();

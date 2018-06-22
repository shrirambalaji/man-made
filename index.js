#!/usr/bin/env node

const readMeToManual = require('readme-to-man-page');
const os = require('os');
const zlib = require('zlib');
const fse = require('fs-extra');
const fs = require('fs');
const findUp = require('find-up');
const chokidar = require('chokidar');
const pick = require('object.pick');
const Promise = require('bluebird');
const fileUtil = require('util-box').fileUtil;
const { error, success, debug } = require('util-box').outputUtil;
const promisifiedExec = Promise.promisify(require('child_process').exec);
const shellUtil = require('./util/shell.util');
const config = require('./config');
const DEFAULT_DIRECTORY = `${os.homedir()}/.man-made/man1`;
const PACKAGE_PROPERTIES = config.packageProps;

class ManMade {
	addManDirectoryToPath(shellPath, manualDirectory) {
		return new Promise((resolve, reject) => {
			const data = config.shellExportText(manualDirectory);
			fileUtil
				.appendFile(shellPath, data)
				.then((shellPath) => resolve(shellPath))
				.catch((err) => reject(err));
		});
	}

	createManDirectory(dir, section) {
		if (!dir) dir = DEFAULT_DIRECTORY;
		else {
			if (!section) section = 1;
			dir = `${dir}/man${section}`;
		}
		return Promise.resolve(fse.ensureDir(dir));
	}

	findGlobalModules() {
		return new Promise((resolve, reject) => {
			promisifiedExec(config.cmd.listModules)
				.then((result) => JSON.parse(result))
				.then((json) => {
					const globalModules = json['dependencies'];
					Object.keys(globalModules).map((pkg) => {
						globalModules[pkg] = pick(globalModules[pkg], PACKAGE_PROPERTIES);
					});
					resolve(globalModules);
				})
				.then((globalModules) => resolve(globalModules))
				.catch((err) => reject(err));
		});
	}

	maybeLookupReadme(pkgName) {
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
				.then((readme) => {
					resolve(readMeToManual(readme, options));
				})
				.catch((err) => reject(err));
		});
	}

	writeManualToFile(data, filePath) {
		return new Promise((resolve, reject) => {
			this.compressData(data).then((buffer) => {
				fs.writeFile(filePath, buffer, (err) => {
					err ? reject(err) : resolve(filePath);
				});
			});
		});
	}

	// performs gzip compression on input data and returns a buffer
	compressData(data) {
		return new Promise((resolve, reject) => {
			zlib.gzip(data, (err, buffer) => {
				err ? reject(err) : resolve(buffer);
			});
		});
	}

	convertPackageToManual(pkg, manualDir) {
		return new Promise((resolve, reject) => {
			if (!pkg) reject(new Error('Invalid package'));
			else {
				const options = {
					name: pkg.name,
					version: pkg.version,
					description: pkg.description,
					section: 1
				};
				if (pkg.readmeFilename) {
					const sourceReadme = `${pkg.path}/${pkg.readmeFilename}`;
					const manualDestionationFile = `${manualDir}/${pkg.name}.1.gz`;
					this.convertReadmeToManual(sourceReadme, options)
						.then((manualData) => {
							this.writeManualToFile(manualData, manualDestionationFile)
								.then((writtenFilePath) =>
									debug(
										`Manual page for ${pkg.name} is now at ${writtenFilePath}`
									)
								)
								.catch((err) => reject(err));
						})
						.catch((err) => reject(err));
				}
			}
		});
	}

	generateManPages(manualSourceDirectory) {
		return this.findGlobalModules().then((globalModules) => {
			Object.keys(globalModules).map((el) => {
				const pkg = globalModules[el];
				this.convertPackageToManual(pkg, manualSourceDirectory)
					.then((filePath) => success(filePath))
					.catch((err) => error(err));
			});
		});
	}

	main() {
		const isTestShell = false;
		if (process.env.TEST || process.env.test) isTestShell = true;
		this.createManDirectory(manualSourceDirectory, manualSectionNumber)
			.then(() => {
				const shellOptions = { default: isTestShell };
				const shellPath = shellUtil.findShellConfigurationFile(shellOptions);
				this.addManDirectoryToPath(shellPath, manualSourceDirectory).then(() => {});
			})
			.catch((err) => error(err));
	}
}

module.exports = new ManMade();

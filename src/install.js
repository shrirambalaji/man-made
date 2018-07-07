#!/usr/bin/env node
const manMade = require('./');
const postInstallation = () => {
	manMade.main();
};

if (require.main === module) {
	postInstallation();
}

module.exports = postInstallation;

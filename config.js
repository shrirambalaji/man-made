const config = {};
config.defaultTestShell = '__tests__/unit/fixtures/.zshrc';
config.packageProps = [ 'name', 'path', 'readme', 'readmeFilename', 'description', 'version' ];
config.shellExportText = (manualDirectory) => {
	return `\n
# custom man-pages set by man-made.
# uninstall by removing these lines or running npm uninstall -g man-made
export MANPATH=$MANPATH:${manualDirectory}
\n`;
};
config.cmd = {};
config.cmd.listModules = 'npm list -g --depth=0 --json=true --long=true';
module.exports = config;

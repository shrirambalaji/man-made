const config = {};
config.test = {};
config.test.defaultShell = '__tests__/unit/fixtures/.zshrc';
config.test.defaultDir = '__tests__/unit/fixtures/.man-made';
config.test.defaultSection = '1';
config.packageProps = [ 'name', 'path', 'readme', 'readmeFilename', 'description', 'version' ];
config.cmd = {};
config.cmd.listModules = 'npm list -g --depth=0 --json=true --long=true';
config.cmd.watchDir = 'npm root -g';
config.manual = {};
config.manual.defaultDir = '~/man-made';
config.manual.defaultSection = '1';
config.manual.shellExportText = (manualDirectory) => {
	return `\n
# custom man-pages set by man-made.
# uninstall by removing these lines or running npm uninstall -g man-made
export MANPATH=$MANPATH:${manualDirectory}
\n`;
};
module.exports = config;

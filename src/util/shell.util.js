const config = require('../config');
const shellUtil = () => {};
shellUtil.findShellConfigurationFile = (options) => {
	if (options.default) {
		return config.test.defaultShell;
	} else {
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
	}
};

module.exports = shellUtil;

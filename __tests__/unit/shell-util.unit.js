const path = require('path');
const test = require('ava');
const SRCDIR = path.join('..', '..', 'src');
const shellUtil = require(path.join(SRCDIR, 'util', 'shell.util'));

test('shellUtil returns default Shell argument for Tests', (t) => {
	const shell = shellUtil.findShellConfigurationFile({ default: true });
	t.is(shell, '__tests__/unit/fixtures/.zshrc');
});

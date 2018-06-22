const shellUtil = require('../../util/shell.util');
const test = require('ava');

test('shellUtil returns default Shell argument for Tests', (t) => {
	const shell = shellUtil.findShellConfigurationFile({ default: true });
	t.is(shell, '__tests__/unit/fixtures/.zshrc');
});

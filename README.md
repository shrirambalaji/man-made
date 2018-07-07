# man-made

> Man Pages for Global Node Modules, right in the terminal.

Man-made is a tool to generate manual pages for globally installed node modules.

## How Does it Work?

This tools finds the list of global modules, and converts the readme markdown into manual page documentations and stores them in the user's home directory inside `.man-made` and updates your shell configuration's MANPATH to use these newly added manual pages.

This works with most unix based shells, including

- zsh
- bash
- fish
- csh
- ksh

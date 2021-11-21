## Features
### Latex Environment($) Handling
1. Autocompletes \$\$ and \$\$\$\$ 
2. Auto-wrap selected equations around \$ or \$\$
3. Escape in-line/equation environments by pressing "\$"
4. #TODO: `\$` only types single dollar
5. #TODO: this does not apply in code blocks

### Subscript (^), Superscript(\_) Handling
1. In text mode, autocompletes `<sub> </sub>`  (`<sup> </sup>`) around subscripted (superscripted) text
	- Removed auto-pairing of `_` for italics (please use \*\* or Ctrl + U).
2. In math mode, autocompletes {} around subscripted (superscripted) text

#### How it works:
1. Enter `_` or `^` to enter super/subscript "mode".
	- #TODO Does not trigger in code blocks
2. Enter text in this mode.
3. Press space to automatically convert text between symbol to cursor to its $LaTeX$/HTML Equivalent.
	- `$`,`_`, `^`,`+`,`*`,`,`,`|`, `-`,`/`,`\`, `)`, `]`, `}`  triggers the conversion.
4. Press Esc to terminates this mode without the conversion.
	- Pressing arrow keys terminates this mode
	
### Fast fraction in Math Mode (/)
1. Autocompletes `\frac{}{}` when space is pressed after a slash (/).
	- a/b autocompletes to `\frac{a}[b}`
	- a/ autocompletes to `\frac{a}{}`, with cursor in second bracket
	- / autocompletes to `\frac{}{}`, with cursor in first bracket
	- Numerator automatically detects brackets (`(`, `[`, `{` ) to be enclosed
	- Denominator enclosed is the characters between the `/` and cursor.
- Again, Escape prevents autocomplete. 

### Brackets in Math Mode(`(`, `[`, `{`)
- Autocompletes brackets in Math Mode.
- #TODO: Autocomplete `|` (abs) in math mode


## Obsidian Sample Plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

This sample plugin demonstrates some of the basic functionality the plugin API can do.
- Changes the default font color to red using `styles.css`.
- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open Sample Modal" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and output 'click' to the console.
- Registers a global interval which logs 'setInterval' to the console.

### First time developing plugins?

Quick starting guide for new plugin devs:

- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

### Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

### Adding your plugin to the community plugin list

- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

### How to use

- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

### Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

### Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`


### API Documentation

See https://github.com/obsidianmd/obsidian-api

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

### API Documentation

See https://github.com/obsidianmd/obsidian-api

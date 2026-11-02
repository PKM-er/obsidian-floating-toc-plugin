import esbuild from "esbuild";
import process from "process";
import builtins from 'builtin-modules'
import fs from 'fs';

const banner =
	`/*
	This is the Obsidian example vault is amazing, there are a lot of dazzling features and showcase, I believe you will wonder a bit, is this Obsidian?
	[Blue-topaz-examples](https://github.com/cumany/Blue-topaz-examples)
	*/
`;

const prod = (process.argv[2] === 'production');

// Keep the build directory ready to install, including Obsidian's required CSS.
const copyPluginAssets = () => {
	for (const file of ['manifest.json', 'styles.css']) {
		fs.copyFileSync(file, `./build/${file}`);
	}
};
try {
	await esbuild.build({
		banner: {
			js: banner,
		},
		entryPoints: ['src/main.ts'],
		bundle: true,
		minify: true,
		external: [
			'obsidian',
			'electron',
			'@codemirror/autocomplete',
			'@codemirror/closebrackets',
			'@codemirror/collab',
			'@codemirror/commands',
			'@codemirror/comment',
			'@codemirror/fold',
			'@codemirror/gutter',
			'@codemirror/highlight',
			'@codemirror/history',
			'@codemirror/language',
			'@codemirror/lint',
			'@codemirror/matchbrackets',
			'@codemirror/panel',
			'@codemirror/rangeset',
			'@codemirror/rectangular-selection',
			'@codemirror/search',
			'@codemirror/state',
			'@codemirror/stream-parser',
			'@codemirror/text',
			'@codemirror/tooltip',
			'@codemirror/view',
			...builtins],
		format: 'cjs',
		watch: prod ? false : {
			onRebuild(error) {
				if (!error) copyPluginAssets();
			}
		},
		target: 'es2016',
		logLevel: "info",
		sourcemap: prod ? false : 'inline',
		treeShaking: true,
		// outfile: './build/main.js',
		outfile: './build/main.js', // Utilizes the hot-reload plugin for dynamic reloading. See https://github.com/pjeby/hot-reload for details.

	});
	copyPluginAssets();
}
catch (e) {
	console.error(e);
	process.exit(1)
}

// Integration test against the installed plugin in a running Obsidian vault.
// Temporary notes and tabs are removed, and the original tab is restored.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

const cli = process.env.OBSIDIAN_CLI || 'obsidian';
const key = `__floatingTocSmoke${Date.now()}`;
const command = (...args) => execFileSync(cli, args, { encoding: 'utf8' }).trim();

async function evaluate(source) {
    command('eval', `code=(async () => {
        try { window.${key}.result = { value: await (async () => { ${source} })() }; }
        catch (error) { window.${key}.result = { error: error.stack || String(error) }; }
    })()`);
    for (let attempt = 0; attempt < 100; attempt++) {
        const output = command('eval', `code=JSON.stringify(window.${key}.result)`);
        const json = output.replace(/^=>\s*/, '');
        if (json.startsWith('{')) {
            command('eval', `code=delete window.${key}.result`);
            const result = JSON.parse(json);
            if (result.error) throw new Error(result.error);
            return result.value;
        }
        await delay(50);
    }
    throw new Error('Obsidian evaluation timed out');
}

async function expectHeadings(expected) {
    let actual;
    for (let attempt = 0; attempt < 40; attempt++) {
        actual = await evaluate(`return [...app.workspace.activeLeaf.view.contentEl
            .querySelectorAll('li.heading-list-item a.text')].map(el => el.textContent);`);
        if (JSON.stringify(actual) === JSON.stringify(expected)) return;
        await delay(100);
    }
    assert.deepEqual(actual, expected);
}

async function main() {
    command('eval', `code=window.${key} = { original: app.workspace.activeLeaf, files: [], leaves: [] }`);
    try {
        await evaluate(`
            const state = window.${key};
            if (!app.plugins.plugins['floating-toc']) throw new Error('Enable floating-toc first');
            const file = await app.vault.create('${key}.md', '# First heading\\n\\n## Child heading\\n');
            state.files.push(file);
            const leaf = app.workspace.getLeaf('tab');
            state.leaves.push(leaf);
            await leaf.openFile(file);
        `);
        await expectHeadings(['First heading', 'Child heading']);

        // Startup/reload must initialize the file identity before cache events arrive.
        await evaluate(`
            await app.plugins.disablePlugin('floating-toc');
            await app.plugins.enablePlugin('floating-toc');
        `);
        await expectHeadings(['First heading', 'Child heading']);
        await evaluate(`await app.vault.modify(window.${key}.files[0], '# Renamed heading\\n');`);
        await expectHeadings(['Renamed heading']);
        console.log('PASS: heading edits immediately after plugin reload');

        // A second view of the same file still needs its own TOC.
        await evaluate(`
            const leaf = app.workspace.getLeaf('tab');
            window.${key}.leaves.push(leaf);
            await leaf.openFile(window.${key}.files[0]);
        `);
        await expectHeadings(['Renamed heading']);
        console.log('PASS: same document in a second tab');

        await evaluate(`await app.vault.modify(window.${key}.files[0], 'No headings\\n');`);
        await expectHeadings([]);
        await evaluate(`await app.vault.modify(window.${key}.files[0], '# Restored heading\\n');`);
        await expectHeadings(['Restored heading']);
        console.log('PASS: removing and restoring all headings');

        await evaluate(`
            const leaf = app.workspace.activeLeaf;
            await leaf.setViewState({ ...leaf.getViewState(), state: { ...leaf.view.getState(), mode: 'preview' } });
        `);
        await expectHeadings(['Restored heading']);
        console.log('PASS: reading mode');
    } finally {
        await evaluate(`
            const state = window.${key};
            for (const leaf of state.leaves) leaf.detach();
            app.workspace.setActiveLeaf(state.original, { focus: true });
            for (const file of state.files) await app.vault.delete(file);
        `);
        command('eval', `code=delete window.${key}`);
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

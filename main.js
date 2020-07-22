const { exec } = require('child_process');

// github actions pass inputs as environment variables prefixed with INPUT_ and uppercased
function getInput(key) {
    var variable = 'INPUT_'+key;
    var result = process.env[variable.toUpperCase()];
    console.log(`Using input for ${key}: ${result}`);
    return result;
}

// rather than npm install @actions/core, output using the console logging syntax
// see https://help.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-an-output-parameter
function setOutput(key, value) {
    console.log(`::set-output name=${key}::${value}`)
}

try {
    const include = getInput('include');
    const exclude = getInput('exclude');
    const commitIsh = getInput('commit-ish');
    const skipUnshallow = getInput('skip-unshallow') === 'true';
    const exactMatch = getInput('exact-match') === 'true';
    const noTagText = getInput('no-tags-text');

    var includeOption = '';
    var excludeOption = '';
    var commitIshOption = '';
    var noTagTextOption = 'NO_TAGS';

    if (typeof include === 'string' && include.length > 0) {
        includeOption = `--match '${include}'`;
    }

    if (typeof exclude === 'string' && exclude.length > 0) {
        excludeOption = `--exclude '${exclude}'`;
    }

    if (typeof commitIsh === 'string') {
        commitIshOption = `'${commitIsh}'`;
    }

    if (typeof noTagText === 'string') {
        noTagTextOption = `'${noTagText}'`;
    }

    var unshallowCmd = skipUnshallow ? '' : 'git fetch --prune --unshallow &&'
    var exactMatchOption = exactMatch ? '--exact-match' : ''

    // actions@checkout performs a shallow checkout. Need to unshallow for full tags access.
    var cmd = `${unshallowCmd} git describe --tags --abbrev=0 ${includeOption} ${excludeOption} ${exactMatchOption} ${commitIshOption}`.replace(/[ ]+/, ' ').trim();
    console.log(`Executing: ${cmd}`);

    exec(cmd, (err, tag, stderr) => {
        if (err) {
            console.log(`Unable to find an earlier tag.\n${stderr}`);
            console.log(`Outputting tag: ${noTagTextOption}`)
            return setOutput('tag', noTagTextOption.trim());
        }
        console.log(`Outputting tag: ${tag.trim()}`)
        return setOutput('tag', tag.trim());
    });
} catch (error) {
    core.setFailed(error.message);
}

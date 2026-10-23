const test = require('tap').test;
const configs = require('../../webpack.config');

test('Node output leaves hoisted dependencies for Node to load', async t => {
    const config = configs.find(item => item.target === 'node');
    for (const request of ['@scratch/scratch-svg-renderer', 'isomorphic-dompurify']) {
        const results = await Promise.all(config.externals.filter(item => typeof item === 'function')
            .map(external => new Promise((resolve, reject) => {
                external({context: __dirname, request}, (error, value) => {
                    if (error) reject(error);
                    else resolve(value);
                });
            })));
        t.ok(results.includes(`commonjs ${request}`), `${request} stays external`);
    }
});

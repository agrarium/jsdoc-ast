const { basename } = require('path');
const jsoak = require('jsoak');

const data = require('./data');

function validateTree(data) {
    const wrapInFile = children => ({ children });
    for(let spec of data) {
        it(spec.type, function() {
            const { result, sources } = spec;

            for(let source of sources) {
                expect(jsoak(source, 'file.js')).toMatchObject(wrapInFile(result));
            }
        })
    }
}

validateTree(data);

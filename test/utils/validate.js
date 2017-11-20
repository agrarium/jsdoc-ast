const jsoak = require('jsoak');

function assert(message) {
    return {
        test: (res, exp) => {
            try {
                expect(res).toMatchObject(exp);
            } catch (error) {
                console.error(message);
                throw new Error(error);
            }
        }
    }
}

module.exports = function validate(data) {
    const wrapInFile = children => ({ children });
    for(let spec of data) {
        it(spec.type, function() {
            const { result, sources } = spec;

            for(let source of sources) {
                assert(`Couldn't parse source: \n${source}`)
                    .test(jsoak(source, 'file.js'), wrapInFile(result));
            }
        })
    }
}

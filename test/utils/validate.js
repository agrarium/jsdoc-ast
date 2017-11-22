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
        describe(spec.type, () => {
            const { result, sources } = spec;

            for(let source of sources) {
                it(source.name || source.split('\n')[0].slice(0, 60), () => {
                    assert(`Couldn't parse source: \n${source}`)
                        .test(jsoak(source.code || source, 'file.js'), wrapInFile(result));
                });
            }
        })
    }
}

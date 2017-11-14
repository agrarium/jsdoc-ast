const { basename } = require('path');
const jsoak = require('jsoak');

describe('node modules', () => {
    it('default named function', () => {
        const file = basename(__filename);

        const source = `
        /**
         * This is a function that is extended by a module.
         * 
         * @param arg - an argument
         * 
        */
        module.exports = function moduleFunction(arg) {};
        `;

        const tree = {
            id: 0,
            name: 'function',
            originalName: file,
            kind: 1,
            kindString: 'ExternalModule',
            children: [
                {
                    id: 1,
                    name: 'moduleFunction',
                    kind: 2,
                    kindString: 'Module',
                    // flags: {
                    //   isExported: true
                    // },
                    signatures: [
                        {
                            name: 'moduleFunction',
                            kind: 4096,
                            kindString: 'CallSignature',
                            // "comment": {
                            //     "shortText": "This is a function that is extended by a module."
                            // },
                            parameters: [
                                {
                                    name: 'arg',
                                    kind: 32768,
                                    kindString: 'Parameter',
                                    // "comment": {
                                    //   "text": "An argument.\n"
                                    // },
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        expect(jsoak(source, file)).toMatchObject(tree);
    });
});

describe('es modules', () => {
    
});

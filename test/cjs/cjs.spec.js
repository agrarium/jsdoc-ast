const validate = require('../utils/validate');

validate([
    {
        type: 'unknown default export', // describe
        result: [{
            name: null,
            kind: 2,
            signatures: [
                {
                    name: null,
                    kind: 4096,
                    flags: {isExported: true},
                    comment: {shortText: 'Ololo'},
                    parameters: [
                        {name: 'arg', kind: 32768}
                    ]
                }
            ]
        }],
        sources: [{
            name: 'simple', // it
            code: unIndent`
                /** Ololo */
                module.exports = function(arg) {}; // Default
                // IS NOT: export default function(arg) {};
                // {__es6Module: true, default: function(arg) {}, ololo: function ololo(arg) {}}
            `
        }]
    },
    {
        type: 'simple default export',
        result: [{
            name: 'moduleFunction',
            kind: 2,
            signatures: [
                {
                    name: 'moduleFunction',
                    kind: 4096,
                    flags: {isExported: true},
                    comment: {shortText: 'Ololo'},
                    parameters: [
                        {name: 'arg', kind: 32768}
                    ]
                }
            ]
        }],
        sources: [{
            name: 'named function',
            code: unIndent`
                /** Ololo */
                module.exports = function moduleFunction(arg) {};
            `,
        }, {
            name: 'anonymous function in variable',
            code: unIndent`
                /** Ololo */
                const moduleFunction = function(arg) {}
                module.exports = moduleFunction;
            `
        }]
    },
    {
        type: 'object exports',
        result: [{
            name: 'moduleFunction',
            kind: 2,
            signatures: [
                {
                    name: 'moduleFunction',
                    kind: 4096,
                    flags: {isExported: true},
                    comment: {shortText: 'Ololo'},
                    parameters: [
                        {name: 'arg', kind: 32768}
                    ]
                }
            ]
        }],
        sources: [
            unIndent`
                /** Ololo */
                exports.moduleFunction = function(arg) {}
            `,

            unIndent`
                /** Ololo */
                const ebalo = function(zawali) {}
                exports.moduleFunction = ebalo;
            `,

            unIndent`
                const ebalo = 'moduleFunction';
                /** Ololo */
                exports[ebalo] = function(arg) {};
            `,

            unIndent`
                const exports = {
                    /** Ololo */
                    moduleFunction: function(arg) {}
                };
                module.exports = exports;
            `,

            unIndent`
                /** Ololo */
                Object.assign(module.exports, { moduleFunction: function(arg) {} });
            `,

            unIndent`
                Object.assign(module.exports, { moduleFunction });
                /** Ololo */
                function moduleFunction() {}
            `
        ]
    },
    {
        type: 'mixed export',
        result: {},
        sources: [
            unIndent`
                /** Ololo */
                module.exports = function(arg) {}
                /** Ne ololo */
                module.exports.moduleFunction = function() {};
            `
        ]
    },
    {
        skip: true,
        type: 'dich',
        result: {},
        sources: [
            unIndent`
                exports = Object.assign({}, require('./email-manager'));
                exports = Object.assign(exports, require('./email-daemon'));
                module.exports = exports;
            `
        ]
    }
]);

/**
 * Prevents leading spaces in a multiline template literal from appearing in the resulting string
 * @param {string[]} strings The strings in the template literal
 * @returns {string} The template literal, with spaces removed from all lines
 */
function unIndent(strings) {
    const templateValue = strings[0];
    const lines = templateValue.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
    const lineIndents = lines.filter(line => line.trim()).map(line => line.match(/ */)[0].length);
    const minLineIndent = Math.min.apply(null, lineIndents);

    return lines.map(line => line.slice(minLineIndent)).join("\n");
}

[
    {
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
        sources: [
            `/** Ololo */
            module.exports = function(arg) {};`,
        ]
    },
    {
        result: [{
            name: 'moduleFunction',
            kind: 2,
            signatures: [
                {
                    name: 'moduleFunction',
                    kind: 4096,
                    flags: {isExported: true, isDefault: true},
                    comment: {shortText: 'Ololo'},
                    parameters: [
                        {name: 'arg', kind: 32768}
                    ]
                }
            ]
        }],
        sources: [
            `/** Ololo */
            module.exports = function moduleFunction(arg) {};`,

            `/** Ololo */
            const moduleFunction = function(arg) {}
            module.exports = moduleFunction;`
        ]
    },

    {
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
            `/** Ololo */
            exports.moduleFunction = function(arg) {}`,

            `/** Ololo */
            const ebalo = function(zawali) {}
            exports.moduleFunction = ebalo;`,

            `const ebalo = 'moduleFunction';
            /** Ololo */
            exports[ebalo] = function(arg) {};`,

            `const exports = {
                /** Ololo */
                moduleFunction: function(arg) {}
            };
            module.exports = exports;`,

            `/** Ololo */
            Object.assign(module.exports, { moduleFunction: function(arg) {} });`,

            `Object.assign(module.exports, { moduleFunction });
            /** Ololo */
            function moduleFunction() {}`
        ]
    },

    {
        result: {},
        sources: [
            `/** Ololo */
            module.exports = function(arg) {}
            /** Ne ololo */
            module.exports.moduleFunction = function() {};`
        ]
    }
]

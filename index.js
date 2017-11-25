const babelCore = require('babel-core');

const Parser = require('./lib/parser');

module.exports = function ast(source, file) {
    const parser = new Parser({ file });

    babelCore.transform(source, {
        plugins: parser.visitor
    });

    // COLLECTED

    

    return parser.tree;
};

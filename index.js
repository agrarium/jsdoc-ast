const babelCore = require('babel-core');

const parser = require('./lib/parser');

module.exports = function ast(source, file) {
    const tree = {};

    babelCore.transform(source, {
        plugins: parser({ tree, file })()
    });

    return tree;
};

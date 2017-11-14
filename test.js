const jsDocAst = require('.');

const source = `
/*
 *
 * @param hack
 * 
*/
module.exports = function test(hack) {
    let j = 0;
};
`;

const ast = jsDocAst(source, './test.js');

console.log(JSON.stringify(ast));

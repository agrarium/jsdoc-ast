const jsDocAst = require('.');

const source = `
/*
 *
 * @param hack
 * 
*/
module.exports = function test(hack) {};
`;

const ast = jsDocAst(source, './test.js');

console.log(ast);

module.exports = function(source = {}) {
    const { tree, file } = source;
    
    return function(options = {}) {
        const { types } = options;
        
        return {
            visitor : {
                ExpressionStatement({ node }) {
                    tree.test = 'ololol';

                    const exp = node.expression;

                    if (exp.operator === '=' && 
                        exp.right.type === 'FunctionExpression' 
                    ) {
                        const exportedObj = exp.right.id.name;
                        tree.exports = {
                            [exportedObj]: {}
                        };
                        tree.exports[exportedObj].params = exp.right.params.map(paramNode => ({
                            name: paramNode.name
                        }));
                    }

                    console.log(node.leadingComments);
                    // PARSE COMMENT AND ASSIGN TO TREE
                    console.log(file);
                }
                // FunctionExpression({ node }) {
                //     console.log(node);
                // }
            }
        };
    };
}

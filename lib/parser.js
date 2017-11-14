class DefaultExportFunction {
    constructor(path) {
        
        const funcExp = path.node.expression.right;
        const comments = path.node.leadingComments;

        this.name = funcExp.id.name;
        this.params = funcExp.params.map(paramNode => ({
            name: paramNode.name
        }));

        const context = this;

        path.traverse({
            BlockStatement(path) {
                path.traverse({
                    Identifier(path) {
                        console.log('Inside exported function', path.node.name); // j
                    }
                })
            }
        });
    }
}

DefaultExportFunction.match = ({ node }) => 
    node.expression.operator === '=' && node.expression.right.type === 'FunctionExpression';

module.exports = function(source = {}) {
    const { tree, file } = source;
    
    return function(options = {}) {
        const { types } = options;
        
        return {
            visitor : {
                Program(path) {
                    tree.originalName = file;
                    tree.children = [];
                },
                ExpressionStatement(path) {
                    // FOREACH REFLS
                    if(DefaultExportFunction.match(path)) {
                        tree.children.push(new DefaultExportFunction(path));
                    }
                }
            }
        };
    };
}

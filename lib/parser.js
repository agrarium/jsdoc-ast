const { ReflectionKind, ReflectionKindString } = require('./kind');

class DefaulNodeExportFunction {
    constructor(path) {
        
        const funcExp = path.node.expression.right;
        const comments = path.node.leadingComments;

        const kind = ReflectionKind.Module;
        this.kind = kind;
        this.kindString = ReflectionKindString[kind];
        this.name = funcExp.id.name;

        this.signatures = [];

        const signatureKind = ReflectionKind.CallSignature;
        this.signatures.push({
            name: this.name,
            kind: signatureKind,
            kindString: ReflectionKindString[signatureKind],
            parameters: funcExp.params.map(paramNode => {
                const paramKind = ReflectionKind.Parameter;
                return {
                    name: paramNode.name,
                    kind: paramKind,
                    kindString: ReflectionKindString[paramKind],
                };
            })
        });

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

DefaulNodeExportFunction.match = ({ node }) => 
    node.expression.operator === '=' && node.expression.right.type === 'FunctionExpression';

module.exports = function(source = {}) {
    const { tree, file } = source;
    
    return function() {

        tree.originalName = file;
        tree.name = file.split('/').reverse()[0].split('.')[0];
        
        const kind = ReflectionKind.ExternalModule;
        tree.kind = kind;
        tree.kindString = ReflectionKindString[kind];
        tree.children = [];
        
        return {
            visitor : {
                ExpressionStatement(path) {
                    // FOREACH REFLS
                    if(DefaulNodeExportFunction.match(path)) {
                        tree.children.push(new DefaulNodeExportFunction(path));
                    }
                }
            }
        };
    };
}

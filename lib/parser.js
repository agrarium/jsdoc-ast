const { ReflectionKind, ReflectionKindString } = require('./kind');

let REFLECTION_ID = 0;

class Reflection {
    constructor() {
        this.id = REFLECTION_ID++;
        this.children = [];
    }

    assignKind(kind) {
        this.kind = kind;
        this.kindString = ReflectionKindString[kind];
    }
}

class FileReflection extends Reflection {
    constructor(file) {
        super();

        this.originalName = file;
        this.name = file.split('/').reverse()[0].split('.')[0];
        
        this.assignKind(ReflectionKind.ExternalModule);
    }
}

class ParameterReflection extends Reflection {
    constructor(param) {
        super();
        
        this.assignKind(ReflectionKind.Parameter);
        
        this.name = param.name;
    }
}

class SignatureReflection extends Reflection {
    constructor(expression) {
        super();

        this.assignKind(ReflectionKind.CallSignature);

        this.name = expression.id.name;
        this.parameters = expression.params.map(param => new ParameterReflection(param));
    }
}

class DefaultNodeExportFunction extends Reflection {
    constructor(path) {
        super(path);
        
        const funcExp = path.node.expression.right;
        const comments = path.node.leadingComments;

        this.assignKind(ReflectionKind.Module);
        
        this.name = funcExp.id.name;
        
        this.signatures = [];
        this.signatures.push(new SignatureReflection(funcExp));

        // const context = this;

        // path.traverse({
        //     BlockStatement(path) {
        //         path.traverse({
        //             Identifier(path) {
        //                 console.log('Inside exported function', path.node.name); // j
        //             }
        //         })
        //     }
        // });
    }
}

DefaultNodeExportFunction.match = ({ node }) => 
    node.expression.operator === '=' && node.expression.right.type === 'FunctionExpression';


class Parser {
    constructor({ file }) {
        this.file = file;
        this.oak = new FileReflection(file);
    }

    get visitor() {
        const oak = this.oak;
        return {
            visitor: {
                ExpressionStatement(path) {
                    // FOREACH REFLS
                    if(DefaultNodeExportFunction.match(path)) {
                        oak.children.push(new DefaultNodeExportFunction(path));
                    }
                }
            }
        };
    }

    get tree() {
        return this.oak;
    }
}

module.exports = Parser;

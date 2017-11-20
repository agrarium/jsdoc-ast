const { ReflectionKind, ReflectionKindString } = require('./kind');

let REFLECTION_ID = 0;

class Doc {
    constructor(comment) {
        this.shortText = comment.replace('*', '').trim();
    }
}

class Reflection {
    constructor(kind) {
        this.kind = kind;
        this.kindString = ReflectionKindString[kind];

        this.id = REFLECTION_ID++;
        this.children = [];
    }
}

class FileReflection extends Reflection {
    constructor(file) {
        super(ReflectionKind.ExternalModule);

        this.originalName = file;
        this.name = file.split('/').reverse()[0].split('.')[0];
    }
}

class ParameterReflection extends Reflection {
    constructor(param) {
        super(ReflectionKind.Parameter);
        
        this.name = param.name;
    }
}

class SignatureReflection extends Reflection {
    constructor(expression, { flags, comment }) {
        super(ReflectionKind.CallSignature);

        this.flags = flags;
        this.name = expression.id && expression.id.name;
        this.parameters = expression.params.map(param => new ParameterReflection(param));
        this.comment = new Doc(comment);
    }
}

class DefaultNodeExportFunction extends Reflection {
    constructor(path) {
        super(ReflectionKind.Module);

        // console.log('comment', path.node.leadingComments);
        
        const funcExp = path.node.expression.right;
        const comment = path.node.leadingComments && path.node.leadingComments[0].value || '';
        
        this.name = funcExp.id && funcExp.id.name;
        
        this.signatures = [];
        this.signatures.push(new SignatureReflection(funcExp, {
            flags: {
                isExported: true,
                isDefault: true
            },
            comment
        }));
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

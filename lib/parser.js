const compar = require('comment-parser');
const { Reflection, ReflectionFlag } = require('typedoc/dist/lib/models/reflections');

ReflectionFlag[ReflectionFlag.Default = 0x4000] = 'Default';

const { ReflectionKind, ReflectionKindString } = require('./kind');

const oldSetFlag = Reflection.prototype.setFlag;
Reflection.prototype.setFlag = function(flag, value = true) {
    oldSetFlag.apply(this, arguments);

    switch (flag) {
        case ReflectionFlag.Default:
            this.flags.isDefault = value;
            break;
    }
}

class Doc {
    constructor(comment) {
        const parsed = compar('/*' + comment + '*/')[0];
        const doubleNIndex = parsed.description.indexOf('\n\n');

        this.shortText = doubleNIndex !== -1 ? parsed.description.slice(0, doubleNIndex) : parsed.description;
        this.text = parsed.description;
        this.tags = parsed.tags;
    }
}

class FileReflection extends Reflection {
    constructor(file) {
        super(null, file, ReflectionKind.ExternalModule);

        this.children = [];
        this.name = file.split('/').reverse()[0].split('.')[0];
    }
}

class ParameterReflection extends Reflection {
    constructor(param) {
        super(null, param.name, ReflectionKind.Parameter);
    }
}

class SignatureReflection extends Reflection {
    constructor(expression, { flags, comment }) {
        super(null, expression.id && expression.id.name, ReflectionKind.CallSignature);

        this.flags = flags;
        // this.name = expression.id && expression.id.name;
        this.parameters = expression.params.map(param => new ParameterReflection(param));
        this.comment = new Doc(comment);
    }
}

class FunctionReflection extends Reflection {
    constructor(parent, name, kind) {
        super(parent, name, kind);

        this.signatures = [];
        // this.signatures.push(new SignatureReflection(funcExp, {
        
        // }));
    }
}

// ------------------------------------ MATCHERS

const matchers = {
    CjsExport: (path) => {
        const isModuleExports = (node) => !node.computed &&
        node.object.name === 'module' && node.property.name === 'exports';
    
        const isExportsField = (node) => !node.computed &&
            node.object.name === 'exports' && node.property.type === 'Identifier';
        
        const isExportsVariable = (node) => node.computed &&
            node.object.name === 'exports' && node.property.type === 'Identifier';

        const expr = path.node.expression;

        if (!expr) return;

        if (!(path.parent.type === 'Program' &&
            expr.type === 'AssignmentExpression' &&
            expr.left.type === 'MemberExpression')) return;

        const res = {
            type: null, 
            isDefault: false, 
            leadingComments: path.node.leadingComments &&
                path.node.leadingComments[0].value
        };
        switch (true) {
            case isModuleExports(expr.left):
                res.type = 'module.exports';
                res.isDefault = true;
                break;
            case isExportsField(expr.left):
                res.type = 'exports.x';
                break;
            case isExportsVariable(expr.left):
                res.type = 'exports[x]';
                break;
            default: throw new Error('tobi pizdec')
        }

        res.node = path.node.expression.right;

        console.log('res', res);

        return res;
    }
};

// ------------------------------------ CONVERTERS

const converters = {
    FunctionExpression: function(matchResult)/*: SignatureReflection*/ {
        const name = matchResult.node.id && matchResult.node.id.name;
        return new FunctionReflection(matchResult.scope, name, ReflectionKind.Module);
    }
};

// ----------------------------------- PARSER

class Parser {
    constructor({ file }) {
        this.file = file;
        this.oak = new FileReflection(file);
    }

    get visitor() {
        const oak = this.oak;
        const ctx = {};
        const variables = [];
        
        return {
            visitor: {
                Program(path) {
                    ctx.reflection = oak;

                    path.traverse({
                        FunctionDeclaration(path) {
                            variables.push({
                                name: path.node.id.name,
                                reflection: {}, // converter!!!!
                            })
                        }
                    })
                },
                VaribaleDeclaration(path) {
                    // GET VARIABLES
                },
                ExpressionStatement(path) {
                    

                    !!! matchers.AssignmentExpression
                    // CHANGE VARIABLE VALUE IF IT EXISTS


                    const matchResult = matchers.CjsExport(path);

                    if (!matchResult) return;
                    
                    matchResult.scope = ctx.reflection;

                    path.traverse({
                        FunctionExpression(path) {
                            ctx.reflection = converters[matchResult.node.type](matchResult);
                        }
                    })

                    ctx.reflection.setFlag(ReflectionFlag.Exported);
                    ctx.reflection.setFlag(ReflectionFlag.Default, matchResult.isDefault);

                    oak.children.push(ctx.reflection);

                    console.log('oak', oak.children);
                }
            }
        };
    }

    get tree() {
        return this.oak;
    }

    get resolve() {
        te
    }
}

module.exports = Parser;

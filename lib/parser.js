const compar = require('comment-parser');

const { ReflectionKind, ReflectionKindString } = require('./kind');

// let REFLECTION_ID = 0;

class Doc {
    constructor(comment) {
        const parsed = compar('/*' + comment + '*/')[0];
        const doubleNIndex = parsed.description.indexOf('\n\n');

        this.shortText = doubleNIndex !== -1 ? parsed.description.slice(0, doubleNIndex) : parsed.description;
        this.text = parsed.description;
        this.tags = parsed.tags;
    }
}

const { Reflection } = require('typedoc/dist/lib/models/reflections');

class FileReflection extends Reflection {
    constructor(file) {
        console.log(ReflectionKind.ExternalModule);
        super(null, file, ReflectionKind.ExternalModule);

        this.children = [];
        this.name = file.split('/').reverse()[0].split('.')[0];
    }
}

class ParameterReflection extends Reflection {
    constructor(param) {
        super(null, param.name, ReflectionKind.Parameter);

        // this.name = param.name;
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

        // const funcExp = path.node.expression.right;
        // const comment = path.node.leadingComments && path.node.leadingComments[0].value || '';

        // this.name = funcExp.id && funcExp.id.name;

        // this.signatures = [];
        // this.signatures.push(new SignatureReflection(funcExp, {
        //     flags: {
        //         isExported: true
        //     },
        //     comment
        // }));
    }
}

// ------------------------------------ MATCHERS

const isModuleExports = (node) => !node.computed &&
    node.object.name === 'module' && node.property.name === 'exports';

const isExportsField = (node) => !node.computed &&
    node.object.name === 'exports' && node.property.type === 'Identifier';

const isExportsVariable = (node) => node.computed &&
    node.object.name === 'exports' && node.property.type === 'Identifier';

const matchers = {
    CjsExport: (path) => {
        const expr = path.node.expression;
        if (!expr) return;

        if (!(path.parent.type === 'Program' &&
            expr.type === 'AssignmentExpression' &&
            expr.left.type === 'MemberExpression')) return;

        const res = {type: null, isDefault: false, leadingComments: path.node.leadingComments};
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
    },
    ExpressionType: (node) => {
        switch (node.type) {
            case 'FunctionExpression':
                return 'function';
                break;
        
            default: throw new Error('tobi snova pizdec')
        }
    }
};

/**
 * Check that we need to count this as exported shit
 */
// DefaultNodeExportFunction.match = (path) => {
//     const expr = path.node.expression;

//     return expr.type === 'AssignmentExpression' &&
//         expr.left.object && (
//             // module.exports = ...
//             isModuleExports(expr.left) ||
//             // module.exports.ololo = ...
//             expr.left.object.object && isModuleExports(expr.left.object) ||
//             // exports.ololo = ...
//             expr.left.object.name === 'exports'
//         );
// };

// ------------------------------------ CONVERTERS

const converters = {
    function: function(path)/*: SignatureReflection*/ {
        const parent = path.context.reflection;
        const name = path.node.id && path.node.id.name;
        return new FunctionReflection(parent, name, ReflectionKind.Module);
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

        return {
            visitor: {
                Program(path) {
                    path.context.reflection = this.oak;
                },
                ExpressionStatement(path) {
                    const expression = matchers.CjsExport(path);
                    if (!expression) return;

                    const type = matchers.ExpressionType(expression.node);

                    path.context.reflection = converters[type](expression);

                    oak.children.push(subtree);
                }
            }
        };
    }

    get tree() {
        return this.oak;
    }
}

module.exports = Parser;

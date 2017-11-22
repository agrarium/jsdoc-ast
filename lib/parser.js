const compar = require('comment-parser');

const { ReflectionKind, ReflectionKindString } = require('./kind');

let REFLECTION_ID = 0;

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

class DefaultNodeExportFunction extends Reflection {
    constructor(path) {
        super(null, funcExp.id && funcExp.id.name, ReflectionKind.Module);

        const funcExp = path.node.expression.right;
        const comment = path.node.leadingComments && path.node.leadingComments[0].value || '';

        this.name = funcExp.id && funcExp.id.name;

        this.signatures = [];
        this.signatures.push(new SignatureReflection(funcExp, {
            flags: {
                isExported: true
            },
            comment
        }));
    }
}

class Parser {
    constructor({ file }) {
        this.file = file;
        this.oak = new FileReflection(file);
        console.log(this.oak);
    }

    get visitor() {
        const oak = this.oak;

        return {
            visitor: {
                ExpressionStatement(path) {
                    // FOREACH REFLS
                    if (!DefaultNodeExportFunction.match(path)) return;
// console.log({ path.node });
                    // Need to call converter

                    oak.children.push(new DefaultNodeExportFunction(oak, path, ololo));
                }
            }
        };
    }

    get tree() {
        return this.oak;
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
    ExportedFunction: (path) => {
        const expr = path.node.expression;
        if (!expr) return;

        if (expr.parent.type === 'Program' &&
            expr.type === 'AssignmentExpression' &&
            expr.left.type === 'MemberExpression') return;

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

        res.matched = path.node.expression.right;

        return res;
    }
};

/**
 * Check that we need to count this as exported shit
 */
DefaultNodeExportFunction.match = (path) => {
    const expr = path.node.expression;

    return expr.type === 'AssignmentExpression' &&
        expr.left.object && (
            // module.exports = ...
            isModuleExports(expr.left) ||
            // module.exports.ololo = ...
            expr.left.object.object && isModuleExports(expr.left.object) ||
            // exports.ololo = ...
            expr.left.object.name === 'exports'
        );
};

// ------------------------------------ CONVERTERS

const converters = {
    exportedFunction: function(path)/*: SignatureReflection*/ {

    }
};
class Converter {

}

class TypicalCJSFunctionConverter extends Converter {
    constructor() {
        return ;
    }
}

module.exports = Parser;

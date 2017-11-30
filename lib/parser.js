const compar = require('comment-parser');
const { Reflection, ReflectionFlag } = require('typedoc/dist/lib/models/reflections');

ReflectionFlag[ReflectionFlag.Default = 0x4000] = 'Default';
const oldSetFlag = Reflection.prototype.setFlag;
Reflection.prototype.setFlag = function(flag, value = true) {
    oldSetFlag.apply(this, arguments);

    switch (flag) {
        case ReflectionFlag.Default:
            this.flags.isDefault = value;
            break;
    }
};

const { ReflectionKind, ReflectionKindString } = require('./kind');

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
    FunctionExpression(matchResult)/*: SignatureReflection*/ {
        const name = matchResult.node.id && matchResult.node.id.name;
        return new FunctionReflection(matchResult.scope, name, ReflectionKind.Module);
    },

    StringLiteral() {
        return new LiteralReflection();
    },

    NumericLiteral() {

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

        function resolveValue(node) {
            let value;
            if (node.type === 'Identifier') {
                let q = node;
                let res;
                console.log({ q });
                while (q.name) {
                    debugger;
                    res = variables.find(obj => obj.name === q.name);
                    // console.log({ q, res });
                    q = res.node;
                }
                value = res;

            } else if (node.type === 'StringLiteral' || node.type === 'NumericLiteral') {
                value = { name: null, node, leadingComment: node.leadingComment, init: node.value }; // ?
            }
debugger;
            console.log(value);

            return value;

            // return convertValue(value);
        }

        return {
            visitor: {
                Program(path) {
                    ctx.reflection = oak;

                    path.traverse({
                        FunctionDeclaration(path) {
                            if (path.parent.type !== 'Program') return;
                            console.log(path.parentNode);
                            variables.push({
                                name: path.node.id.name,
                                node: path.node,
                                leadingComment: path.node.leadingComment,
                                init: path.node.body
                            });
                        }
                    })
                },
                VariableDeclaration(path) {
                    // var asd = 123
                        // {
                        //   let asd = 456
                        //   exports.res1 = asd; // 456
                        //   exports.res2 = qwe;
                        //   function qwe() { return 123; }
                        // }
                    // exports.res1 = asd; // 123
                    // exports.res2 = qwe;
                    // function qwe() { return 456; }
                    if (path.parent.type !== 'Program') return;

                    for (let decl of path.node.declarations) {
                        // path.node.kind: var, let or const
                        // decl.init
                        variables.push({
                            name: decl.id.name,
                            node: decl,
                            leadingComment: decl.leadingComment,
                            init: decl.init
                        });
                    }
                    // console.log(path.node);
                },
                ExpressionStatement(path) {
                    // !!! matchers.AssignmentExpression
                    // CHANGE VARIABLE VALUE IF IT EXISTS

                    const matchResult = matchers.CjsExport(path);

                    if (!matchResult) return;

                    matchResult.scope = ctx.reflection;

                    // path.traverse({
                    //     FunctionExpression(path) {
                    //         ctx.reflection = converters[matchResult.node.type](matchResult);
                    //     }
                    // })

                    matchResult.value = resolveValue(matchResult.node);

                    const ref = converters[matchResult.node.type](matchResult);
                    ref.setFlag(ReflectionFlag.Exported);
                    ref.setFlag(ReflectionFlag.Default, matchResult.isDefault); // hasExportsAssignment?

                    oak.children.push(ref);

                    console.log('oak', oak.children);

console.log({ variables });
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

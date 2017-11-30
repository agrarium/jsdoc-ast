const { Reflection, ReflectionFlag, ContainerReflection, DeclarationReflection, SignatureReflection } = require('typedoc/dist/lib/models/reflections');
const { ReflectionKind } = require('../kind');

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

// const { Context } = require('../context');
// const { Converter } = require('../converter');
// const { createReferenceType } = require('./reference');

/**
 * List of reflection kinds that never should be static.
 */
const nonStaticKinds = [
    ReflectionKind.Class,
    ReflectionKind.Interface,
    ReflectionKind.Module
];

/**
 * Create a declaration reflection from the given TypeScript node.
 *
 * @param context  The context object describing the current state the converter is in. The
 *   scope of the context will be the parent of the generated reflection.
 * @param node  The TypeScript node that should be converted to a reflection.
 * @param kind  The desired kind of the reflection.
 * @param name  The desired name of the reflection.
 * @returns The resulting reflection.
 */
exports.createDeclaration = function createDeclaration(context/*: Context*/, node/*: ts.Node*/, kind/*: ReflectionKind*/, name/*?: string*/)/*: DeclarationReflection*/ {
    const container = /*<ContainerReflection> */context.scope; // ???
    if (!(container instanceof ContainerReflection)) {
        console.log('!!!', container);
        throw new Error(`Avada kedavra! Reflection gde? U tebe to chto vishe`);
    }

    // Ensure we have a name for the reflection
    if (!name) {
        if(node.id && node.id.name) {
            name = node.id.name;
        } else {
            name = null;
        }
    }

    const modifiers = 0; // GET IT FROM JSDOC @private @static @huyatic

    // Test whether the node is exported
    let isExported/*: boolean*/;
    if (container.kindOf([ReflectionKind.Module, ReflectionKind.ExternalModule])) {
        isExported = false; // Don't inherit exported state in modules and namespaces
    } else {
        isExported = container.flags.isExported;
    }

    if (kind === ReflectionKind.ExternalModule) {
        isExported = true; // Always mark external modules as exported
    } 
    // else if (node.parent && node.parent.type === 'VariableDeclaration') {
    //     const parentModifiers = 0;
    //     isExported = isExported || !!(parentModifiers & ts.ModifierFlags.Export);
    // } else {
    //     isExported = isExported || !!(modifiers & ts.ModifierFlags.Export);
    // }

    // if (!isExported && context.converter.excludeNotExported) {
    //     return null;
    // }

    // Test whether the node is private, when inheriting ignore private members
    // const isPrivate = !!(modifiers & ts.ModifierFlags.Private);
    // if (context.isInherit && isPrivate) {
    //     return null;
    // }

    // Test whether the node is static, when merging a module to a class make the node static
    // let isConstructorProperty = false;
    let isStatic = false;
    // if (nonStaticKinds.indexOf(kind) === -1) {
    //     isStatic = !!(modifiers & ts.ModifierFlags.Static);
    //     if (container.kind === ReflectionKind.Class) {
    //         if (node.parent && node.parent.kind === ts.SyntaxKind.Constructor) {
    //             isConstructorProperty = true;
    //         } else if (!node.parent || node.parent.kind !== ts.SyntaxKind.ClassDeclaration) {
    //             isStatic = true;
    //         }
    //     }
    // }

    // Check if we already have a child with the same name and static flag
    let child/*: DeclarationReflection*/;
    const children = container.children = container.children || [];
    children.forEach((n/*: DeclarationReflection*/) => {
        if (n.name === name && n.flags.isStatic === isStatic) {
            child = n;
        }
    });

    if (!child) {
        // Child does not exist, create a new reflection
        child = new DeclarationReflection(container, name, kind);
        child.setFlag(ReflectionFlag.Static, isStatic);
        // child.setFlag(ReflectionFlag.Private, isPrivate);
        // child.setFlag(ReflectionFlag.ConstructorProperty, isConstructorProperty);
        child.setFlag(ReflectionFlag.Exported,  isExported);
        child = setupDeclaration(context, child, node);

        if (child) {
            children.push(child);
            // context.registerReflection(child, node);
        }
    } else {
        // Merge the existent reflection with the given node
        child = mergeDeclarations(context, child, node, kind);
    }

    // If we have a reflection, trigger the corresponding event
    // if (child) {
    //     context.trigger(Converter.EVENT_CREATE_DECLARATION, child, node);
    // }

    return child;
}

/**
 * Setup a newly created declaration reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param reflection  The newly created blank reflection.
 * @param node  The TypeScript node whose properties should be applies to the given reflection.
 * @returns The reflection populated with the values of the given node.
 */
function setupDeclaration(context/*: Context*/, reflection/*: DeclarationReflection*/, node/*: ts.Node*/) {
    const modifiers = 0;

    reflection.setFlag(ReflectionFlag.External,  context.isExternal);
    // reflection.setFlag(ReflectionFlag.Protected, !!(modifiers & ts.ModifierFlags.Protected));
    reflection.setFlag(ReflectionFlag.Public, /*   !!(modifiers & ts.ModifierFlags.Public)*/ true);
    reflection.setFlag(ReflectionFlag.Optional,  /*!!(node['questionToken'])*/ false);

    // if (
    //     context.isInherit &&
    //     (node.parent === context.inheritParent || reflection.flags.isConstructorProperty)
    // ) {
    //     if (!reflection.inheritedFrom) {
    //         reflection.inheritedFrom = createReferenceType(context, node.symbol, true);
    //         reflection.getAllSignatures().forEach((signature) => {
    //             signature.inheritedFrom = createReferenceType(context, node.symbol, true);
    //         });
    //     }
    // }

    return reflection;
}

/**
 * Merge the properties of the given TypeScript node with the pre existent reflection.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param reflection  The pre existent reflection.
 * @param node  The TypeScript node whose properties should be merged with the given reflection.
 * @param kind  The desired kind of the reflection.
 * @returns The reflection merged with the values of the given node or NULL if the merge is invalid.
 */
function mergeDeclarations(context/*: Context*/, reflection/*: DeclarationReflection*/, node/*: ts.Node*/, kind/*: ReflectionKind*/) {
    if (reflection.kind !== kind) {
        const weights = [ReflectionKind.Module, ReflectionKind.Enum, ReflectionKind.Class];
        const kindWeight = weights.indexOf(kind);
        const childKindWeight = weights.indexOf(reflection.kind);
        if (kindWeight > childKindWeight) {
            reflection.kind = kind;
        }
    }

    if (
        context.isInherit &&
        context.inherited.indexOf(reflection.name) !== -1 &&
        (node.parent === context.inheritParent || reflection.flags.isConstructorProperty)
    ) {
        if (!reflection.overwrites) {
            reflection.overwrites = createReferenceType(context, node.symbol, true);
            reflection.getAllSignatures().forEach((signature) => {
                signature.overwrites = createReferenceType(context, node.symbol, true);
            });
        }
        return null;
    }

    return reflection;
}


/**
 * Create a new signature reflection from the given node.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The TypeScript node containing the signature declaration that should be reflected.
 * @param name  The name of the function or method this signature belongs to.
 * @param kind  The desired kind of the reflection.
 * @returns The newly created signature reflection describing the given node.
 */
export function createSignature(context/*: Context*/, node/*: ts.SignatureDeclaration*/, name/*: string*/, kind/*: ReflectionKind*/)/*: SignatureReflection*/ {
    const container = /*<DeclarationReflection>*/ context.scope;
    if (!(container instanceof ContainerReflection)) {
        throw new Error('Expected container reflection.');
    }

    const signature = new SignatureReflection(container, name, kind);
    // context.registerReflection(signature, node);
    context.withScope(signature, node.typeParameters, true, () => {
        node.parameters.forEach((parameter/*: ts.ParameterDeclaration*/) => {
            createParameter(context, parameter);
        });

        signature.type = extractSignatureType(context, node);

        if (container.inheritedFrom) {
            signature.inheritedFrom = createReferenceType(context, node.symbol, true);
        }
    });

    context.trigger(Converter.EVENT_CREATE_SIGNATURE, signature, node);
    return signature;
}

/**
 * Extract the return type of the given signature declaration.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The signature declaration whose return type should be determined.
 * @returns The return type reflection of the given signature.
 */
function extractSignatureType(context: Context, node: ts.SignatureDeclaration): Type {
    const checker = context.checker;
    if (node.kind & ts.SyntaxKind.CallSignature || node.kind & ts.SyntaxKind.CallExpression) {
        try {
            const signature = checker.getSignatureFromDeclaration(node);
            return context.converter.convertType(context, node.type, checker.getReturnTypeOfSignature(signature));
        } catch (error) {}
    }

    if (node.type) {
        return context.converter.convertType(context, node.type);
    } else {
        return context.converter.convertType(context, node);
    }
}

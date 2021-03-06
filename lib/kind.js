const ReflectionFlag = {
    Private:             1,
    Protected:           2,
    Public:              4,
    Static:              8,
    Exported:            16,
    ExportAssignment:    32,
    External:            64,
    Optional:            128,
    DefaultValue:        256,
    Rest:                512,
    ConstructorProperty: 1024,
    Abstract:            2048,
    Const:               4096,
    Let:                 8192
};

const ReflectionKind = {
    Global:               0,
    ExternalModule:       1,
    Module:               2,
    Enum:                 4,

    EnumMember:           16,
    Variable:             32,
    Function:             64,
    Class:                128,
    Interface:            256,
    Constructor:          512,
    Property:             1024,
    Method:               2048,
    CallSignature:        4096,
    IndexSignature:       8192,
    ConstructorSignature: 16384,
    Parameter:            32768,
    TypeLiteral:          65536,
    TypeParameter:        131072,
    Accessor:             262144,
    GetSignature:         524288,
    SetSignature:         1048576,
    ObjectLiteral:        2097152,
    TypeAlias:            4194304,
    Event:                8388608,
};

const ReflectionKindString = Object.keys(ReflectionKind).reduce((map, kindString) => {
    map[ReflectionKind[kindString]] = kindString;
    return map;
}, {});

module.exports = { ReflectionKind, ReflectionFlag, ReflectionKindString };

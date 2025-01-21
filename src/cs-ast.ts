import type { 
    MetadataPropertyType, MetadataType, MetadataTypes, MetadataTypesConfig, 
    MetadataAttribute, MetadataTypeName, MetadataOperationType,
} from "./types"
import { ParsedAnnotation, ParsedClass, ParsedEnum, ParseResult } from "./ts-parser.js"
import { getGroupName, lastLeftPart, leftPart, plural, rightPart, splitCase, toPascalCase } from "./utils.js"
import { getIcon } from "./icons.js"

const sys = (name:string, genericArgs?:string[]) => ({ name, namespace: "System", genericArgs })
const sysObj = sys("object")
const sysDictObj = { name:"Dictionary", genericArgs:["string","object"], namespace:"System.Collections.Generic" }

export class CSharpAst {
    typeMap: {[js:string]:MetadataTypeName} = {
        "number":sys("int"),
        "string":sys("string"),
        "boolean":sys("bool"),
        "Date":sys("DateTime"),
        "object":sysDictObj,
        "symbol":sys("string"),
        "null":sys("string"),
        "undefined":sys("string"),
        "bigint":sys("long"),
        "any":sysObj,
        "ArrayBuffer":sys("byte[]"),
        "SharedArrayBuffer":sys("byte[]"),
        "Int8Array":sys("sbyte[]"),
        "UInt8Array":sys("byte[]"),
        "Uint8ClampedArray":sys("byte[]"),
        "Int16Array":sys("short[]"),
        "UInt16Array":sys("ushort[]"),
        "Int32Array":sys("int[]"),
        "UInt32Array":sys("uint[]"),
        "Float16Array":sys("float[]"),
        "Float32Array":sys("float[]"),
        "Float64Array":sys("double[]"),
        "BigInt64Array":sys("long[]"),
        "BigUInt64Array":sys("long[]"),
        "Array": { name:"List", genericArgs:[], namespace:"System.Collections.Generic" },
        "Map": { name:"Dictionary", genericArgs:[], namespace:"System.Collections.Generic" },
        "WeakMap": { name:"Dictionary", genericArgs:[], namespace:"System.Collections.Generic" },
        "Set": { name:"HashSet", genericArgs:[], namespace:"System.Collections.Generic" },
        "WeakSet": { name:"HashSet", genericArgs:[], namespace:"System.Collections.Generic" },
    }
    decimalTypeProps = [
        "price","cost","amount","total","salary","balance","rate","discount","tax","fee"
    ]
    valueTypes = [
        "int","long","short","ulong","ushort","sbyte","uint","char","byte","float","double","decimal","bool",
        "Int16","Int32","Int64","UInt16","UInt32","UInt64","SByte","Byte","Single","Double","Decimal","Boolean",
        "DateTime","DateTimeOffset","TimeSpan","DateOnly","TimeOnly","Guid",
    ]
    integerTypes = [
        "int","long","short","ulong","ushort","sbyte","uint",
        "Int16","Int32","Int64","UInt16","UInt32","UInt64"
    ]
    commonValueTypes = [
        "int","Int32","long","Int64","string",
    ]
    requestAttrs = [
        'api',
        'apiResponse',
        'validateRequest',
        'validateIsAuthenticated',
        'validateIsAdmin',
        'validateAuthSecret',
        'validateHasRole',
        'validateHasRoles',
        'validateHasPermission',
        'validateHasPermissions',
        'validateHasClaim',
        'validateHasScope',
        'validateApiKey',
    
        'queryDb',
        'queryData',
        'autoFilter',
        'autoPopulate',
    
        'route',
        'field',
        'tag',
        'notes',
        'description',

        'meta',
        'dataContract',
    ].map(x => x.toLowerCase())
    modelAttrs = [
        'schema',
        'compositeKey',
        'preCreateTable',
        'preDropTable',
        'postCreateTable',
        'postDropTable',
    
        'namedConnection',
        'alias',
        'icon',

        'meta',
        'dataContract',

        'notes',
        'description',
    ].map(x => x.toLowerCase())
    requestPropAttrs = [
        'validate',
        'validateNull',
        'validateEmpty',
        'validateEmail',
        'validateNotNull',
        'validateNotEmpty',
        'validateCreditCard',
        'validateLength',
        'validateExactLength',
        'validateMinimumLength',
        'validateMaximumLength',
        'validateLessThan',
        'validateLessThanOrEqual',
        'validateGreaterThan',
        'validateGreaterThanOrEqual',
        'validateScalePrecision',
        'validateRegularExpression',
        'validateEqualExpression',
        'validateNotEqualExpression',
        'validateInclusiveBetween',
        'validateExclusiveBetween',
        'allowReset',
        'denyReset',
    
        'queryDbField',
        'queryDataField',
        'autoUpdate',
        'autoDefault',
        'autoMap',
        'autoIgnore',
        'autoApply',

        'apiMember',
        'apiAllowableValues',
        'dataMember',
        'input',
        'fieldCss',
        'uploadTo',
    ].map(x => x.toLowerCase())

    get requestPropAttrsWithoutValidators() {
        return this.requestPropAttrs.filter(x => !x.startsWith('validate'))
    }

    modelPropAttrs = [
        'alias',
        'meta',
        'priority',
    
        'primaryKey',
        'autoId',
        'autoIncrement',
        'index',
        'compute',
        'computed',
        'persisted',
        'uniqueConstraint',
        'addColumn',
        'removeColumn',
        'belongTo',
        'checkConstraint',
        'customField',
        'customSelect',
        'customInsert',
        'customUpdate',
        'decimalLength',
        'Default',
        'description',
        'enumAsInt',
        'excludeMetadata',
        'excludeFromDescription',
        'explicitAutoQuery',
        'foreignKey',
        'ignore',
        'ignoreOnUpdate',
        'ignoreOnInsert',
        'ignoreDataMember',
        'reference',
        'referenceField',
        'references',
        'required',
        'returnOnInsert',
        'rowVersion',
        'unique',
    
        'dataMember',
        'ref',
        'format',
        'intl',
        'intlNumber',
        'intlDateTime',
        'intlRelativeTime',
    ].map(x => x.toLowerCase())

    // Only generate these attributes when it's API specific, e.g. Read.notes("...")
    targetOnlyAttrs = [
        'notes',
        'description',
    ].map(x => x.toLowerCase())

    // Ignore properties with these attributes on APIs
    ignoreCreateProps = [
        'autoIncrement',
        'reference',
        'compute',
        'computed',
    ].map(x => x.toLowerCase())
    
    ignoreUpdateProps = [
        'reference',
        'compute',
        'computed',
    ].map(x => x.toLowerCase())
    
    // Validators that should be on Create but not optional Update APIs
    ignoreUpdateValidators = [
        'validateNull',
        'validateNotNull',
        'validateEmpty',
        'validateNotEmpty',
    ].map(x => x.toLowerCase())

    ignoreReadValidators = this.requestPropAttrs.filter(x => x.startsWith('validate')).map(x => x.toLowerCase())
    ignoreDeleteValidators = this.requestPropAttrs.filter(x => x.startsWith('validate')).map(x => x.toLowerCase())

    isEnum(type:string) {
        type = unwrap(type)
        return this.ast.enums.some(x => x.name === type) || this.result.types.find(x => x.name === type && x.isEnum)
    }

    isValueType(type:string) {
        type = unwrap(type)
        return this.valueTypes.includes(type) || this.isEnum(type)
    }

    ast:ParseResult = { references:[], classes:[], interfaces:[], enums:[] }
    result:MetadataTypes = {
        config: {} as MetadataTypesConfig,
        namespaces: [],
        operations:[],
        types:[]
    }

    toCsName(tsName:string) {
        return toPascalCase(tsName)
    }

    csharpType(type:string, propName?:string):MetadataTypeName {
        if (type.endsWith('[]')) {
            const elType = this.csharpType(type.substring(0, type.length-2), propName)
            return Object.assign({}, elType, { name:elType.name + '[]' })
        }
        if (type.endsWith('>')) {
            const start = type.indexOf('<')
            const genericArgs = type.substring(start+1, type.length-1).split(',').map(x => this.csharpType(x.trim()).name)
            const baseType = this.csharpType(type.substring(0, start), propName)
            const ret = Object.assign({}, baseType, { genericArgs })
            return ret
        }
        if (propName) {
            if (type === "number") {
                if (this.decimalTypeProps.some(x => propName.toLowerCase().includes(x))) {
                    return sys("decimal")
                }
            }
        }
        return this.typeMap[type] ?? { name:type, namespace:"MyApp" }
    }

    csharpAttribute(attr:ParsedAnnotation):MetadataAttribute {

        const attrName = attr.name.includes('.') 
            ? rightPart(attr.name, '.')!
            : attr.name

        const to : MetadataAttribute = { name:toPascalCase(attrName) }
        const attrType = (value:any) => typeof value == 'string'
            ? ((value.startsWith('typeof(') || value.startsWith('nameof(')) && value.endsWith(')')
                ? "constant" : 
                value.match(/^[A-Z][A-Za-z0-9_]+\.[A-Z][A-Za-z0-9_]+$/) //Axx.Bxx
                    ? "constant"
                    : "string")
            : typeof value == "object"
                ? (value instanceof Date ? "string" : Array.isArray(value) ? "array" : "object")
                : typeof value

        if (attr.constructorArgs?.length) {
            to.constructorArgs = attr.constructorArgs.map(x => {
                const type = attrType(x)
                return { 
                    name:'String', 
                    type,
                    value:`${x}`
                }
            })
        }
        if (attr.args && Object.keys(attr.args).length) {
            to.args = Object.entries(attr.args).map(([name,value]) => {
                const type = attrType(value)
                return { 
                    name:toPascalCase(name), 
                    type, 
                    value:`${value}`
                }
            })
        }
        if (attr.name.includes('.')) {
            to.namespace = leftPart(attr.name, '.')!
        }
        return to
    }

    addMetadataType(cls:ParsedClass) {
        const type:MetadataType = {
            name:this.toCsName(cls.name),
            namespace:"MyApp",
            properties:cls.properties.map(p => {
                const type = this.csharpType(p.type, p.name)
                const prop:MetadataPropertyType = {
                    name:this.toCsName(p.name),
                    type: p.optional ? nullable(type.name) : type.name!,
                }
                if (type.namespace) {
                    prop.namespace = type.namespace
                }
                if (type.genericArgs) {
                    prop.genericArgs = type.genericArgs
                }
                if (p.comment) {
                    prop.description = p.comment
                }
                if (prop.name === 'Id') {
                    prop.isPrimaryKey = true
                    prop.isRequired = true
                }
                const valueType = this.isValueType(prop.type)
                if (valueType) {
                    prop.isValueType = true
                }
                const isEnum = this.isEnum(prop.type)
                if (isEnum) {
                    prop.isEnum = true
                }
                if (!prop.isValueType && !prop.type.endsWith('?')) {
                    prop.isRequired = true
                }
                if (p.annotations?.length) {
                    prop.attributes = p.annotations.map(x => this.csharpAttribute(x))
                }
                return prop
            }),
        }
        if (cls.comment) {
            type.description = cls.comment
        }
        if (cls.extends) {
            type.inherits = { name:this.toCsName(cls.extends) }
        }
        if (cls.implements?.length) {
            type.implements = cls.implements.filter(x => !x.startsWith("IReturn")).map(x => this.csharpType(x))
        }
        if (cls.annotations?.length) {
            type.attributes = cls.annotations.map(x => this.csharpAttribute(x))
        }

        // Add dependent types first
        type.properties!.filter(x => x.namespace === 'MyApp' 
            && x.name !== cls.name 
            && !this.result.types.some(t => t.name === x.name && t.namespace === 'MyApp')).forEach(x => {
            const refEnum = this.ast.enums.find(e => e.name === x.type)
            if (refEnum) {
                this.addMetadataEnum(refEnum)
            }
            const refType = this.ast.classes.find(c => c.name === x.type)
            if (refType) {
                this.addMetadataType(refType)
            }
        })

        if (isDataModel(type) || type.isEnum) {
            if (!this.result.types.find(x => x.name === cls.name && x.namespace === 'MyApp')) {
                this.result.types.push(type)
            }
        } else {
            if (!this.result.operations.find(x => x.request.name === cls.name)) {
                let method = "POST"
                if (cls.extends?.startsWith('Query')) {
                    method = "GET"
                }
                let impls = cls.implements
                if (impls?.length) {
                    if (impls.includes('ICreate')) {
                        method = "POST"
                    } else if (impls.includes('IUpdate')) {
                        method = "PUT"
                    } else if (impls.includes('IPatch')) {
                        method = "PATCH"
                    } else if (impls.includes('IDelete')) {
                        method = "DELETE"
                    }
                }
                const op:MetadataOperationType = {
                    request:type,
                    actions:["ANY"],
                    method,
                }
                const iReturn = impls?.find(x => x.startsWith('IReturn<'))
                if (iReturn) {
                    op.returnType = this.csharpType(lastLeftPart(rightPart(iReturn,'<'), '>'))
                }
                if (impls?.includes('IReturnVoid')) {
                    op.returnsVoid = true
                }
                this.result.operations.push(op)
            }
        }
        
        return type
    }

    addMetadataEnum(e:ParsedEnum) {
        if (this.result.types.find(x => x.name === e.name && x.isEnum)) return
        const type:MetadataType = {
            name:this.toCsName(e.name),
            namespace:"MyApp",
            description:e.comment,
            isEnum:true,
            isEnumInt:typeof e.members[0].value == 'number',
            enumNames:e.members.map(x => this.toCsName(x.name)),
        }
        if (type.isEnumInt) {
            type.enumValues = e.members.map(x => `${x.value}`)
        } else {
            type.enumMemberValues = e.members.map(x => `${x.value}`)
        }
        if (e.members.some(x => x.comment)) {
            type.enumDescriptions = e.members.map(x => x.comment)
        }
        this.result.types.push(type)
        return type
    }

    get classes() {
        return this.result.types.filter(x => !x.isEnum && x.properties)
    }

    // e.g. Table DataModels have Primary Keys
    get typesWithPrimaryKeys() {
        return this.result.types.filter(x => !x.isEnum && !x.isInterface && x.properties?.some(x => x.isPrimaryKey))
    }

    get typesWithReferences() {
        return this.result.types.filter(x => !x.isEnum && !x.isInterface && x.properties?.some(x => x.attributes?.some(x => x.name === 'Reference')))
    }
    
    onlyAttrs(attrs:MetadataAttribute[]|null|undefined, only:string[]) {
        if (!attrs) return
        return attrs.filter(x => only.includes(x.name.toLowerCase()))
    }

    attrsFor(dtoType:"Read"|"Create"|"Update"|"Delete"|"Model", attrType:"Type"|"Prop", attrs?:MetadataAttribute[]) {
        const requestAttrs = this.requestAttrs
        const requestPropAttrs = this.requestPropAttrs
        const modelAttrs = this.modelAttrs
        const modelPropAttrs = this.modelPropAttrs

        const isRequest = ["Read","Create","Update","Delete"].includes(dtoType)
        const validAttrs = attrType === "Type" 
            ? isRequest
                ? requestAttrs
                : modelAttrs 
            : isRequest
                ? requestPropAttrs
                : modelPropAttrs
        const ignoreValidators = attrType === "Prop"
            ? dtoType === "Update"
                ? this.ignoreUpdateValidators 
                : dtoType === "Read" 
                    ? this.ignoreReadValidators 
                        : dtoType === "Delete" 
                            ? this.ignoreDeleteValidators
                            : []
            : []
        const targetOnlyAttrs = this.targetOnlyAttrs

        function shouldInclude(attr:MetadataAttribute, dtoType:"Read"|"Create"|"Update"|"Delete"|"Model") {
            if (!validAttrs.includes(attr.name.toLowerCase())) return false
            const ns = attr.namespace
            if (ns) {
                if (ns == "All") return true
                if (ns == "Read") return dtoType == "Read"
                if (ns == "Create") return dtoType == "Create"
                if (ns == "Update") return dtoType == "Update"
                if (ns == "Delete") return dtoType == "Delete"
                if (ns == "Write") return ["Create","Update","Delete"].includes(dtoType)
                return false
            } else {
                const nameLower = attr.name.toLowerCase()
                if (isRequest) {
                    if (attrType === "Type") {
                        if (targetOnlyAttrs.includes(nameLower)) {
                            return false
                        }
                        return requestAttrs.includes(nameLower)
                    } else if (attrType === "Prop") {
                        if (ignoreValidators.length && ignoreValidators.includes(nameLower)) 
                            return false
                        return requestPropAttrs.includes(nameLower)
                    }
                } else {
                    if (attrType === "Type") {
                        return modelAttrs.includes(nameLower)
                    } else if (attrType === "Prop") {
                        return modelPropAttrs.includes(nameLower)
                    }
                }
            }
            return true
        }

        const to:MetadataAttribute[] = []
        for (const attr of attrs || []) {
            if (shouldInclude(attr, dtoType)) {
                to.push(attr)
            }
        }
        return to
    }

    createAutoCrudApis() {
        const groupName = getGroupName(this.result)
        const friendlyGroupName = splitCase(groupName)

        for (const type of this.classes) {
            if (!isDataModel(type)) continue
            const hasPk = type.properties?.some(x => x.isPrimaryKey)
            if (!hasPk) continue
            const pluralizedType = plural(type.name)
            const queryName = `Query${pluralizedType}`
            let queryApi = this.result.operations.find(x => x.request.name === queryName
                || (x.request.inherits?.name.startsWith('Query') && x.request.inherits?.genericArgs?.some(a => a === type.name))
            ) as MetadataOperationType
            const pk = type.properties?.find(x => x.isPrimaryKey)
            const dataModel = { name: type.name, namespace: type.name }
            const isAuditBase = type.inherits?.name === 'AuditBase'

            const existingTag = type.attributes?.find(x => x.name.toLowerCase() === 'tag')
            const tags = !existingTag ? [friendlyGroupName] : undefined
            const emptyTag = existingTag?.constructorArgs?.[0]?.value === ''
            if (emptyTag) {
                type.attributes = type.attributes!.filter(x => x !== existingTag)
            }

            const inputTagAttrs = [{
                name: "Input",
                args: [{ name:"Type", type:"string", value:"tag" }]
            },
            {
                name: "FieldCss",
                args: [{ name:"Field", type:"string", value:"col-span-12" }]
            }]

            const idsProp = pk 
                ? { 
                    name: `${pk.name}s`,
                    type: "List`1?",
                    namespace: "System.Collections.Generic",
                    genericArgs: [pk.type]
                  } as MetadataPropertyType
                : undefined

            if (!queryApi) {
                queryApi = {
                    method: "GET",
                    actions: ["ANY"],
                    routes: [],
                    request: {
                        name: queryName,
                        namespace: "MyApp",
                        inherits: {
                            name: "QueryDb`1",
                            namespace: "ServiceStack",
                            genericArgs: [type.name]
                        },
                        properties: pk 
                            ? [
                                Object.assign({}, pk, { 
                                    type: nullable(pk.type),
                                    attributes:this.attrsFor("Read", "Prop", pk.attributes),
                                }),
                                idsProp!
                            ]
                            : [],
                        attributes: this.attrsFor("Read", "Type", type.attributes),
                    },
                    returnType: {
                        name: "QueryResponse`1",
                        namespace: "ServiceStack",
                        genericArgs: [type.name]
                    },
                    dataModel,
                }
                if (isAuditBase) {
                    if (!queryApi.request.attributes?.find(x => x.name === 'AutoApply')) {
                        // [AutoApply(Behavior.AuditQuery)]
                        queryApi.request.attributes!.push({
                            name: "AutoApply",
                            constructorArgs: [{
                                name: "name",
                                type: "constant",
                                value: "Behavior.AuditQuery"
                            }]
                        })
                    }
                }
                this.result.operations.push(queryApi)
            }
            let createName = `Create${type.name}`
            let createApi = this.result.operations.find(x => x.request.name === createName
                || (x.request.implements?.some(i => i.name.startsWith("ICreate") && x.dataModel == dataModel))
            ) as MetadataOperationType
            if (!createApi) {
                createApi = {
                    method: "POST",
                    actions: ["ANY"],
                    request: {
                        name: createName,
                        namespace: "MyApp",
                        implements: [{
                            name: "ICreateDb`1",
                            namespace: "ServiceStack",
                            genericArgs: [type.name]
                        }],
                        properties: type.properties!
                            .filter(x => !x.attributes?.some(a => this.ignoreCreateProps.includes(a.name.toLowerCase()))).map(x => 
                            Object.assign({}, x, { 
                                type: x.isPrimaryKey 
                                    ? x.type 
                                    : `${x.type}`,
                                    attributes:this.attrsFor("Create", "Prop", x.attributes),
                                })
                        ),
                        attributes: this.attrsFor("Create", "Type", type.attributes),
                    },
                    returnType: {
                        name: "IdResponse",
                        namespace: "ServiceStack",
                    },
                    dataModel,
                }
                for (const prop of createApi.request.properties!) {
                    if (prop.isRequired) {
                        if (!prop.attributes) prop.attributes = []
                        var hasAnyValidateAttrs = prop.attributes.some(x => x.name.toLowerCase().startsWith('validate'))

                        if (prop.type === 'string') {   
                            if (!hasAnyValidateAttrs) {
                                prop.attributes.push({
                                    name: "ValidateNotEmpty",
                                })
                            }
                        } else if (this.integerTypes.includes(prop.type)) {
                            if (!hasAnyValidateAttrs) {
                                prop.attributes.push({
                                    name: "ValidateGreaterThan",
                                    constructorArgs:[{ name:"value", type:"int", value:"0" }]
                                })
                            }
                        } else if (prop.type === 'List`1' && this.commonValueTypes.includes(prop.genericArgs![0])) {
                            prop.attributes.push(...inputTagAttrs)
                        }
                        const emptyValidateAttr = prop.attributes.find(x => x.name.toLowerCase() === 'validate')
                        if (emptyValidateAttr && emptyValidateAttr.constructorArgs?.[0]?.value === '') {
                            prop.attributes = prop.attributes.filter(x => x !== emptyValidateAttr)
                        }
                    }
                }
                if (isAuditBase) {
                    createApi.requiresAuth = true
                    if (!createApi.request.attributes?.find(x => x.name === 'AutoApply')) {
                        // [AutoApply(Behavior.AuditCreate)]
                        createApi.request.attributes!.push({
                            name: "AutoApply",
                            constructorArgs: [{
                                name: "name",
                                type: "constant",
                                value: "Behavior.AuditCreate"
                            }]
                        })
                    }
                }
                this.result.operations.push(createApi)
            }
            let updateName = `Update${type.name}`
            let updateApi = this.result.operations.find(x => x.request.name === updateName
                || x.dataModel == dataModel && (
                    x.request.implements?.some(i => i.name.startsWith("IPatch")) ||
                    x.request.implements?.some(i => i.name.startsWith("IUpdate"))
                )
            ) as MetadataOperationType
            if (!updateApi) {
                updateApi = {
                    method: "PATCH",
                    actions: ["ANY"],
                    request: {
                        name: updateName,
                        namespace: "MyApp",
                        implements: [{
                            name: "IPatchDb`1",
                            namespace: "ServiceStack",
                            genericArgs: [type.name]
                        }],
                        properties: type.properties?.filter(x => !x.attributes?.some(x => this.ignoreUpdateProps.includes(x.name.toLowerCase()))).map(x => 
                            Object.assign({}, x, { 
                                type: x.isPrimaryKey 
                                    ? x.type 
                                    : `${nullable(x.type)}`,
                                    attributes:this.attrsFor("Update", "Prop", x.attributes),
                                })
                        ),
                        attributes: this.attrsFor("Update", "Type", type.attributes),
                    },
                    returnType: {
                        name: "IdResponse",
                        namespace: "ServiceStack",
                    },
                    dataModel,
                }
                for (const prop of updateApi.request.properties!) {
                    if (prop.isRequired) {
                        if (!prop.attributes) prop.attributes = []
                        if (prop.type === 'List`1' && this.commonValueTypes.includes(prop.genericArgs![0])) {
                            prop.attributes.push(...inputTagAttrs)
                        }
                    }
                }
                if (isAuditBase) {
                    updateApi.requiresAuth = true
                    if (!updateApi.request.attributes?.find(x => x.name === 'AutoApply')) {
                        // [AutoApply(Behavior.AuditModify)]
                        updateApi.request.attributes!.push({
                            name: "AutoApply",
                            constructorArgs: [{
                                name: "name",
                                type: "constant",
                                value: "Behavior.AuditModify"
                            }]
                        })
                    }
                }
                this.result.operations.push(updateApi)
            }
            let deleteName = `Delete${type.name}`
            let deleteApi = this.result.operations.find(x => x.request.name === deleteName
                || (x.request.implements?.some(i => i.name.startsWith("IDelete") && x.dataModel == dataModel))
            ) as MetadataOperationType
            if (!deleteApi) {
                deleteApi = {
                    method: "DELETE",
                    actions: ["ANY"],
                    request: {
                        name: deleteName,
                        namespace: "MyApp",
                        implements: [{
                            name: "IDeleteDb`1",
                            namespace: "ServiceStack",
                            genericArgs: [type.name]
                        }],
                        properties: pk 
                            ? [
                                Object.assign({}, pk, { 
                                    type: nullable(pk.type),
                                    attributes:this.attrsFor("Delete", "Prop", pk.attributes),
                                }),
                                idsProp!
                            ]
                            : [],
                        attributes: this.attrsFor("Delete", "Type", type.attributes),
                    },
                    returnsVoid: true,
                    dataModel,
                }
                if (isAuditBase) {
                    deleteApi.requiresAuth = true
                    if (!deleteApi.request.attributes?.find(x => x.name === 'AutoApply')) {
                        // [AutoApply(Behavior.AuditSoftDelete)]
                        deleteApi.request.attributes!.push({
                            name: "AutoApply",
                            constructorArgs: [{
                                name: "name",
                                type: "constant",
                                value: "Behavior.AuditSoftDelete"
                            }]
                        })
                    }
                }
                this.result.operations.push(deleteApi)
            }            
        }
        this.filterModelAttributes()
        return this.result
    }

    filterModelAttributes() {
        for (const type of this.classes) {
            if (!isDataModel(type)) continue
            if (type.attributes?.length) {
                type.attributes = this.attrsFor("Model", "Type", type.attributes)
            }
            type.properties?.forEach(p => {
                if (p.attributes?.length) {
                    p.attributes = this.attrsFor("Model", "Prop", p.attributes)
                }
            })
        }        
    }
    
    parseTypes() {
        this.ast.classes.forEach(c => {
            const name = toPascalCase(c.name)
            if (this.result.types.find(x => x.name === name && x.namespace === 'MyApp')) return
            this.addMetadataType(c)
        })
        this.ast.enums.forEach(e => {
            const name = toPascalCase(e.name)
            if (this.result.types.find(x => x.name === name && x.isEnum)) return
            this.addMetadataEnum(e)
        })
    }
    
    parse(ast:ParseResult) {
        
        const classes = ast.classes.concat(ast.interfaces)
        const enums = ast.enums
        this.ast = {
            references:[],
            classes:classes,
            interfaces:[],
            enums:enums ?? [],
        }
        this.result = {
            config: {} as MetadataTypesConfig,
            namespaces: [
                "System",
                "System.IO",
                "System.Collections",
                "System.Collections.Generic",
                "System.Runtime.Serialization",
                "ServiceStack",
                "ServiceStack.DataAnnotations",
            ],
            operations:[],
            types:[],
        }
        this.parseTypes()        
        return this.result
    }
}

export type Transform = (gen:CSharpAst) => void

export const Transforms = {
    Default: [
        convertReferenceTypes,
        convertArrayReferenceTypes,
        convertArraysToLists,
        addMissingReferencesToForeignKeyProps,
        addAutoIncrementAttrs,
        addIconsToKnownTypes,
        hideReferenceProperties,
    ],
}

export function toMetadataTypes(ast:ParseResult, transforms?:Transform[]) {
    const gen = new CSharpAst()
    gen.parse(ast)
    if (!transforms) transforms = Transforms.Default
    for (const transform of transforms) {
        transform(gen)
    }
    return gen.createAutoCrudApis()
}

export function unwrap(type:string) {
    if (type.endsWith("?")) {
        return type.substring(0, type.length-1)
    }
    return type
}
export function nullable(type:string) {
    return type.endsWith('?') ? type : `${type}?`
}

export function replaceReference(gen:CSharpAst, fromType:string, toType:string) {
    for (const type of gen.result.types) {
        if (type.name === fromType) {
            type.name = toType
        }
        if (type.properties) {
            for (const prop of type.properties!) {
                if (prop.type === fromType) {
                    prop.type = toType
                }
                if (prop.name === fromType) {
                    prop.name = toType
                }
                if (prop.name === `${fromType}Id`) {
                    prop.name = `${toType}Id`
                }
            }
        }
    }
}

export function replaceReferences(gen:CSharpAst, references:string[]) {
    // The most important types are the ones with the most references
    const refCount = (t:MetadataType) => t.properties?.filter(
        p => gen.result.types.find(x => x.name === p.type && p.namespace === 'MyApp')).length || 0
    const importantTypes = gen.result.types.sort((x,y) => refCount(y) - refCount(x))

    for (const type of gen.result.types) {
        if (references.includes(type.name)) {
            const importantType = importantTypes.find(x => x.properties?.some(p => p.type === type.name))
            if (importantType) {
                const newName = `${importantType.name}${type.name}`
                replaceReference(gen, type.name, newName)
            }
        }
    }
}

export function replaceIds(gen:CSharpAst) {
    for (const type of gen.classes) {
        const idProp = type.properties?.find(x => x.name === `${type.name}Id`)
        if (idProp) {
            type.properties?.forEach(x => delete x.isPrimaryKey)
            idProp.name = 'Id'
            idProp.isPrimaryKey = true
        }
        // If using a shortened id for the type e.g. (PerformanceReview, ReviewId)
        const firstProp = type.properties?.[0]
        if (firstProp?.name.endsWith('Id') && type.name.includes(firstProp.name.substring(0, firstProp.name.length-2))) {
            firstProp.name = 'Id'
            firstProp.isPrimaryKey = true
        }
    }
    // Replace all string Ids with int Ids
    const anyIntPks = gen.classes.some(x => x.properties?.some(p => p.isPrimaryKey && gen.integerTypes.includes(p.type)))
    if (!anyIntPks) {
        for (const type of gen.classes) {
            const idProp = type.properties?.find(x => x.isPrimaryKey)
            if (idProp) {
                idProp.type = 'int'
            }
        }
    }
}

export function convertReferenceTypes(gen:CSharpAst) {
    for (const type of gen.classes) {
        for (let i = 0; i < type.properties!.length; i++) {
            const p = type.properties![i]
            const refType = gen.result.types.find(x => x.name === p.type && x.namespace === 'MyApp' && !x.isEnum)
            if (refType) {
                const fkId = `${p.name}Id`
                let idProp = refType.properties?.find(x => x.name === 'Id')
                if (!idProp) {
                    idProp = { name:'Id', type:'int', isPrimaryKey:true, isRequired:true, isValueType:true, namespace:'System' }
                    refType.properties?.unshift(idProp)
                }
                // Only add if FK Id prop does not already exist
                if (!type.properties!.find(x => x.name === fkId)) {
                    const fkProp:MetadataPropertyType = {
                        name:fkId,
                        type:idProp.type,
                        namespace:idProp.namespace,
                        attributes:[{
                            name: "References",
                            constructorArgs: [{
                                name: "type",
                                type: "Type",
                                value: `typeof(${p.type})`
                            }],
                            args: []
                        }]
                    }
                    type.properties!.splice(i, 0, fkProp)
                }

                if (!p.attributes) p.attributes = []
                p.attributes.push({ name: "Reference" })

                i++ // Skip over added fk prop
            }
        }
    }
}

export function convertArrayReferenceTypes(gen:CSharpAst) {
    for (const type of gen.classes) {
        for (const prop of type.properties!) {
            if (prop.type.endsWith('[]')) {
                const elType = prop.type.substring(0, prop.type.length-2)
                const refType = gen.result.types.find(x => x.name === elType && x.namespace === 'MyApp' && !x.isEnum)
                if (refType && refType.properties?.find(x => x.name === 'Id' || x.isPrimaryKey)) {
                    prop.namespace = 'System.Collections.Generic'
                    prop.genericArgs = [elType]
                    prop.type = 'List`1'
                    if (!prop.attributes) prop.attributes = []
                    prop.attributes.push({ name: "Reference" })

                    let fkProp = refType.properties!.find(x => x.name === `${type.name}Id`)
                    if (!fkProp) {
                        fkProp = {
                            name: `${type.name}Id`,
                            type: 'int',
                            isValueType: true,
                            namespace: 'System',
                            attributes: [{
                                name: "References",
                                constructorArgs: [{
                                    name: "type",
                                    type: "Type",
                                    value: `typeof(${type.name})`
                                }]
                            }]
                        }

                        // Insert fk prop after last `*Id` prop
                        const lastIdPropIndex = refType.properties!.findLastIndex(x => x.name.endsWith('Id'))
                        if (lastIdPropIndex >= 0) {
                            refType.properties!.splice(lastIdPropIndex + 1, 0, fkProp)
                        } else {
                            refType.properties!.push(fkProp)
                        }
                    }
                }
            }
        }
    }
}

export function convertArraysToLists(gen:CSharpAst) {
    for (const type of gen.classes) {
        for (const prop of type.properties!) {
            const optional = prop.type.endsWith('?')
            let propType = unwrap(prop.type)
            if (propType.endsWith('[]')) {
                const elType = propType.substring(0, propType.length-2)
                prop.namespace = 'System.Collections.Generic'
                prop.genericArgs = [elType]
                prop.type = 'List`1' + (optional ? '?' : '')
            }
        }
    }
}

export function addMissingReferencesToForeignKeyProps(gen:CSharpAst) {
    for (const type of gen.typesWithPrimaryKeys) {
        for (const prop of type.properties!) {
            if (prop.name.endsWith('Id') && !prop.isPrimaryKey && !prop.attributes?.some(x => x.name.startsWith('Reference'))) {
                const refTypeName = prop.name.substring(0, prop.name.length-2)
                const refType = gen.result.types.find(x => x.name === refTypeName && x.namespace === 'MyApp' && !x.isEnum)
                if (refType) {
                    if (!prop.attributes) prop.attributes = []
                    prop.attributes.push({
                        name: "References",
                        constructorArgs: [{
                            name: "type",
                            type: "Type",
                            value: `typeof(${refTypeName})`
                        }]
                    })
                }
            }
        }
    }
}

export function addAutoIncrementAttrs(gen:CSharpAst) {
    for (const type of gen.classes) {
        for (const prop of type.properties!) {
            const hasPkAttr = prop.attributes?.some(x => ['primarykey','autoincrement','autoid'].includes(x.name.toLowerCase()))
            if (prop.isPrimaryKey && !hasPkAttr) {
                if (prop.type === 'int' || prop.type === 'long' || prop.type === 'Int32' || prop.type === 'Int64') {
                    if (!prop.attributes) prop.attributes = []
                    const attr:MetadataAttribute = { name: "AutoIncrement" }
                    prop.attributes.push(attr)
                }
            }
        }
    }
}

// Add Icon for BuiltIn UIs and AutoQueryGrid to known type names
export function addIconsToKnownTypes(gen:CSharpAst) {
    for (const type of gen.typesWithPrimaryKeys) {
        const icon = getIcon(type.name)
        if (icon) {
            if (!type.attributes) type.attributes = []
            const existingIcon = type.attributes.find(x => x.name === 'Icon')
            if (existingIcon) {
                // remove empty icon
                if (existingIcon.constructorArgs?.[0]?.value === '') {
                    type.attributes = type.attributes.filter(x => x !== existingIcon)
                }
                return
            }
            type.attributes.push({ 
                name: "Icon", 
                args: [{ name: "Svg", type: "string", value:icon }]
            })
        }
    }    
}

// Hide Reference Properties from AutoQueryGrid Grid View
export function hideReferenceProperties(gen:CSharpAst) {
    for (const type of gen.typesWithReferences) {
        for (const prop of type.properties!.filter(x => x.attributes?.some(x => x.name === 'Reference'))) {
            if (!prop.attributes) prop.attributes = []
            //[Format(FormatMethods.Hidden)]
            prop.attributes.push({ 
                name: "Format",
                constructorArgs: [{ name: "method", type: "constant", value: "FormatMethods.Hidden" }]
            })
        }
    }
}

// Replace User Tables and FKs with AuditBase tables and 
export function replaceUserReferencesWithAuditTables(gen:CSharpAst) {
    for (const type of gen.typesWithPrimaryKeys) {

        const removeProps:string[] = []
        for (const prop of type.properties!) {
            if (prop.name === 'UserId') {
                removeProps.push(prop.name)
            }
            if (prop.attributes?.some(a => 
                a.name === 'Reference' && a.constructorArgs?.some(x => x.value === 'typeof(User)'))) {
                removeProps.push(prop.name)
            }
            if (prop.type === 'User') {
                removeProps.push(prop.name)
            }
            if (prop.genericArgs && prop.genericArgs.includes('User')) {
                removeProps.push(prop.name)
            }
        }
        if (removeProps.length) {
            type.properties = type.properties!.filter(x => !removeProps.includes(x.name))
            type.inherits = { name: "AuditBase", namespace: "ServiceStack" }
        }
    }
    // Remove User Table
    gen.result.types = gen.result.types.filter(x => x.name !== 'User')
}

export function isDataModel(type:MetadataType) {
    const apiInterfacePrefixes = ['IReturn','IQuery','ICreate','IUpdate','IPatch','IDelete','IGet','IPost','IPut']
    return (!type.inherits || !type.inherits.name.startsWith("Query"))
        && (!type.implements || !type.implements.some(x => apiInterfacePrefixes.some(prefix => x.name.startsWith(prefix))))
}
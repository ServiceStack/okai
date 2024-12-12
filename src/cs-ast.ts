import type { 
    MetadataPropertyType, MetadataType, MetadataTypes, MetadataTypesConfig, 
    MetadataAttribute, MetadataTypeName, MetadataOperationType,
} from "./types"
import { ParsedAnnotation, ParsedClass, ParsedEnum, ParseResult } from "./ts-parser.js"
import { plural, toPascalCase } from "./utils.js"
import { Icons } from "./icons.js"

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
    }
    decimalTypeProps = [
        "price","cost","amount","total","salary","balance","rate","discount","tax","fee"
    ]
    currencyTypeProps = [
        "price","cost","total","salary","balance","tax","fee"
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

    unwrap(type:string) {
        if (type.endsWith("?")) {
            return type.substring(0, type.length-1)
        }
        return type
    }
    nullable(type:string) {
        return type.endsWith('?') ? type : `${type}?`
    }

    isEnum(type:string) {
        type = this.unwrap(type)
        return this.ast.enums.some(x => x.name === type) || this.result.types.find(x => x.name === type && x.isEnum)
    }

    isValueType(type:string) {
        type = this.unwrap(type)
        return this.valueTypes.includes(type) || this.isEnum(type)
    }

    ast:ParseResult = { classes:[], interfaces:[], enums:[] }
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
        const to : MetadataAttribute = { name:toPascalCase(attr.name) }
        const attrType = (value:any) => typeof value == 'string'
            ? (`${value}`.startsWith('typeof') ? "Type" : "string")
            : typeof value == "object"
                ? (value instanceof Date ? "string" : Array.isArray(value) ? "array" : "object")
                : typeof value

        if (attr.constructorArgs?.length) {
            to.constructorArgs = attr.constructorArgs.map(x => {
                const type = attrType(x.value)
                return { 
                    name:'String', 
                    type, 
                    value: `${x.value}`
                }
            })
        }
        if (attr.args && Object.keys(attr.args).length) {
            to.args = Object.entries(attr.args).map(([name,value]) => {
                const type = attrType(value)
                return { 
                    name:toPascalCase(name), 
                    type, 
                    value: `${value}`
                }
            })
        }
        return to
    }

    addMetadataType(cls:ParsedClass) {
        const type:MetadataType = {
            name:this.toCsName(cls.name),
            namespace:"MyApp",
            description:cls.comment,
            properties:cls.properties.map(p => {
                const type = this.csharpType(p.type, p.name)
                const prop:MetadataPropertyType = {
                    name:this.toCsName(p.name),
                    type: p.optional ? this.nullable(type.name) : type.name!,
                    namespace:type.namespace,
                    description:p.comment,
                }
                if (prop.name === 'Id') {
                    prop.isPrimaryKey = true
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
                if (this.currencyTypeProps.some(x => prop.name.toLowerCase().includes(x))) {
                    if (!prop.attributes) prop.attributes = []
                    prop.attributes.push({ 
                        name: "IntlNumber",
                        args: [{ name: "Currency", type: "constant", value: "NumberCurrency.USD" }]
                    })
                }
                if (p.annotations?.length) {
                    prop.attributes = p.annotations.map(x => this.csharpAttribute(x))
                }
                return prop
            }),
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

        if (!this.result.types.find(x => x.name === cls.name && x.namespace === 'MyApp')) {
            this.result.types.push(type)
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

    replaceReferences(references:string[]) {
        // The most important types are the ones with the most references
        const refCount = (t:MetadataType) => t.properties?.filter(
            p => this.result.types.find(x => x.name === p.type && p.namespace === 'MyApp')).length || 0
        const importantTypes = this.result.types.sort((x,y) => refCount(y) - refCount(x))

        for (const type of this.result.types) {
            if (references.includes(type.name)) {
                const importantType = importantTypes.find(x => x.properties?.some(p => p.type === type.name))
                if (importantType) {
                    const newName = `${importantType.name}${type.name}`
                    this.replaceReference(type.name, newName)
                }
            }
        }
    }

    replaceReference(fromType:string, toType:string) {
        for (const type of this.result.types) {
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

    replaceIds() {
        for (const type of this.classes) {
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
        const anyIntPks = this.classes.some(x => x.properties?.some(p => p.isPrimaryKey && this.integerTypes.includes(p.type)))
        if (!anyIntPks) {
            for (const type of this.classes) {
                const idProp = type.properties?.find(x => x.isPrimaryKey)
                if (idProp) {
                    idProp.type = 'int'
                }
            }
        }
    }

    convertReferenceTypes() {
        for (const type of this.classes) {
            for (let i = 0; i < type.properties!.length; i++) {
                const p = type.properties![i]
                const refType = this.result.types.find(x => x.name === p.type && x.namespace === 'MyApp' && !x.isEnum)
                if (refType) {
                    const fkId = `${p.name}Id`
                    let idProp = refType.properties?.find(x => x.name === 'Id')
                    if (!idProp) {
                        idProp = { name:'Id', type:'int', isPrimaryKey:true, isValueType:true, namespace:'System' }
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

    convertArrayReferenceTypes() {
        for (const type of this.classes) {
            for (const prop of type.properties!) {
                if (prop.type.endsWith('[]')) {
                    const elType = prop.type.substring(0, prop.type.length-2)
                    const refType = this.result.types.find(x => x.name === elType && x.namespace === 'MyApp' && !x.isEnum)
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

    convertArraysToLists() {
        for (const type of this.classes) {
            for (const prop of type.properties!) {
                const optional = prop.type.endsWith('?')
                let propType = this.unwrap(prop.type)
                if (propType.endsWith('[]')) {
                    const elType = propType.substring(0, propType.length-2)
                    prop.namespace = 'System.Collections.Generic'
                    prop.genericArgs = [elType]
                    prop.type = 'List`1' + (optional ? '?' : '')
                }
            }
        }
    }

    addMissingReferencesToForeignKeyProps() {
        for (const type of this.typesWithPrimaryKeys) {
            for (const prop of type.properties!) {
                if (prop.name.endsWith('Id') && !prop.isPrimaryKey && !prop.attributes?.some(x => x.name.startsWith('Reference'))) {
                    const refTypeName = prop.name.substring(0, prop.name.length-2)
                    const refType = this.result.types.find(x => x.name === refTypeName && x.namespace === 'MyApp' && !x.isEnum)
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

    addAutoIncrementAttrs() {
        for (const type of this.classes) {
            for (const prop of type.properties!) {
                if (prop.isPrimaryKey) {
                    if (prop.type === 'int' || prop.type === 'long' || prop.type === 'Int32' || prop.type === 'Int64') {
                        if (!prop.attributes) prop.attributes = []
                        const attr:MetadataAttribute = { name: "AutoIncrement" }
                        prop.attributes.push(attr)
                    }
                }
            }
        }
    }

    createAutoCrudApis() {
        for (const type of this.classes) {
            const hasPk = type.properties?.some(x => x.isPrimaryKey)
            if (!hasPk) continue
            const pluralizedType = plural(type.name)
            const queryName = `Query${pluralizedType}`
            let queryApi = this.result.operations.find(x => x.request.name === queryName) as MetadataOperationType
            const pk = type.properties?.find(x => x.isPrimaryKey)
            const dataModel = { name: type.name, namespace: type.name }
            const isAuditBase = type.inherits?.name === 'AuditBase'

            const inputTagAttrs = [{
                name: "Input",
                args: [{ name:"Type", type:"string", value:"tag" }]
            },
            {
                name: "FieldCss",
                args: [{ name:"Field", type:"string", value:"col-span-12" }]
            }]

            const ignoreDtoAttrs = ['AutoIncrement']
            const idsProps = pk 
                ? [
                    Object.assign({}, pk, { 
                        type: `${this.nullable(pk.type)}`,
                        attributes:pk.attributes?.filter(a => !ignoreDtoAttrs.includes(a.name)),
                    }),
                    { 
                        name: `${pk.name}s`,
                        type: "List`1?",
                        namespace: "System.Collections.Generic",
                        genericArgs: [pk.type]
                    } as MetadataPropertyType
                ]
                : []

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
                        properties: idsProps,
                    },
                    returnType: {
                        name: "QueryResponse`1",
                        namespace: "ServiceStack",
                        genericArgs: [type.name]
                    },
                    dataModel,
                }
                if (isAuditBase) {
                    if (!queryApi.request.attributes) queryApi.request.attributes = []
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
                this.result.operations.push(queryApi)
            }
            let createName = `Create${type.name}`
            let createApi = this.result.operations.find(x => x.request.name === createName) as MetadataOperationType
            if (!createApi) {
                const ignorePropsWithAttrs = ['AutoIncrement','Reference']
                const ignoreAttrs:string[] = []
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
                            .filter(x => !x.attributes?.some(a => ignorePropsWithAttrs.includes(a.name))).map(x => 
                            Object.assign({}, x, { 
                                type: x.isPrimaryKey 
                                    ? x.type 
                                    : `${x.type}`,
                                    attributes:x.attributes?.filter(a => !ignoreAttrs.includes(a.name)),
                                })
                        ),
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

                        if (prop.type === 'string') {   
                            prop.attributes.push({
                                name: "ValidateNotEmpty",
                            })
                        } else if (this.integerTypes.includes(prop.type)) {
                            prop.attributes.push({
                                name: "ValidateGreaterThan",
                                constructorArgs:[{ name:"value", type:"int", value:"0" }]
                            })
                        } else if (prop.type === 'List`1' && this.commonValueTypes.includes(prop.genericArgs![0])) {
                            prop.attributes.push(...inputTagAttrs)
                        }
                    }
                }
                if (isAuditBase) {
                    createApi.requiresAuth = true
                    if (!createApi.request.attributes) createApi.request.attributes = []
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
                this.result.operations.push(createApi)
            }
            let updateName = `Update${type.name}`
            let updateApi = this.result.operations.find(x => x.request.name === updateName) as MetadataOperationType
            if (!updateApi) {
                const ignoreAttrs = ['AutoIncrement']
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
                        properties: type.properties?.filter(x => !x.attributes?.some(x => x.name === 'References')).map(x => 
                            Object.assign({}, x, { 
                                type: x.isPrimaryKey 
                                    ? x.type 
                                    : `${this.nullable(x.type)}`,
                                    attributes:x.attributes?.filter(a => !ignoreAttrs.includes(a.name)),
                                })
                        ),
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
                    if (!updateApi.request.attributes) updateApi.request.attributes = []
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
                this.result.operations.push(updateApi)
            }
            let deleteName = `Delete${type.name}`
            let deleteApi = this.result.operations.find(x => x.request.name === deleteName) as MetadataOperationType
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
                        properties: idsProps,
                    },
                    returnsVoid: true,
                    dataModel,
                }
                if (isAuditBase) {
                    deleteApi.requiresAuth = true
                    if (!deleteApi.request.attributes) deleteApi.request.attributes = []
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
                this.result.operations.push(deleteApi)
            }
        }
    }

    // Add Icon for BuiltIn UIs and AutoQueryGrid to known type names
    addIconsToKnownTypes() {
        for (const type of this.typesWithPrimaryKeys) {
            const icon = Icons[type.name]
            if (icon) {
                if (!type.attributes) type.attributes = []
                if (type.attributes.some(x => x.name === 'Icon')) continue
                type.attributes.push({ 
                    name: "Icon", 
                    args: [{ name: "Svg", type: "string", value:icon }]
                })
            }
        }    
    }

    // Hide Reference Properties from AutoQueryGrid Grid View
    hideReferenceProperties() {
        for (const type of this.typesWithReferences) {
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
    replaceUserReferencesWithAuditTables() {
        for (const type of this.typesWithPrimaryKeys) {

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
        this.result.types = this.result.types.filter(x => x.name !== 'User')
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
        this.replaceReferences(['Service'])
        this.replaceIds()
        this.convertReferenceTypes()
        this.convertArrayReferenceTypes()
        this.convertArraysToLists()
        this.addMissingReferencesToForeignKeyProps()
        this.addAutoIncrementAttrs()
        this.addIconsToKnownTypes()
        this.hideReferenceProperties()
        this.replaceUserReferencesWithAuditTables()
        this.createAutoCrudApis()
    }
    
    parse(ast:ParseResult) {
        
        const classes = ast.classes.concat(ast.interfaces)
        const enums = ast.enums
        this.ast = {
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

export function toMetadataTypes(ast:ParseResult) {
    const generator = new CSharpAst()
    return generator.parse(ast)
}

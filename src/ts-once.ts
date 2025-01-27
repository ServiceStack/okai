import type { ProjectInfo } from "./types.js"
import { ParsedClass, ParsedInterface, ParsedProperty, ParseResult } from "./ts-parser.js"
import { pick, toCamelCase, toPascalCase } from "./utils.js"

// Tranforms that are only applied once on AI TypeScript AST

export function createTdAstFromAIAst(tsAst:ParseResult, gropName?:string) {
    mergeInterfacesAndClasses(tsAst)
    rewriteToPascalCase(tsAst)
    replaceReferences(tsAst)
    replaceIds(tsAst)

    tsAst.classes.forEach(cls => {
        // replaceUserRefs(cls)
        rewriteDuplicateTypePropNames(cls)
        rewriteSelfReferencingIds(cls)
        convertToAuditBase(cls)
        addCustomInputs(cls)

        if (gropName) {
            if (!cls.annotations) cls.annotations = []
            if (!cls.annotations.some(x => x.name === 'tag')) {
                cls.annotations.push({ name: 'tag', constructorArgs: [gropName] })
            }
        }
    })
    changeUserRefsToAuditBase(tsAst)

    return tsAst
}

// Replace User Tables and FKs with AuditBase tables and 
export function transformUserRefs(tsAst:ParseResult, info:ProjectInfo) {
    const addClasses = []
    for (const cls of tsAst.classes) {
        const removeProps:string[] = []
        for (const prop of cls.properties!) {
            const propLower = prop.name.toLowerCase()
            if (propLower === 'userid') {
                removeProps.push(prop.name)
            }
            if (prop.type === 'User') {
                cls.extends = 'AuditBase'
                // Replace with local User Type
                /*
                [Reference(SelfId = nameof(CreatedBy), RefId = nameof(User.UserName), RefLabel = nameof(User.DisplayName))]
                public User UserRef { get; set; }
                */
                if (info.userType) prop.type = info.userType
                if (!prop.annotations) prop.annotations = []
                const attr = {
                    name: 'reference',
                    args: {
                        selfId: 'createdBy',
                        refId: 'userName',
                    } as Record<string,any>
                }
                if (info.userLabel) attr.args.refLabel = info.userLabel
                prop.annotations.push(attr)
            }
            if (prop.type === 'User[]') {
                if (info.userType) {
                    prop.type = info.userType + '[]'
                    if (!prop.annotations) prop.annotations = []
                    prop.annotations.push({ name: 'reference' })
                    const idPropType = cls.properties.find(x => x.name.toLowerCase() === 'id')?.type ?? 'number'
                    // Add Many to Many User Table
                    addClasses.push({
                        name: cls.name + 'User',
                        properties: [
                            { name: 'id', type: 'number' },
                            { name: toCamelCase(cls.name) + 'Id', type: idPropType },
                            { name: toCamelCase(info.userType) + 'Id', type: info.userIdType ?? 'string' },
                        ] as ParsedProperty[]
                    } as ParsedClass)
                }
            }
        } 
        if (removeProps.length) {
            cls.extends = 'AuditBase'
            cls.properties = cls.properties!.filter(x => !removeProps.includes(x.name))
        }
    }
    if (addClasses.length) {
        tsAst.classes.push(...addClasses)
    }
    // Remove User Table if local User Table exists
    if (info.userType) {
        tsAst.classes = tsAst.classes.filter(x => x.name !== 'User')
    }
}

function rewriteDuplicateTypePropNames(type:ParsedClass) {
    const duplicateTypePropMap : Record<string,string> = {
        note: 'content',
    }
    const duplicateProp = type.properties?.find(x => toPascalCase(x.name) === type.name)
    if (duplicateProp) {
        const newName = duplicateTypePropMap[duplicateProp.name] ?? 'value'
        duplicateProp.name = newName
    }
}

function rewriteSelfReferencingIds(type:ParsedClass) {
    const selfRefId = type.properties?.find(x => x.name.toLowerCase() === `${type.name}id`.toLowerCase())
    if (selfRefId) {
        selfRefId.name = `parentId`
    }
}

export function addCustomInputs(cls:ParsedClass) {
    const currencyTypeProps = [
        "price","cost","total","salary","balance","tax","fee"
    ]
    for (const prop of cls.properties ?? []) {
        if (currencyTypeProps.some(x => prop.name.toLowerCase().includes(x))) {
            if (!prop.annotations) prop.annotations = []
            prop.annotations.push({ 
                name: "IntlNumber",
                args: { Currency:"NumberCurrency.USD" }
            })
        }
    }
}

function rewriteToPascalCase(ast:ParseResult) {
    ast?.classes.forEach(t => {
        t.name = toPascalCase(t.name)
        t.properties?.forEach(p => p.name = toCamelCase(p.name))
    })
    ast.enums?.forEach(e => {
        e.name = toPascalCase(e.name)
        if (e.members?.length) {
            e.members?.forEach((m,i) => {
                // always reset the value of AI enums
                m.value = i
                m.name = toPascalCase(m.name)            
            })
        }
    })
}

function convertToAuditBase(cls:ParsedClass) {
    const props = cls.properties ?? []
    const auditFields = ['createdBy', 'updatedBy', 'createdAt', 'updatedAt', 'userId']
    if (props.find(x => auditFields.includes(x.name))) {
        cls.extends = 'AuditBase'
        cls.properties = props.filter(x => !auditFields.includes(x.name))
    }
}

function changeUserRefsToAuditBase(ast:ParseResult) {
    const user = ast.classes?.find(x => x.name === 'User') ?? ast.interfaces?.find(x => x.name === 'User')
    if (user) {
        user.properties?.forEach(prop => {
            // If User Model references any other model, chnage it to extend AuditBase
            const ref = ast.classes?.find(x => x.name === prop.type) 
                ?? ast.interfaces?.find(x => x.name === prop.type)
            if (ref) {
                ref.extends = 'AuditBase'
            }
            // If User Model references any other model[], chnage it to extend AuditBase
            const refs = ast.classes?.find(x => prop.type.endsWith('[]') && x.name === prop.type.substring(0, prop.type.length - 2)) 
                ?? ast.interfaces?.find(x => prop.type.endsWith('[]') && x.name === prop.type.substring(0, prop.type.length - 2)) 
            if (refs) {
                refs.extends = 'AuditBase'
            }
        })
    }    
}

function mergeInterfacesAndClasses(ast:ParseResult) {
    const classes = []
    for (const iface of ast.interfaces) {
        const cls = interfaceToClass(iface)
        classes.push(cls)
    }
    for (const cls of ast.classes) {
        classes.push(cls)
    }
    ast.classes = classes
    ast.interfaces = []
}

function interfaceToClass(ast:ParsedInterface) {
    return pick(ast, ['name', 'extends', 'comment', 'properties', 'annotations']) as ParsedClass
}

export function replaceReferences(tsAst:ParseResult) {
    const references = [
        'Service',
        'Task',
    ]
    // The most important types are the ones with the most references
    const refCount = (t:ParsedClass) => t.properties?.filter(
        p => tsAst.classes.find(x => x.name === p.type)).length || 0
    const importantTypes = tsAst.classes.sort((x,y) => refCount(y) - refCount(x))

    for (const cls of tsAst.classes) {
        if (references.includes(cls.name)) {
            const importantType = importantTypes.find(x => x.properties?.some(p => p.type === cls.name))
            if (importantType) {
                const newName = `${importantType.name}${cls.name}`
                replaceReference(tsAst, cls.name, newName)
            }
        }
    }
}

export function replaceReference(gen:ParseResult, fromType:string, toType:string) {
    for (const cls of gen.classes) {
        if (cls.name === fromType) {
            cls.name = toType
        }
        if (cls.properties) {
            for (const prop of cls.properties!) {
                if (prop.type === fromType) {
                    prop.type = toType
                }
                if (prop.type === `${fromType}[]`) {
                    prop.type = `${toType}[]`
                }2
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

export function replaceIds(gen:ParseResult) {
    for (const type of gen.classes) {
        const explicitIdProp = type.properties?.find(x => x.name.toLowerCase() === `${type.name}Id`.toLowerCase())
        if (explicitIdProp) {
            const hasId = type.properties.find(x => x.name === 'id')
            if (hasId) {
                explicitIdProp.name = 'parentId'
                explicitIdProp.optional = true
            } else {
                explicitIdProp.name = 'id'
            }
        } else {
            // If using a shortened id for the type e.g. (PerformanceReview, ReviewId)
            const firstProp = type.properties?.[0]
            if (firstProp?.name.endsWith('Id') && type.name.toLowerCase().includes(firstProp.name.substring(0, firstProp.name.length-2).toLowerCase())) {
                firstProp.name = 'id'
            }
        }
    }
    // Replace all string Ids with int Ids
    const anyIntPks = gen.classes.some(x => x.properties?.some(p => p.name === 'id' && p.type === 'number'))
    if (!anyIntPks) {
        for (const type of gen.classes) {
            const idProp = type.properties?.find(x => x.name === 'id')
            if (idProp) {
                idProp.type = 'number'
            }
        }
    }
}

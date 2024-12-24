import { ParsedAnnotation, ParsedClass, ParsedEnum, ParsedInterface, ParsedProperty, ParseResult, TypeScriptParser } from "./ts-parser.js"
import { toPascalCase, toCamelCase } from "./utils.js"

export class TsdGenerator {

    interfaces: string[] = []
    enums: string[] = []
    ast: ParseResult = { references:[], classes:[], interfaces:[], enums: [] }

    attrValue(type:string, value:any) {
        return type === 'string' ? `"${value}"` : value
    }

    toAttr(attr:ParsedAnnotation) {
        const sbArgs = []
        if (attr?.constructorArgs?.length) {
            for (const arg of attr.constructorArgs) {
                sbArgs.push(this.attrValue(typeof arg, arg))
            }
        }
        if (attr.args) {
            for (const [name,value] of Object.entries(attr.args)) {
                sbArgs.push(`${name}=${this.attrValue(typeof value, value)}`)
            }
        }
        return `@${attr.name}(${sbArgs.join(',')})`
    }

    toInterface(ast:ParsedInterface) {
        return this.toType(ast, 'interface')
    }

    toClass(ast:ParsedInterface) {
        return this.toType(ast, 'class')
    }

    toType(ast:ParsedClass|ParsedInterface, type:"interface"|"class") {
        const sb:string[] = []
        if (ast.comment) {
            sb.push(ast.comment.split('\n').map(x => `// ${x}`).join('\n'))
        }
        if (ast.annotations?.length) {
            for (const attr of ast.annotations) {
                sb.push(this.toAttr(attr))
            }
        }
        const extend = ast.extends ? ` extends ${ast.extends}` : ''
        sb.push(`export ${type} ${ast.name}${extend} {`)
        for (const prop of ast.properties) {
            if (prop.comment) {
                sb.push(prop.comment.split('\n').map(x => `  // ${x}`).join('\n'))
            }
            if (prop.annotations?.length) {
                for (const attr of prop.annotations) {
                    sb.push('  ' + this.toAttr(attr))
                }
            }
            sb.push(`  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}`)
        }
        sb.push('}')
        return sb.join('\n')
    }

    toEnum(ast:ParsedEnum) {
        const sb:string[] = []
        if (ast.comment) {
            sb.push(ast.comment.split('\n').map(x => `// ${x}`).join('\n'))
        }
        sb.push(`export enum ${ast.name} {`)
        for (let i = 0; i < ast.members.length; i++) {
            const member = ast.members[i]
            if (member.comment) {
                sb.push(member.comment.split('\n').map(x => `  // ${x}`).join('\n'))
            }
            const value = typeof member.value === 'string' 
                ? ` = '${member.value}'` 
                : member.value !== (i+1) ? ` = ${member.value}` : ''
            sb.push(`  ${member.name}${value},`)
        }
        sb.push('}')
        return sb.join('\n')
    }

    generate(ast:ParseResult) {
        this.ast = ast
        const sb:string[] = []
        if (ast.references?.length) {
            for (const ref of ast.references) {
                sb.push(`/// <reference path="${ref.path}" />`)
            }
            sb.push('')
        }

        for (const cls of ast.enums ?? []) {
            sb.push(this.toEnum(cls))
            sb.push('')
        }

        for (const cls of ast.interfaces ?? []) {
            sb.push(this.toType(cls, "interface"))
            sb.push('')
        }

        for (const cls of ast.classes ?? []) {
            sb.push(this.toType(cls, "class"))
            sb.push('')
        }

        const tsd = sb.join('\n')
        return tsd
    }
}

function replaceUserRefs(type:ParsedClass) {
    type.name = toPascalCase(type.name)
    type.properties?.forEach(prop => {
        prop.name = toCamelCase(prop.name)
        if (prop.type === 'User' || prop.name === 'userId') {
            type.extends = 'AuditBase'
        }

        if (prop.type.startsWith('Array<')) {
            const elType = prop.type.slice('Array<'.length, -1)
            prop.type = elType + '[]'
        }
        if (prop.type === 'User') {
            prop.name = 'userId'
            prop.type = 'string'
        }
        if (prop.type === 'User[]') {
            if (prop.name.endsWith('s')) {
                prop.name = prop.name.slice(0, -1) + 'Ids'
            }
            prop.type = 'string[]'
        }        
    })
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

function rewriteEnumsToPascalCase(ast:ParseResult) {
    ast.enums?.forEach(e => {
        e.name = toPascalCase(e.name)
        e.members?.forEach(m => {
            m.name = toPascalCase(m.name)
        })
    })
}

function removeUserRefs(ast:ParseResult) {

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
        ast.classes = ast.classes?.filter(x => x.name !== 'User')
        ast.interfaces = ast.interfaces?.filter(x => x.name !== 'User')
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
    const to : ParsedClass = {
        name: ast.name,
        extends: ast.extends,
        comment: ast.comment,
        properties: ast.properties,
        annotations: ast.annotations,
    }
    return to
}

export function createTdAstFromAITypeScript(ts:string) {
    const parser = new TypeScriptParser()
    const tdAst = parser.parse(ts)
    return createTdAstFromAIAst(tdAst)
}

export function replaceReferences(tsAst:ParseResult) {
    const references = [
        'Service',
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
        const idProp = type.properties?.find(x => x.name.toLowerCase() === `${type.name}Id`.toLowerCase())
        if (idProp) {
            idProp.name = 'id'
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

export function createTdAstFromAIAst(tsAst:ParseResult) {
    mergeInterfacesAndClasses(tsAst)
    replaceReferences(tsAst)
    replaceIds(tsAst)

    tsAst.classes.forEach(cls => {
        replaceUserRefs(cls)
        rewriteDuplicateTypePropNames(cls)
        rewriteSelfReferencingIds(cls)
    })
    removeUserRefs(tsAst)
    rewriteEnumsToPascalCase(tsAst)

    return tsAst
}

export function toTsd(tsAst:ParseResult) {
    const gen = new TsdGenerator()
    return gen.generate(tsAst)
}
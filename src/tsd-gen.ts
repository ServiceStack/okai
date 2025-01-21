import { ParsedAnnotation, ParsedClass, ParsedEnum, ParsedInterface, ParseResult } from "./ts-parser.js"
import { rightPart } from "./utils.js"

export class TsdGenerator {

    export: boolean = true
    interfaces: string[] = []
    enums: string[] = []
    ast: ParseResult = { references:[], classes:[], interfaces:[], enums: [] }

    get typePrefix() {
        return this.export ? 'export ' : ''
    }

    isEnumValue(value:string) {
        const parts = (value ?? '').split('.')
        if (parts.length !== 2) return false
        const isUpper = (charCode:number) => charCode >= 65 && charCode <= 90
        const isAlphaNum = (s:string) => /^[a-z0-9]+$/i.test(s)
        return isAlphaNum(parts[0]) && isUpper(parts[0].charCodeAt(0)) && isAlphaNum(parts[1]) && isUpper(parts[1].charCodeAt(0)) 
    }

    attrValue(type:string, value:any) {
        return type === 'string' && !this.isEnumValue(value)
            ? `"${value}"` 
            : value
    }

    toAttr(attr:ParsedAnnotation) {
        const sbCtorArgs = []
        if (attr?.constructorArgs?.length) {
            for (const arg of attr.constructorArgs) {
                sbCtorArgs.push(this.attrValue(typeof arg, arg))
            }
        }
        const sbArgs = []
        if (attr.args) {
            for (const [name,value] of Object.entries(attr.args)) {
                sbArgs.push(`${name}:${this.attrValue(typeof value, value)}`)
            }
        }
        return `@${attr.name}(${sbCtorArgs.join(',')}${sbCtorArgs.length && sbArgs.length ? ',' : ''}${sbArgs.length ? `{${sbArgs.join(',')}}` : ''})`
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
            for (const attr of sortAnnotations(ast.annotations)) {
                sb.push(this.toAttr(attr))
            }
        }
        const extend = ast.extends ? ` extends ${ast.extends}` : ''
        const impls = (ast as ParsedClass).implements?.length ? ` implements ${(ast as ParsedClass).implements.join(', ')}` : ''
        sb.push(`${this.typePrefix}${type} ${ast.name}${extend}${impls} {`)
        for (const prop of ast.properties) {
            if (prop.comment) {
                sb.push(prop.comment.split('\n').map(x => `  // ${x}`).join('\n'))
            }
            if (prop.annotations?.length) {
                for (const attr of sortAnnotations(prop.annotations)) {
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
        sb.push(`${this.typePrefix}enum ${ast.name} {`)
        const allStringValuesMatch = ast.members.every(x => typeof x.value === 'string' && x.value === x.name)
        for (let i = 0; i < ast.members.length; i++) {
            const member = ast.members[i]
            if (member.comment) {
                sb.push(member.comment.split('\n').map(x => `  // ${x}`).join('\n'))
            }
            const value = typeof member.value === 'string' 
                ? allStringValuesMatch
                    ? `` 
                    : ` = ${member.value}`
                : member.value !== i ? ` = ${member.value}` : ''
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
        }
        if (ast.config) {
            sb.push(`export type Config = {`)
            const knownKeys = ['prompt','api','migration','uiMjs']
            const maxKeyLen = Object.keys(ast.config).reduce((max, key) => Math.max(max, key.length), 0)
            for (const knownKey of knownKeys) {
                if (ast.config[knownKey]) {
                    sb.push(`  ${(knownKey + ':').padEnd(maxKeyLen + 1, ' ')} ${JSON.stringify(ast.config[knownKey])}`)
                }
            }
            for (const key of Object.keys(ast.config).filter(k => !knownKeys.includes(k))) {
                sb.push(`  ${(key + ':').padEnd(maxKeyLen + 1, ' ')} ${JSON.stringify(ast.config[key])},`)
            }
            sb.push(`}`)
        }
        if (sb.length) sb.push('')

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

function sortAnnotations(annotations:ParsedAnnotation[]) {
    const to = annotations.sort((x,y) => {
        const prefix = ['Read.','Create.','Update.','Delete.','Write.']
        const xPrefix = prefix.findIndex(p => x.name.startsWith(p))
        const yPrefix = prefix.findIndex(p => y.name.startsWith(p))
        // Sort by Prefix first in order ['Read.','Write.','Update.','Delete.']
        if (xPrefix !== yPrefix) return xPrefix == -1 ? 1 : yPrefix == -1 ? -1 : xPrefix - yPrefix
        const xName = x.name.includes('.') ? rightPart(x.name, '.') : x.name
        const yName = y.name.includes('.') ? rightPart(y.name, '.') : y.name
        // then Sort by length of attr name
        if (xName.length !== yName.length) return xName.length - yName.length
        // then Sort by attr name
        if (xName != yName) return xName.localeCompare(yName)
        // then Sort by length of constructorArgs[0]
        if ((x.constructorArgs?.length ?? 0) > 0 && (y.constructorArgs?.length ?? 0) > 0) return x.constructorArgs[0].length - y.constructorArgs[0].length
        // then Sort by constructorArgs.length
        if (x.constructorArgs?.length !== y.constructorArgs?.length) return (x.constructorArgs?.length ?? 0) - (y.constructorArgs?.length ?? 0)
        // then Sort by args.length
        return (x.args?.length ?? 0) - (y.args?.length ?? 0)
    })
    return to
}

export function toTsd(tsAst:ParseResult) {
    const gen = new TsdGenerator()
    return gen.generate(tsAst)
}

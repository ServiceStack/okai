import { ParsedAnnotation, ParsedClass, ParsedEnum, ParsedInterface, ParseResult } from "./ts-parser.js"

export class TsdGenerator {

    interfaces: string[] = []
    enums: string[] = []
    ast: ParseResult = { references:[], classes:[], interfaces:[], enums: [] }

    attrValue(type:string, value:any) {
        return type === 'string' ? `"${value}"` : value
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

export function toTsd(tsAst:ParseResult) {
    const gen = new TsdGenerator()
    return gen.generate(tsAst)
}

import { ParsedAnnotation, ParsedClass, ParsedEnum, ParsedInterface, ParsedProperty, ParseResult } from "./ts-parser.js"
import { toPascalCase, toCamelCase } from "./utils.js"

export class TsdGenerator {

    interfaces: string[] = []
    enums: string[] = []
    ast: ParseResult = { classes:[], interfaces:[], enums: [] }

    clsToInterface(ast:ParsedClass) {
        const to = {
            name: ast.name,
            extends: ast.extends,
            comment: ast.comment,
            properties: ast.properties,
            annotations: ast.annotations,
        }
        return to
    }

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
        const prefix = attr.comment ? '// ' : ''
        return `${prefix}@${attr.name}(${sbArgs.join(',')})`
}

    toInterface(ast:ParsedInterface) {
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
        sb.push(`export interface ${ast.name}${extend} {`)
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

        for (const cls of ast.enums ?? []) {
            sb.push(this.toEnum(cls))
            sb.push('')
        }

        for (const cls of ast.interfaces ?? []) {
            sb.push(this.toInterface(cls))
            sb.push('')
        }

        for (const cls of ast.classes ?? []) {
            const iface = this.clsToInterface(cls)
            sb.push(this.toInterface(iface))
            sb.push('')
        }

        const tsd = sb.join('\n')
        return tsd
    }
}

export class TsdDataModelGenerator extends TsdGenerator
{
    generate(ast:ParseResult) {
        function convertProps(properties?: ParsedProperty[]) {
            properties?.forEach(prop => {
                prop.name = toCamelCase(prop.name)
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

        ast.classes?.forEach(cls => {
            cls.name = toPascalCase(cls.name)
            convertProps(cls.properties)
        })
        ast.interfaces?.forEach(cls => {
            cls.name = toPascalCase(cls.name)
            convertProps(cls.properties)
        })
        ast.enums?.forEach(e => {
            e.name = toPascalCase(e.name)
            e.members?.forEach(m => {
                m.name = toPascalCase(m.name)
            })
        })
        if (ast.classes) {
            ast.classes = ast.classes.filter(x => x.name !== 'User')
        }
        if (ast.interfaces) {
            ast.interfaces = ast.interfaces.filter(x => x.name !== 'User')
        }

        return super.generate(ast)
    }
}
import type { MetadataTypes, MetadataType, MetadataTypeName, MetadataAttribute, MetadataPropertyType } from "./types"
import { leftPart } from "./utils.js"

export class CSharpGenerator {
    namespaces: string[] = []
    apis: string[] = []
    classes: string[] = []
    enums: string[] = []
    ast: MetadataTypes = { namespaces:[], operations:[], types: [] }

    typeHasAttr(type:MetadataType, name:string) {
        return type.attributes?.some(x => x.name === name)
    }
    propHasAttr(prop:MetadataPropertyType, name:string) {
        return prop.attributes?.some(x => x.name === name)
    }

    addNamespace(ns?:string) {
        if (!ns || this.namespaces.includes(ns)) return
        this.namespaces.push(ns)
    }

    toTypeRef(typeRef:MetadataTypeName) {
        return this.toType(typeRef.name, typeRef.genericArgs, typeRef.namespace)
    }
    toType(name:string, genericArgs?:string[], namespace?:string) {
        if (namespace) {
            this.addNamespace(namespace)
        }
        const optional = name.endsWith('?')
        return genericArgs?.length
            ? `${leftPart(name,'`')}<${genericArgs.join(',')}>` + (optional ? '?' : '')
            : name
    }

    toAttribtue(attr:MetadataAttribute) {
        let body = ''
        if (attr.constructorArgs?.length) {
            for (const arg of attr.constructorArgs) {
                this.addNamespace(arg.namespace)
                if (body) body += ','
                const value = arg.type.toLowerCase() === 'string'
                    ? `"${arg.value}"`
                    : arg.value
                body += value
            }            
        }
        if (attr.args?.length) {
            for (const arg of attr.args) {
                this.addNamespace(arg.namespace)
                if (body) body += ','
                const value = arg.type.toLowerCase() === 'string'
                    ? `"${arg.value}"`
                    : arg.value
                body += `${arg.name}=${value}`
            }
        }
        return `[${attr.name}${body ? `(${body})` : ''}]`
    }

    toClass(cls:MetadataType, opt?:{hide:string[]}) {
        const showDesc = !opt || !opt.hide?.includes('description')
        const sb:string[] = []
        let clsDef = `public class ${cls.name}`
        if (cls.inherits) {
            this.addNamespace(cls.inherits.namespace)
            clsDef += ` : ${this.toTypeRef(cls.inherits)}`
        }
        if (cls.implements?.length) {
            clsDef += (cls.inherits ? ', ' : ' : ') + `${cls.implements.map(this.toTypeRef).join(', ')}`
        }
        if (showDesc && cls.description) {
            sb.push(`/// <summary>`)
            sb.push(`/// ${cls.description.replace(/\n/g, '\n/// ')}`)
            sb.push(`/// </summary>`)
        }
        for (const attr of cls.attributes ?? []) {
            if (opt?.hide?.includes(attr.name.toLowerCase())) continue
            const def = this.toAttribtue(attr)
            sb.push(`${def}`)
        }
        sb.push(clsDef)
        sb.push('{')
        for (const prop of cls.properties ?? []) {
            this.addNamespace(prop.namespace)
            if (showDesc && prop.description) {
                sb.push(`    /// <summary>`)
                sb.push(`    /// ${prop.description.replace(/\n/g, '\n    /// ')}`)
                sb.push(`    /// </summary>`)
            }
            for (const attr of prop.attributes ?? []) {
                const def = this.toAttribtue(attr)
                sb.push(`    ${def}`)
            }
            const propType = this.toType(prop.type, prop.genericArgs, prop.namespace)
            sb.push(`    public ${propType} ${prop.name} { get; set; }`)
        }
        sb.push('}')
        return sb.join('\n')
    }

    toEnum(enumType:MetadataType, opt?:{hide:string[]}) {
        const showDesc = !opt || !opt.hide?.includes('description')
        const sb:string[] = []
        if (showDesc && enumType.description) {
            sb.push(`[Description("${enumType.description}")]`)
        }
        sb.push(`public enum ${enumType.name}`)
        sb.push('{')
       
        if (enumType.enumNames?.length) {
            for (let i = 0; i < enumType.enumNames.length; i++) {
                const name = enumType.enumNames[i]
                let value = enumType.enumValues?.[i]
                let memberValue = enumType.enumMemberValues && i < enumType.enumMemberValues.length
                    ? enumType.enumMemberValues[i]
                    : value

                let desc = enumType.enumDescriptions?.[i]
                if (desc) {
                    sb.push(`    [Description("${desc}")]`)
                }

                if (memberValue && memberValue !== value && memberValue !== name) {
                    sb.push(`    [EnumMember(Value = "${memberValue}")]`)
                }

                sb.push(value
                    ? `    ${name} = ${value},`
                    : `    ${name},`)
            }
        }
        
        sb.push('}')
        return sb.join('\n')
    }

    generate(ast:MetadataTypes) {}
}

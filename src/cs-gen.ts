import type { MetadataTypes, MetadataType, MetadataTypeName, MetadataAttribute, MetadataPropertyType } from "./types"
import { unwrap } from "./cs-ast.js"
import { leftPart, rightPart } from "./utils.js"

export class CSharpGenerator {
    namespaces: string[] = []
    apis: string[] = []
    classes: string[] = []
    enums: string[] = []
    ast: MetadataTypes = { namespaces:[], operations:[], types: [] }
    typeFilter?: { before?: (type:MetadataType, sb:string[]) => void, after?: (type:MetadataType, sb:string[]) => void }

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
            ? `${unwrap(leftPart(name,'`'))}<${genericArgs.join(',')}>` + (optional ? '?' : '')
            : name
    }

    sortAttributes(annotations:MetadataAttribute[]) {
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
            if ((x.constructorArgs?.length ?? 0) > 0 && (y.constructorArgs?.length ?? 0) > 0) return x.constructorArgs[0].name.length - y.constructorArgs[0].name.length
            // then Sort by constructorArgs.length
            if (x.constructorArgs?.length !== y.constructorArgs?.length) return (x.constructorArgs?.length ?? 0) - (y.constructorArgs?.length ?? 0)
            // then Sort by args.length
            return (x.args?.length ?? 0) - (y.args?.length ?? 0)
        })
        return to
    }

    toAttribute(attr:MetadataAttribute) {
        let body = ''
        if (attr.constructorArgs?.length) {
            for (const arg of attr.constructorArgs) {
                this.addNamespace(arg.namespace)
                if (body) body += ','
                const value = arg.type.toLowerCase() === 'string'
                    ? this.toQuotedString(arg.value)
                    : arg.value
                body += value
            }            
        }
        if (attr.args?.length) {
            for (const arg of attr.args) {
                this.addNamespace(arg.namespace)
                if (body) body += ','
                const value = arg.type.toLowerCase() === 'string'
                    ? this.toQuotedString(arg.value)
                    : arg.value
                body += `${arg.name}=${value}`
            }
        }
        return `[${attr.name}${body ? `(${body})` : ''}]`
    }

    toClass(cls:MetadataType, opt?:{hideAttrs:string[], ignoreProp?:(prop:MetadataPropertyType)=>boolean}) {
        const showDesc = !opt || !opt.hideAttrs?.includes('description')
        const sb:string[] = []

        if (this.typeFilter?.before) {
            this.typeFilter.before(cls, sb)
        }
        let clsDef = `public class ${cls.name}`
        if (cls.inherits) {
            this.addNamespace(cls.inherits.namespace)
            clsDef += ` : ${this.toTypeRef(cls.inherits)}`
        }
        if (cls.implements?.length) {
            clsDef += (cls.inherits ? ', ' : ' : ') + `${cls.implements.map(x => this.toTypeRef(x)).join(', ')}`
        }
        if (showDesc && cls.description) {
            sb.push(`/// <summary>`)
            sb.push(`/// ${cls.description.replace(/\n/g, '\n/// ')}`)
            sb.push(`/// </summary>`)
        }
        for (const attr of this.sortAttributes(cls.attributes ?? [])) {
            if (opt?.hideAttrs?.includes(attr.name.toLowerCase())) continue
            const def = this.toAttribute(attr)
            sb.push(`${def}`)
        }
        sb.push(clsDef)
        sb.push('{')
        for (const prop of cls.properties ?? []) {
            if (opt?.ignoreProp?.(prop)) continue
            this.addNamespace(prop.namespace)
            if (showDesc && prop.description) {
                sb.push(`    /// <summary>`)
                sb.push(`    /// ${prop.description.replace(/\n/g, '\n    /// ')}`)
                sb.push(`    /// </summary>`)
            }
            for (const attr of this.sortAttributes(prop.attributes ?? [])) {
                if (opt?.hideAttrs?.includes(attr.name.toLowerCase())) continue
                const def = this.toAttribute(attr)
                sb.push(`    ${def}`)
            }
            const propType = this.toType(prop.type, prop.genericArgs, prop.namespace)
            sb.push(`    public ${propType} ${prop.name} { get; set; }`)
        }
        sb.push('}')
        if (this.typeFilter?.after) {
            this.typeFilter.after(cls, sb)
        }
        return sb.join('\n')
    }

    toQuotedString(s?:string, defaultValue:string = '""') {
        return s ? `"${s.replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('\n','\\n').replaceAll('\t','\\t')}"` : defaultValue
    }

    toEnum(enumType:MetadataType, opt?:{hideAttrs:string[]}) {
        const showDesc = !opt || !opt.hideAttrs?.includes('description')
        const sb:string[] = []
        if (showDesc && enumType.description) {
            sb.push(`[Description(${this.toQuotedString(enumType.description)})]`)
        }
        sb.push(`public enum ${enumType.name}`)
        sb.push('{')
       
        if (enumType.enumNames?.length) {
            const usesDefaultValues = enumType.enumValues?.length == enumType.enumNames.length 
                && enumType.enumValues.every((x,i) => x === i.toString())
            for (let i = 0; i < enumType.enumNames.length; i++) {
                const name = enumType.enumNames[i]
                let value = enumType.enumValues?.[i]
                let memberValue = enumType.enumMemberValues && i < enumType.enumMemberValues.length
                    ? enumType.enumMemberValues[i]
                    : value

                let desc = enumType.enumDescriptions?.[i]
                if (desc) {
                    sb.push(`    [Description(${this.toQuotedString(desc)})]`)
                }

                if (memberValue && memberValue !== value && memberValue !== name) {
                    sb.push(`    [EnumMember(Value = ${this.toQuotedString(memberValue)})]`)
                }

                sb.push(value && !usesDefaultValues
                    ? `    ${name} = ${value},`
                    : `    ${name},`)
            }
        }
        
        sb.push('}')
        return sb.join('\n')
    }

    generate(ast:MetadataTypes) {}
}

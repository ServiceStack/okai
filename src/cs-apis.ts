import type { MetadataTypes, MetadataTypeName, MetadataOperationType, MetadataAttribute } from "./types"
import { getGroupName, rightPart } from "./utils.js"
import { CSharpGenerator } from "./cs-gen.js"

export class CSharpApiGenerator extends CSharpGenerator {

    toApiClass(op:MetadataOperationType) {
        const cls = op.request
        const sb:string[] = []
        let clsDef = `public class ${cls.name}`
        let doesExtend = false
        if (cls.inherits) {
            this.addNamespace(cls.inherits.namespace)
            clsDef += ` : ${this.toTypeRef(cls.inherits)}`
            doesExtend = true
        }
        if (cls.implements?.length) {
            clsDef += (cls.inherits ? ', ' : ' : ') + `${cls.implements.map(x => this.toTypeRef(x)).join(', ')}`
            doesExtend = true
        }
        if (!cls.inherits?.name.startsWith('QueryDb`') && !cls.inherits?.name.startsWith('QueryData`')) {
            if (op.returnType || op.returnsVoid) {
                clsDef += (doesExtend ? `, ` : ` : `) + (op.returnType
                    ? `IReturn<${this.toTypeRef(op.returnType)}>`
                    : `IReturnVoid`)
            }
        }

        const attrs = cls.attributes ?? []
        const hasTypeAttr = (name:string) => attrs.some(x => x.name === name)

        if (op.tags?.length && !attrs.some(x => x.name === 'Tag')) {
            for (const tag of op.tags) {
                attrs.push({ name:'Tag', constructorArgs:[{ name:'tag', type:'string', value:tag }] })
            }
        }
        if (op.requiredRoles?.length) {
            const adminRole = op.requiredRoles.includes('Admin')
            if (adminRole && !hasTypeAttr('ValidateIsAdmin')) {
                attrs.push({ name:'ValidateIsAdmin' })
            }
            const roles = op.requiredRoles.filter(r => r !== 'Admin')
            if (roles.length && !hasTypeAttr('ValidateHasRole')) {
                attrs.push({ name:'ValidateHasRole', constructorArgs:[{ name:'role', type:'string', value:roles[0] }] })
            }
        } else if (op.requiresAuth && !(hasTypeAttr('ValidateIsAuthenticated') || hasTypeAttr('ValidateIsAdmin') || hasTypeAttr('ValidateHasRole'))
        ) {
            attrs.push({ name:'ValidateIsAuthenticated' })
        }
        if (cls.description && !hasTypeAttr('Api')) {
            attrs.push({ name:'Api', constructorArgs:[{ name:'description', type:'string', value:cls.description }] })
        }
        if (op.routes?.length && !attrs.some(x => x.name === 'Route')) {
            for (const route of op.routes) {
                attrs.push({ name:'Route', constructorArgs:[
                    { name:'path', type:'string', value:route.path },
                    { name:'verbs', type:'string', value:route.verbs ?? "POST" }
                ] })
            }
        }

        for (const attr of this.sortAttributes(attrs)) {
            sb.push(this.toAttribute(attr))
        }
        
        sb.push(clsDef)
        sb.push('{')
        for (const prop of cls.properties!) {            
            const hasPropAttr = (name:string) => prop.attributes?.some(x => x.name === name)
            const attrs = prop.attributes ?? []
            this.addNamespace(prop.namespace)
            if (prop.description && !hasPropAttr('ApiMember')) {
                if (!prop.description.includes('\n')) {
                    attrs.push({ name:'ApiMember', args:[{ name:'Description', type:'string', value:prop.description }] })
                } else {
                    sb.push(`    [ApiMember(Description=\n` +
                            `    """\n` +
                            `    ${prop.description.replaceAll('\n', '\n    ')}\n` +
                            `    """)]`)
                }
            }
            for (const attr of this.sortAttributes(attrs)) {    
                const def = this.toAttribute(attr)
                sb.push(`    ${def}`)
            }
            const propType:MetadataTypeName = { name:prop.type, namespace:prop.namespace, genericArgs:prop.genericArgs }
            sb.push(`    public ${this.toTypeRef(propType)} ${prop.name} { get; set; }`)
        }
        sb.push('}')
        return sb.join('\n')
    }

    generate(ast:MetadataTypes) {
        const groupName = getGroupName(ast)
        
        this.namespaces = Array.from(ast.namespaces)
        this.apis = ast.operations.map(x => this.toApiClass(x))
        this.classes = ast.types.filter(t => !t.isEnum).map(x => this.toClass(x))
        this.enums = ast.types.filter(t => t.isEnum).map(x => this.toEnum(x))
        
        const fileName = groupName + '.cs'

        const sb:string[] = []
        for (const ns of this.namespaces) {
            sb.push(`using ${ns};`)
        }
        sb.push('')

        sb.push(`namespace MyApp.ServiceModel;`)
        sb.push('')

        if (this.apis.length) {
            for (const cls of this.apis) {
                sb.push(cls)
                sb.push('')
            }
            sb.push('')
        }

        if (this.classes.length) {
            for (const cls of this.classes) {
                sb.push(cls)
                sb.push('')
            }
            sb.push('')
        }

        if (this.enums.length) {
            for (const cls of this.enums) {
                sb.push(cls)
                sb.push('')
            }
            sb.push('')
        }

        const cs = sb.join('\n')
        return { [`MyApp.ServiceModel/${fileName}`]: cs }
    }
}

export function toCSharpApis(csAst:MetadataTypes) {
    const csFiles = new CSharpApiGenerator().generate(csAst)
    const cs = csFiles[Object.keys(csFiles)[0]]
    return cs
}

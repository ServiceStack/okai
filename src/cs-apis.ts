import type { MetadataTypes, MetadataTypeName, MetadataOperationType } from "./types"
import { getGroupName, plural, splitCase } from "./utils"
import { CSharpGenerator } from "./cs-gen"

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

        if (op.tags?.length) {
            for (const tag of op.tags) {
                sb.push(`[Tag("${tag}")]`)
            }
        }
        if (op.requiredRoles?.length) {
            const adminRole = op.requiredRoles.includes('Admin')
            if (adminRole) {
                sb.push(`[ValidateIsAdmin]`)
            }
            const roles = op.requiredRoles.filter(r => r !== 'Admin')
            if (roles.length) {
                sb.push(`[ValidateHasRole("${roles[0]}")]`)
            }
        } else if (op.requiresAuth) {
            sb.push(`[ValidateIsAuthenticated]`)
        }
        if (cls.description) {
            sb.push(`[Api("${cls.description}")]`)
        }
        for (const attr of cls.attributes ?? []) {
            sb.push(this.toAttribtue(attr))
        }
        if (op.routes?.length) {
            for (const route of op.routes) {
                sb.push(`[Route("${route.path}", "${route.verbs ?? "POST"}")]`)
            }
        }
        
        sb.push(clsDef)
        sb.push('{')
        for (const prop of cls.properties!) {
            this.addNamespace(prop.namespace)
            if (prop.description) {
                if (!prop.description.includes('\n')) {
                    sb.push(`    [ApiMember(Description="${prop.description.replace(/"/g, '\\"')}")]`)
                } else {
                    sb.push(`    [ApiMember(Description=\n` +
                            `    """\n` +
                            `    ${prop.description.replaceAll('\n', '\n    ')}\n` +
                            `    """)]`)
                }
            }
            for (const attr of prop.attributes ?? []) {
                const def = this.toAttribtue(attr)
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
        const friendlyGroupName = splitCase(groupName)

        ast.operations.forEach(op => {
            if (!op.tags) op.tags = []
            op.tags.push(friendlyGroupName)
        })
        
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

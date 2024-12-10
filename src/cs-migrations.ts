import { 
    MetadataTypes, MetadataType, MetadataTypeName, MetadataOperationType
} from "./types"
import { CSharpGenerator } from "./cs-gen"
import { indentLines } from "./utils"

export class CSharpMigrationGenerator extends CSharpGenerator {

    generate(ast: MetadataTypes) : {[name:string]:string} {
        this.namespaces = Array.from(new Set([
            'System.Data',
            'ServiceStack',
            'ServiceStack.DataAnnotations',
            'ServiceStack.OrmLite',
            ...ast.namespaces
        ]))
        const hideAttrs = { hide:['description','icon'] }
        this.classes = ast.types.filter(t => !t.isEnum && !t.isInterface).map(x => this.toClass(x, hideAttrs))
        this.enums = ast.types.filter(t => t.isEnum).map(x => this.toEnum(x, hideAttrs))
        
        const sb:string[] = []
        if (this.classes.length) {
            for (const cls of this.classes) {
                sb.push(cls)
                sb.push('')
            }
        }
        if (this.enums.length) {
            for (const cls of this.enums) {
                sb.push(cls)
                sb.push('')
            }
        }
        const cs = sb.join('\n')

        sb.length = 0
        for (const ns of this.namespaces) {
            sb.push(`using ${ns};`)
        }
        sb.push('')

        sb.push(`namespace MyApp.Migrations;`)
        sb.push('')

        sb.push('public class Migration1000 : MigrationBase')
        sb.push('{')
        sb.push('')
        sb.push(indentLines(cs))
        sb.push('')

        const typeDeps : {[name:string]:string[]} = {}
        const tableClasses = ast.types.filter(x => !x.isEnum && !x.isInterface && !x.isAbstract 
            && (!x.genericArgs || x.genericArgs.length === 0)
            && x.properties?.some(x => x.isPrimaryKey))
        for (const type of tableClasses) {
            if (type.properties) {
                for (const prop of type.properties) {
                    if (prop.attributes?.some(x => x.name === 'Reference')) {
                        typeDeps[type.name] = typeDeps[type.name] || []
                        if (prop.genericArgs?.[0]) {
                            typeDeps[type.name].push(...prop.genericArgs)
                        } else {
                            typeDeps[type.name].push(prop.type)
                        }
                    }
                }
            }
        }

        // console.log('typeDeps:', typeDeps)
        const typesWithoutRefs = tableClasses.filter(x => x.properties!
            .every(p => !p.attributes?.some(a => a.name === 'Reference' || a.name === 'References')))
            .map(x => x.name)

        const orderedTypes:string[] = typesWithoutRefs
        Object.keys(typeDeps).forEach(type => addDepTypes(type,orderedTypes))
        function addDepTypes(type:string, orderedTypes:string[]) {
            const deps = typeDeps[type] ?? []
            for (const dep of deps) {
                if (!orderedTypes.includes(dep)) {
                    addDepTypes(dep,orderedTypes)
                    if (!orderedTypes.includes(dep)) {
                        orderedTypes.push(dep)
                    }
                }
            }
        }
        // console.log('orderedTypes:', orderedTypes)
        tableClasses.forEach(type => {
            if (!orderedTypes.includes(type.name)) {
                orderedTypes.push(type.name)
            }
        })

        sb.push('    public override void Up()')
        sb.push('    {')
        for (const typeName of orderedTypes) {
            sb.push(`        Db.CreateTable<${typeName}>();`)
        }
        sb.push('    }')
        sb.push('')
        sb.push('    public override void Down()')
        sb.push('    {')
        for (const typeName of orderedTypes.reverse()) {
            sb.push(`        Db.DropTable<${typeName}>();`)
        }
        sb.push('    }')
        sb.push('}')

        const src = sb.join('\n')
        return { 
            ['MyApp/Migrations/Migration1000.cs']: src
        }
    }
}

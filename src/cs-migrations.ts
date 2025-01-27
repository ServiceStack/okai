import type { MetadataPropertyType, MetadataTypes } from "./types"
import { CSharpGenerator } from "./cs-gen.js"
import { indentLines } from "./utils.js"
import { unwrap } from "./cs-ast.js"

export class CSharpMigrationGenerator extends CSharpGenerator {

    generate(ast: MetadataTypes) : {[name:string]:string} {
        this.namespaces = Array.from(new Set([
            'System.Data',
            'ServiceStack',
            'ServiceStack.DataAnnotations',
            'ServiceStack.OrmLite',
            ...ast.namespaces
        ]))

        const ignoreTables = ['User']

        // props with [Reference] attribute don't need to be included in the migration (ignore to avoid missing references e.g. User)
        const ignoreProp = (prop:MetadataPropertyType) => prop.attributes?.some(x => x.name === 'Reference')
        const hideAttrs = ['description','icon']
        const opt = { hideAttrs, ignoreProp }
        const genTypes = ast.types.filter(t => 
            !t.isEnum && 
            !t.isInterface && 
            !ignoreTables.includes(t.name) && 
            !(t.inherits?.name && ignoreTables.includes(t.inherits.name))
        )
        this.classes = genTypes.map(x => this.toClass(x, opt))
        this.enums = ast.types.filter(t => t.isEnum).map(x => this.toEnum(x, opt))
        
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
            if (type.inherits?.name && ignoreTables.includes(type.inherits.name)) {
                ignoreTables.push(type.inherits.name)
            }
            if (type.properties) {
                for (const prop of type.properties) {
                    if (prop.attributes?.some(x => x.name === 'Reference')) {
                        typeDeps[type.name] = typeDeps[type.name] || []
                        if (prop.genericArgs?.[0]) {
                            typeDeps[type.name].push(...prop.genericArgs.map(unwrap))
                        } else {
                            typeDeps[type.name].push(unwrap(prop.type))
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
                    if (!orderedTypes.includes(dep)) {
                        orderedTypes.push(dep)
                    }
                    addDepTypes(dep,orderedTypes)
                }
            }
        }
        // console.log('orderedTypes:', orderedTypes)
        tableClasses.forEach(type => {
            const typeName = unwrap(type.name)
            if (!orderedTypes.includes(typeName)) {
                orderedTypes.push(typeName)
            }
        })

        sb.push('    public override void Up()')
        sb.push('    {')
        for (const typeName of orderedTypes.filter(x => !ignoreTables.includes(x))) {
            sb.push(`        Db.CreateTable<${typeName}>();`)
        }
        sb.push('    }')
        sb.push('')
        sb.push('    public override void Down()')
        sb.push('    {')
        for (const typeName of orderedTypes.filter(x => !ignoreTables.includes(x)).reverse()) {
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

export function toCSharpMigration(csAst:MetadataTypes) {
    const csFiles = new CSharpMigrationGenerator().generate(csAst)
    const cs = csFiles[Object.keys(csFiles)[0]]
    return cs
}

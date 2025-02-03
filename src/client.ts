import { ParsedClass, ParsedProperty, ParseResult } from "./ts-parser"
import type { GistFile, TableDefinition } from "./types"
import { lastRightPart, toCamelCase, toPascalCase } from "./utils"

export function getFileContent(file:GistFile) {
    return file.content
}

const converter = {
    jsTypeMap: {
        Int64:      'long',
        Int32:      'number',
        Int16:      'short',
        UInt16:     'ushort',
        UInt64:     'ulong',
        Boolean:    'boolean',
        String:     'string',
        'Byte':     'byte',
        'Byte[]':   'Uint8Array',
        'BitArray': 'Uint8Array',
        'Char':     'string',
        'Char[]':   'string',
        Single:     'float',
        Double:     'double',
        Decimal:    'decimal',
        DateTime:   'Date',
        TimeSpan:   'TimeSpan',
        DateOnly:   'DateOnly',
        TimeOnly:   'TimeOnly',
        Guid:       'Guid',
        Xml:        'String',
        Object:     'any',
        DateTimeOffset: 'DateTimeOffset',
        'BigInteger': 'BigInt',
        'Dictionary<string,string>': 'Record<string,string>',
        'IDictionary<string,string>': 'Record<string,string>',
    },
    rules: {
        prefix: {
            date: 'Date',
            time: 'TimeSpan',            
        },
        suffix: {
            'Date': 'Date',
            'Time': 'TimeSpan',
            'Utc':  'DateTimeOffset',
            'At':   'Date',
        }
    }
}
function toJsType(fullType:string) {    
    const type = lastRightPart(fullType, '.')
    let jsType = converter.jsTypeMap[type]
    if (jsType) return jsType

    for (const [k,v] of Object.entries(converter.rules.prefix)) {
        if (type.startsWith(k)) {
            return v
        }
    }
    for (const [k,v] of Object.entries(converter.rules.suffix)) {
        if (type.endsWith(k)) {
            return v
        }
    }
    return type
}

export function convertDefinitionsToAst(definitions:TableDefinition[]) {
    const r:ParseResult = {
        config: {},
        defaultExport: {},
        references: [],
        classes: [],
        interfaces: [],
        enums: []
    }

    for (const def of definitions) {
        const cls:ParsedClass = {
            name: toPascalCase(def.name),
            properties: def.columns.map(x => {
                const ret:ParsedProperty = {
                    name: toCamelCase(x.columnName),
                    type: toJsType(x.dataType),
                    optional: x.allowDBNull,
                }
                if (x.isKey) {
                    if (x.isAutoIncrement) {
                        ret.annotations = [{name:'autoIncrement'}]
                    } else {
                        ret.annotations = [{name:'primaryKey'}]
                    }
                }
                return ret
            }),
        }
        r.classes.push(cls)
    }

    return r
}

import type { GistFile, TableDefinition } from "./types"
import { ParsedClass, ParsedProperty, ParseResult } from "./ts-parser.js"
import { lastRightPart, leftPart, toCamelCase, toPascalCase } from "./utils.js"

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
    // https://www.npgsql.org/doc/types/basic.html
    jsDateTypeMap: {
        'boolean':   'boolean',
        'smallint':  'short',
        'integer':   'number',
        'bigint':    'long',
        'real':      'float',
        'numeric':   'decimal',
        'money':     'decimal',
        'text':      'string',
        'character varying': 'string',
        'character': 'string',
        'citext':    'string',
        'json':      'string',
        'jsonb':     'string',
        'xml':       'string',
        'uuid':      'Guid',
        'bytea':     'Uint8Array',
        'timestamp without time zone': 'Date',
        'timestamp with time zone': 'Date',
        'date':      'Date',
        'time without time zone': 'TimeSpan',
        'time with time zone': 'DateTimeOffset',
        'interval':  'TimeSpan',
        'bit(1)':    'boolean',
        'bit varying': 'Uint8Array',
        'oid':       'uint',
        'xid':       'uint',
        'cid':       'uint',
        'oidvector': 'uint[]',
        'name':      'string',
        'hstore': 'Record<string,string>',
        'double precision': 'double',
    },
    rules: {
        equals: {

        },
        prefix: {
            date: 'Date',
            time: 'TimeSpan',            
        },
        suffix: {
            'Date':      'Date',
            'Time':      'TimeSpan',
            'Utc':       'DateTimeOffset',
            'At':        'Date',
            'Start':     'Date',
            'End':       'Date',
            'Enabled':   'boolean',
            'Confirmed': 'boolean',
        }
    }
}
function toJsType(name:string, fullType:string, dataTypeName:string) {    
    const type = lastRightPart(fullType, '.')
    if (type === 'Array') {
        const dataType = leftPart(dataTypeName, '[')
        const jsType = converter.jsDateTypeMap[dataType]
        return jsType ? jsType + '[]' : 'any[]'
    }

    for (const [k,v] of Object.entries(converter.rules.prefix)) {
        if (name.startsWith(k)) {
            return v
        }
    }
    for (const [k,v] of Object.entries(converter.rules.suffix)) {
        if (name.endsWith(k)) {
            return v
        }
    }
    let jsType = converter.jsTypeMap[type]
    return jsType ?? type
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
        if (!def.name) {
            console.log('Table definition:', JSON.stringify(def, null, 2))
            throw new Error('Table definition must have a name')
        }
        const cls:ParsedClass = {
            name: toPascalCase(def.name),
            properties: def.columns.map(x => {
                const ret:ParsedProperty = {
                    name: toCamelCase(x.columnName),
                    type: toJsType(x.columnName, x.dataType, x.dataTypeName),
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

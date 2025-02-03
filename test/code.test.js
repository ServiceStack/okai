import { describe, it, expect } from 'bun:test'
import dbJson from './db.json'
import { convertDefinitionsToAst } from '../src/client'
import { toTsd } from '../src/tsd-gen'

// return unique data types:
//cat test/db.json | jq '[.[].columns[].dataType] | unique'
// filter out tables:
// cat App_Data/db.json | jq '[.[] | select(.name | IN("CrudEvent", "__EFMigrationsHistory", "Migration") | not)]' > App_Data/db.json

describe('code gen tests', () => {
	it('does parse convert db.json to .d.ts', () => {
        const ast = convertDefinitionsToAst(dbJson)
        const ts = toTsd(ast)
        console.log(ts)
    })
})

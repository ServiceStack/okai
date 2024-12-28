import { toMetadataTypes } from "./cs-ast.js"
import { createTdAstFromAIAst, transformUserRefs } from "./ts-once.js"
import { ParseResult, TypeScriptParser } from "./ts-parser.js"
import { toTsd } from "./tsd-gen.js"
import { ProjectInfo } from "./types.js"
import { getGroupName } from "./utils.js"

// Extract TypeScript source code from a AI Response
export function extractTypeScriptSrc(msg:string) {
    msg = msg.trim()
    const startPos = msg.indexOf("```typescript")
    if (startPos >= 0) {
        const ts = msg.substring(msg.indexOf('\n', startPos) + 1)
        const src = ts.substring(0, ts.indexOf("```"))
        return src
    }
    if (msg.startsWith("//") || msg.startsWith("/*") || msg.startsWith("export ") 
        || msg.startsWith("interface ") || msg.startsWith("class ") || msg.startsWith("type ")) {
        return msg
    }
}

// Parse TypeScript source code into AST
export function toAst(src:string) {
    const parser = new TypeScriptParser();
    return parser.parse(src)
}

// Tranforms that are only applied once on AI TypeScript AST
export function createAstFromAITypeScript(ts:string) {
    const parser = new TypeScriptParser()
    const tdAst = parser.parse(ts)
    return createTdAstFromAIAst(tdAst)
}

// Apply Project Info to the AST once after it's downloaded
export function astForProject(tsAst:ParseResult, info:ProjectInfo) {
    transformUserRefs(tsAst, info)
    return tsAst
}

// Update User TypeScript AST with user modifications
export function generateCsAstFromTsd(userTs:string) {
    const userTsAst = toAst(userTs) // user modified tsd
    const tsd = toTsd(userTsAst)
    const tsdAst = toAst(tsd)
    const csAst = toMetadataTypes(tsdAst)
    const result = {
        tsdAst,
        tsd,
        csAst,
        groupName: getGroupName(csAst)
    }
    return result
}
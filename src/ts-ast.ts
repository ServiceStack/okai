import { TypeScriptParser } from "./ts-parser.js"

export function toTypeScriptSrc(msg:string) {
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

// export function toAst(typescriptSrc:string) {
//     const parsed = parseTypeScriptSource(typescriptSrc)
//     return parsed
// }

// export function toAst(src:string) {
//     const parsed = TypeScriptMultiParser.parse(src)
//     return parsed
// }

export function toAst(src:string) {
    const parser = new TypeScriptParser();
    return parser.parse(src)
}

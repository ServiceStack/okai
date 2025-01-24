import { lastLeftPart, lastRightPart, leftPart, rightPart, trimEnd, trimStart } from "./utils.js"

export interface ParsedConfig {
    prompt?: string
    api?: string 
    migration?: string
    uiMjs?: string
    [key: string]: any
}

export interface ParsedDefaultExport {
    [key: string]: any
}
  
export interface ParsedProperty {
    modifier?: string
    name: string
    type: string
    union?: string[]
    optional?: boolean
    comment?: string
    annotations?: ParsedAnnotation[]
}

export interface ParsedInterface {
    name: string
    extends?: string
    comment?: string
    properties: ParsedProperty[]
    annotations?: ParsedAnnotation[]
}

export interface ParsedClass {
    name: string
    extends?: string
    implements?: string[]
    comment?: string
    properties: ParsedProperty[]
    annotations?: ParsedAnnotation[]
}

export interface ParsedEnumMember {
    name: string
    value?: string | number
    comment?: string
}

export interface ParsedEnum {
    name: string
    comment?: string
    members: ParsedEnumMember[]
}

export interface ParsedAnnotation {
    name: string
    constructorArgs?: any[]
    args?: Record<string, any>
}

export interface ParsedReference {
    path: string;
}

export interface ParseResult {
    config?: ParsedConfig
    defaultExport?: ParsedDefaultExport
    classes: ParsedClass[]
    interfaces: ParsedInterface[]
    enums: ParsedEnum[]
    references: ParsedReference[]
}

export class TypeScriptParser {
    private static readonly CONFIG_TYPE_PATTERN = /export\s+type\s+Config\s*=\s*{([^}]+)}/
    private static readonly CONFIG_PROPERTY_PATTERN = /(\w+)\s*:\s*("[^"]*"|'[^']*')/g
    private static readonly DEFAULT_EXPORT_PATTERN = /export\s+default\s+({[^}]+})/
    private static readonly CLASS_PATTERN = /class\s+(\w+)(?:\s+extends\s+([\w\s<>,]+))?(?:\s+implements\s+([\w\s<>,]+))?\s*{/gm
    private static readonly INTERFACE_PATTERN = /interface\s+(\w+)(?:\s+extends\s+([\w\s<>,]+))?\s*{/gm
    private static readonly ENUM_PATTERN = /enum\s+(\w+)\s*{([^}]*)}/gm
    private static readonly PROPERTY_PATTERN = /(?:(?<modifier>private|public|protected|readonly)\s+)*(?<name>\w+)(?<optional>\?)?\s*:\s*(?<type>[\w<>[\],\s]+)(?<union>\|\s*[\w<>[\],|,\s]+)?\s*;?/
    private static readonly ENUM_MEMBER_PATTERN = /(\w+)\s*(?:=\s*("[^"]*"|'[^']*'|\d+|[^,\n]+))?\s*/
    public static readonly ANNOTATION_PATTERN = /^\s*@([A-Za-z_][A-Za-z0-9_]*\.?[A-Za-z_]?[A-Za-z0-9_]*)/
    public static readonly ANNOTATION_COMMENT = /\)[\s]*\/\/.*$/
    private static readonly REFERENCE_PATTERN = /\/\/\/\s*<reference\s+path="([^"]+)"\s*\/>/g;

    private config?: ParsedConfig
    private defaultExport?: ParsedDefaultExport
    private classes: ParsedClass[] = [];
    private interfaces: ParsedInterface[] = [];
    private enums: ParsedEnum[] = [];
    private references: ParsedReference[] = [];

    private getLineComment(line: string): string | undefined {
        if (line.match(TypeScriptParser.REFERENCE_PATTERN)) {
            return undefined
        }
        if (line.trim().startsWith('@')) {
            if (TypeScriptParser.ANNOTATION_COMMENT.test(line)) {
                return lastRightPart(line, '//')!.trim()
            }
            return undefined
        }
        // Check for single line comment at end of line
        const singleLineMatch = line.match(/.*?\/\/\s*(.+)$/);
        if (singleLineMatch) {
            return singleLineMatch[1].trim()
        }

        // Check for inline multi-line comment
        const multiLineMatch = line.match(/.*?\/\*\s*(.+?)\s*\*\//);
        if (multiLineMatch) {
            return multiLineMatch[1].trim()
        }
        line = line.trim()
        if (line.startsWith('/*') || line.startsWith('*')) {
            return trimStart(trimStart(trimStart(line, '/'),'*'),'/').trim()
        }

        return undefined
    }

    private getPreviousLine(content: string, position: number): string | undefined {
        const beforePosition = content.substring(0, position)
        const lineNumber = beforePosition.split('\n').length
        if (lineNumber > 0) {
            const lines = content.split('\n')
            const ret = lines[lineNumber - 2] // -2 because array is 0-based and we want previous line
            return ret
        }
        return undefined
    }

    private parseConfigType(content: string): void {
        const match = content.match(TypeScriptParser.CONFIG_TYPE_PATTERN)
        if (match) {
            const configBody = match[1]
            const config: ParsedConfig = {}
            
            let propertyMatch
            while ((propertyMatch = TypeScriptParser.CONFIG_PROPERTY_PATTERN.exec(configBody))) {
                const [, key, value] = propertyMatch
                config[key] = value.slice(1, -1) // Remove quotes
            }
            this.config = config
        }
    }
    
    private parseDefaultExport(content: string): void {
        const match = content.match(TypeScriptParser.DEFAULT_EXPORT_PATTERN)
        if (match) {
            try {
                const configStr = match[1]
                const defaultExport : ParsedDefaultExport = {}
                const lines = configStr.split('\n')
                for (const line of lines) {
                    if (line.includes(':')) {
                        const key = leftPart(line, ':')!.trim()
                        const val = trimEnd(rightPart(line, ':')!.trim(), ',')
                        defaultExport[key] = JSON.parse(val)
                    }
                }
                this.defaultExport = defaultExport
            } catch (e) {
                console.warn('Failed to parse default export config:', e)
            }
        }
    }

    parseMetadata(body:string, line:string) {
        const annotations: ParsedAnnotation[] = []
        const commments: string[] = []
        const ANNOTATION = TypeScriptParser.ANNOTATION_PATTERN
        let previousLine = this.getPreviousLine(body, body.lastIndexOf(line))
        while (previousLine && (!previousLine.match(TypeScriptParser.PROPERTY_PATTERN) || previousLine.match(ANNOTATION))) {
            const annotation = previousLine.match(ANNOTATION) ? parseAnnotation(previousLine) : undefined
            if (annotation) {
                annotations.push(annotation)
            } else {
                const comment = this.isComment(previousLine) ? this.getLineComment(previousLine) : null
                if (comment) {
                    commments.unshift(comment)
                }
            }
            previousLine = this.getPreviousLine(body, body.lastIndexOf(previousLine))
        }
        const lineComment = this.getLineComment(line)
        if (lineComment) {
            commments.push(lineComment)
        } else if (line.match(ANNOTATION)) {
            const annotation = parseAnnotation(line)
            if (annotation) {
                annotations.push(annotation)
            }
        }

        const ret = {
            comment: commments.length ? commments.join('\n') : undefined,
            annotations: annotations.length ? annotations : undefined,
        }
        return ret
    }

    private parseClassProperties(classBody: string): ParsedProperty[] {
        const props: ParsedProperty[] = []
        const lines = this.cleanBody(classBody).split('\n')
        lines.forEach((line, index) => {
            if (line.trim().startsWith('//')) return
            if (line.match(TypeScriptParser.ANNOTATION_PATTERN)) return
            const match = line.match(TypeScriptParser.PROPERTY_PATTERN)
            if (match?.groups) {

                const member: ParsedProperty = {
                    name: match.groups.name,
                    type: match.groups.type.trim(),
                }
                if (match.groups.modifier) member.modifier = match.groups.modifier
                if (match.groups.optional === '?') member.optional = true

                // empty for properties with inline objects `salaryRange: {min:number, max:number};`
                if (!member.type) {
                    return
                }

                const union = match.groups.union
                    ? match.groups.union.split('|').filter(x => x.trim()).map((u: string) => u.trim())
                    : undefined
                if (union) {
                    member.union = union
                    if (union.includes('null') || union.includes('undefined')) {
                        member.optional = true
                    }
                }

                let startIndex = index
                for (let i = index - 1; i >= 0; i--) {
                    const prevLine = lines[i].trim()
                    if (this.isComment(prevLine) || this.isAnnotation(prevLine)) {
                        startIndex = i
                    } else {
                        if (prevLine != '') break
                    }
                }

                const propMetadata = startIndex < index ? lines.slice(startIndex, index + 1).join('\n') : line
                // console.log('\npropMetadata <!--', propMetadata, '-->\n')
                const { comment, annotations } = this.parseMetadata(propMetadata, line)
                if (comment) member.comment = comment
                if (annotations) member.annotations = annotations
                // console.log('member', { comment, annotations, line })

                props.push(member)
            }
        })
        return props
    }

    getBlockBody(content: string, startIndex: number): string {
        const bodyStartPos = content.indexOf('{', startIndex)
        // console.log('bodyStartPos', `<|${content.substring(bodyStartPos, bodyStartPos + 20)}|>`)
        // Find the end of the body
        let depth = 0
        let bodyEndPos = bodyStartPos
        for (let i = bodyStartPos; i < content.length; i++) {
            if (content[i] === '{') depth++
            if (content[i] === '}') depth--
            if (depth === 0) {
                bodyEndPos = i + 1
                break
            }
        }

        let body = content.substring(bodyStartPos+1, bodyEndPos - 1)
        return body
    }

    private parseInterfaces(content: string): void {
        let match: RegExpExecArray | null;

        while ((match = TypeScriptParser.INTERFACE_PATTERN.exec(content))) {
            const previousLine = this.getPreviousLine(content, match.index)

            const body = this.getBlockBody(content, match.index)

            const cls: ParsedClass = {
                name: match[1],
                properties: this.parseClassProperties(body),
            }
            if (match[2]) {
                cls.extends = match[2]
            }

            if (previousLine) {
                const { comment, annotations } = this.parseMetadata(content, previousLine)
                if (comment) cls.comment = comment
                if (annotations) cls.annotations = annotations
            }

            this.interfaces.push(cls)
        }
    }

    private parseClasses(content: string): void {
        let match: RegExpExecArray | null;

        while ((match = TypeScriptParser.CLASS_PATTERN.exec(content))) {
            const previousLine = this.getPreviousLine(content, match.index)

            const body = this.getBlockBody(content, match.index)

            const cls: ParsedClass = {
                name: match[1],
                properties: this.parseClassProperties(body),
            }
            const inherits = splitTypes(match[2])
            if (inherits.length) {
                cls.extends = inherits[0]
                if (inherits.length > 1) {
                    cls.implements = inherits.slice(1)
                }
            }
            const impls = splitTypes(match[3])
            if (impls.length) {
                if (!cls.implements) cls.implements = []
                cls.implements.push(...impls)
            }

            if (previousLine) {
                const { comment, annotations } = this.parseMetadata(content.substring(0, match.index), previousLine)
                if (comment) cls.comment = comment
                if (annotations) cls.annotations = annotations
            }

            // console.log('cls', cls.name, previousLine, cls.annotations)
            this.classes.push(cls)
        }
    }

    private parseReferences(content: string): void {
        let match: RegExpExecArray | null;
        while ((match = TypeScriptParser.REFERENCE_PATTERN.exec(content))) {
            this.references.push({ path: match[1] });
        }
    }

    private parseEnumMembers(enumBody: string): ParsedEnumMember[] {
        const members: ParsedEnumMember[] = []
        const lines = enumBody.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.match(/^\s*\/\//))

        let prevIntValue = 0
        lines.forEach((line, index) => {
            const match = line.match(TypeScriptParser.ENUM_MEMBER_PATTERN);
            if (match) {
                const [, name, value] = match;
                const member: ParsedEnumMember = {
                    name: name.trim()
                }

                if (value) {
                    // Remove quotes if present
                    const cleanValue = value.trim().replace(/^["'`]|["'`]$/g, '')
                    member.value = isNaN(Number(cleanValue)) ? cleanValue : Number(cleanValue)
                } else {
                    member.value = prevIntValue
                }
                if (typeof member.value === 'number') {
                    prevIntValue = member.value
                    prevIntValue++
                }

                const previousLine = this.getPreviousLine(enumBody, enumBody.indexOf(line))
                if (previousLine && this.isComment(previousLine)) {
                    member.comment = this.getLineComment(previousLine)
                }
                const lineComment = this.getLineComment(line)
                if (lineComment) {
                    member.comment = member.comment ? member.comment + `\n${lineComment}` : lineComment
                }
                members.push(member)
            }
        })

        return members
    }

    isAnnotation(s?:string) {
        if (!s) return false
        s = s.trim()
        return s.startsWith('@')
    }

    isComment(s?:string) {
        if (!s) return false
        s = s.trim()
        return s.startsWith('//') || s.startsWith('/*') || s.startsWith('*')
    }

    private parseEnums(content: string): void {
        let match: RegExpExecArray | null

        while ((match = TypeScriptParser.ENUM_PATTERN.exec(content))) {
            const previousLine = this.getPreviousLine(content, match.index)
            const { comment, annotations } = this.parseMetadata(content.substring(0, match.index), previousLine)

            this.enums.push({
                name: match[1],
                comment: previousLine ? comment : undefined,
                members: this.parseEnumMembers(match[2])
            })
        }
    }

    private cleanBody(body: string): string {
        return body
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
    }

    public parse(sourceCode: string): ParseResult {
        this.config = undefined
        this.defaultExport = undefined
        this.classes = []
        this.interfaces = []
        this.enums = []

        this.parseConfigType(sourceCode)
        this.parseDefaultExport(sourceCode)
        this.parseReferences(sourceCode);
        this.parseInterfaces(sourceCode)
        this.parseClasses(sourceCode)
        this.parseEnums(sourceCode)

        return {
            config: this.config,
            defaultExport: this.defaultExport,
            references: this.references,
            classes: this.classes,
            interfaces: this.interfaces,
            enums: this.enums
        }
    }
}

export function parseAnnotation(annotation: string) {
    const regex = TypeScriptParser.ANNOTATION_PATTERN
    // search for // after closing parenthesis and remove it
    if (TypeScriptParser.ANNOTATION_COMMENT.test(annotation)) {
        annotation = lastLeftPart(annotation, '//')!
    }
    const match = annotation.match(regex)

    if (!match) return null

    const [, name] = match
    // Extract parameters if they exist
    const paramsStr = annotation.includes('(') && annotation.includes(')') 
        ? lastLeftPart(rightPart(annotation, '('), ')')
        : ''

    try {
        // Handle multiple arguments by splitting on commas outside quotes/braces
        const rawArgs = splitArgs(paramsStr)

        // Parse each argument
        const parsedArgs = rawArgs.map(arg => {
            if (arg.startsWith('{')) {
                // Parse object literals
                return (new Function(`return ${arg}`))()
            } else if (arg.startsWith('"') || arg.startsWith("'") || arg.startsWith("`")) {
                // Parse strings
                return arg.slice(1, -1)
            } else if (!isNaN(parseInt(arg))) {
                // Parse numbers
                return Number(arg)
            }
            return arg
        })

        const lastArg = parsedArgs[parsedArgs.length - 1]
        const args:Record<string,any> = typeof lastArg === 'object'
            ? lastArg
            : undefined
        const constructorArgs:any[] = args ? parsedArgs.slice(0, -1) : parsedArgs
        const to:ParsedAnnotation = { name }
        if (constructorArgs.length) to.constructorArgs = constructorArgs
        if (args) to.args = args
        return to
    } catch (e) {
        return null
    }
}

// Helper to split args while respecting objects/strings
function splitArgs(str: string) {
    const args = []
    let current = ''
    let depth = 0
    let inQuotes = false
    let quoteChar = ''

    for (let char of str) {
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true
            quoteChar = char
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false
        } else if (char === '{') depth++
        else if (char === '}') depth--
        else if (char === ',' && depth === 0 && !inQuotes) {
            args.push(current.trim())
            current = ''
            continue
        }
        current += char
    }
    if (current.trim()) args.push(current.trim())
    return args
}

export function splitTypes(input: string): string[] {
    const result: string[] = []
    let currentToken = ''
    let angleBracketCount = 0
    
    // Trim and handle empty input
    input = input?.trim()
    if (!input) return []
    
    // Process each character
    for (let char of input) {
        if (char === '<') {
            angleBracketCount++
            currentToken += char;
        } else if (char === '>') {
            angleBracketCount--
            currentToken += char
        } else if (char === ',' && angleBracketCount === 0) {
            // Only split on commas when we're not inside angle brackets
            if (currentToken.trim()) {
                result.push(currentToken.trim())
            }
            currentToken = ''
        } else {
            currentToken += char;
        }
    }
    
    // Add the last token if it exists
    if (currentToken.trim()) {
        result.push(currentToken.trim())
    }
    
    return result
}
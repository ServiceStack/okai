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

export interface ParseResult {
    classes: ParsedClass[]
    interfaces: ParsedInterface[]
    enums: ParsedEnum[]
}

export class TypeScriptParser {
    private static readonly CLASS_PATTERN = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g
    private static readonly INTERFACE_PATTERN = /interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g
    private static readonly ENUM_PATTERN = /enum\s+(\w+)\s*{([^}]*)}/g
    private static readonly PROPERTY_PATTERN = /(?:(?<modifier>private|public|protected|readonly)\s+)*(?<name>\w+)(?<optional>\?)?\s*:\s*(?<type>[\w<>[\],\s]+)(?<union>\|\s*[\w<>[\],|,\s]+)?\s*;?/
    private static readonly ENUM_MEMBER_PATTERN = /(\w+)\s*(?:=\s*("[^"]*"|'[^']*'|\d+|[^,\n]+))?\s*/
    private static readonly ANNOTATION_PATTERN = /@\w+\(.*\)/

    private classes: ParsedClass[] = [];
    private interfaces: ParsedInterface[] = [];
    private enums: ParsedEnum[] = [];

    private getLineComment(line: string): string | undefined {
        // Check for single line comment at end of line
        const singleLineMatch = line.match(/.*?\/\/\s*(.+)$/);
        if (singleLineMatch) {
            return singleLineMatch[1].trim();
        }

        // Check for inline multi-line comment
        const multiLineMatch = line.match(/.*?\/\*\s*(.+?)\s*\*\//);
        if (multiLineMatch) {
            return multiLineMatch[1].trim();
        }

        return undefined;
    }

    private getPreviousLine(content: string, position: number): string | undefined {
        const beforePosition = content.substring(0, position)
        const lineNumber = beforePosition.split('\n').length
        if (lineNumber > 1) {
            const lines = content.split('\n')
            return lines[lineNumber - 2] // -2 because array is 0-based and we want previous line
        }
        return undefined
    }

    parseMetadata(body:string, line:string) {
        const annotations: ParsedAnnotation[] = []
        const commments: string[] = []
        const ANNOTATION = TypeScriptParser.ANNOTATION_PATTERN
        let previousLine = this.getPreviousLine(body, body.indexOf(line))
        while (previousLine && (!previousLine.match(TypeScriptParser.PROPERTY_PATTERN) || previousLine.match(ANNOTATION))) {
            const annotation = previousLine.match(ANNOTATION) ? parseAnnotation(previousLine) : undefined
            if (annotation) {
                annotations.push(annotation)
            } else {
                const comment = this.getLineComment(previousLine)
                if (comment) {
                    const annotation = comment.match(ANNOTATION) ? parseAnnotation(comment) : undefined
                    if (annotation) {
                        annotations.push(annotation)
                    } else {
                        commments.unshift(comment)
                    }
                }
            }
            previousLine = this.getPreviousLine(body, body.indexOf(previousLine))
        }
        const lineComment = this.getLineComment(line)
        if (lineComment) {
            const annotation = lineComment.match(ANNOTATION) ? parseAnnotation(lineComment) : undefined
            if (annotation) {
                annotations.push(annotation)
            } else {
                commments.push(lineComment)
            }
        }

        return {
            comment: commments.length ? commments.join('\n') : undefined,
            annotations: annotations.length ? annotations : undefined,
        }
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

                const { comment, annotations } = this.parseMetadata(classBody, line)
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
                extends: match[2],
                properties: this.parseClassProperties(body),
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
                extends: match[2],
                implements: match[3]?.split(',').map(i => i.trim()),
                properties: this.parseClassProperties(body),
            }

            if (previousLine) {
                const { comment, annotations } = this.parseMetadata(content, previousLine)
                if (comment) cls.comment = comment
                if (annotations) cls.annotations = annotations
            }

            this.classes.push(cls)
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
                    const cleanValue = value.trim().replace(/^["']|["']$/g, '')
                    member.value = isNaN(Number(cleanValue)) ? cleanValue : Number(cleanValue)
                } else {
                    member.value = prevIntValue + 1
                }
                if (typeof member.value === 'number') {
                    prevIntValue = member.value
                }

                const previousLine = this.getPreviousLine(enumBody, enumBody.indexOf(line))
                if (previousLine) {
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

    private parseEnums(content: string): void {
        let match: RegExpExecArray | null

        while ((match = TypeScriptParser.ENUM_PATTERN.exec(content))) {
            const previousLine = this.getPreviousLine(content, match.index)
            this.enums.push({
                name: match[1],
                comment: previousLine ? this.getLineComment(previousLine) : undefined,
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
        this.classes = []
        this.interfaces = []
        this.enums = []

        this.parseInterfaces(sourceCode)
        this.parseClasses(sourceCode)
        this.parseEnums(sourceCode)

        return {
            classes: this.classes,
            interfaces: this.interfaces,
            enums: this.enums
        }
    }
}

export function parseAnnotation(annotation: string) {
    // Match @name and everything inside ()
    const regex = /@(\w+)\s*\((.*)\)/
    const match = annotation.match(regex)

    if (!match) return null

    const [, name, paramsStr] = match

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

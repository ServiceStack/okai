export interface ParsedProperty {
    modifier: string;
    name: string;
    type: string;
    union?: string[];
    optional?: boolean;
    comment?: string;
}

export interface ParsedInterface {
    name: string;
    extends?: string;
    comment?: string;
    properties: ParsedProperty[];
}

export interface ParsedClass {
    name: string;
    extends?: string;
    implements?: string[];
    comment?: string;
    properties: ParsedProperty[];
}

export interface ParsedEnumMember {
    name: string;
    value?: string | number;
    comment?: string;
}

export interface ParsedEnum {
    name: string;
    comment?: string;
    members: ParsedEnumMember[];
}

export interface ParseResult {
    classes: ParsedClass[];
    interfaces: ParsedInterface[];
    enums: ParsedEnum[];
}

export class TypeScriptParser {
    private static readonly CLASS_PATTERN = /class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{([^}]*)}/g;
    private static readonly INTERFACE_PATTERN = /interface\s+(\w+)(?:\s+extends\s+(\w+))?\s*{([^}]*)}/g;
    private static readonly ENUM_PATTERN = /enum\s+(\w+)\s*{([^}]*)}/g;
    private static readonly PROPERTY_PATTERN = /(?:(?<modifier>private|public|protected|readonly)\s+)*(?<name>\w+)(?<optional>\?)?\s*:\s*(?<type>[\w<>[\],\s]+)(?<union>\|\s*[\w<>[\],|,\s]+)?\s*;?/;
    private static readonly ENUM_MEMBER_PATTERN = /(\w+)\s*(?:=\s*("[^"]*"|'[^']*'|\d+|[^,\n]+))?\s*/;

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
        const beforePosition = content.substring(0, position);
        const lineNumber = beforePosition.split('\n').length;
        if (lineNumber > 1) {
            const lines = content.split('\n');
            return lines[lineNumber - 2]; // -2 because array is 0-based and we want previous line
        }
        return undefined;
    }

    private parseClassProperties(classBody: string): ParsedProperty[] {
        const props: ParsedProperty[] = []
        const lines = this.cleanBody(classBody).split('\n')
        lines.forEach((line, index) => {
            const match = line.match(TypeScriptParser.PROPERTY_PATTERN);
            if (match?.groups) {

                const member: ParsedProperty = {
                    modifier: match.groups.modifier,
                    name: match.groups.name,
                    type: match.groups.type.trim(),
                    optional: match.groups.optional === '?' || undefined,
                }
                // empty for properties with inline objects `salaryRange: {min:number, max:number};`
                if (!member.type) {
                    return
                }

                const union = match.groups.union
                    ? match.groups.union.split('|').filter(x => x.trim()).map((u:string) => u.trim())
                    : undefined
                if (union) {
                    member.union = union
                    if (union.includes('null') || union.includes('undefined')) {
                        member.optional = true
                    }
                }

                const commments: string[] = []
                let previousLine = this.getPreviousLine(classBody, classBody.indexOf(line))
                while (previousLine && !previousLine.match(TypeScriptParser.PROPERTY_PATTERN)) {
                    const comment = this.getLineComment(previousLine)
                    if (comment) commments.unshift(comment)
                    previousLine = this.getPreviousLine(classBody, classBody.indexOf(previousLine))
                }
                const lineComment = this.getLineComment(line)
                if (lineComment) {
                    commments.push(lineComment)
                }
                if (commments.length) {
                    member.comment = commments.join('\n')
                }

                props.push(member)
            }
        })
        return props
    }

    private parseInterfaces(content: string): void {
        let match: RegExpExecArray | null;
        
        while ((match = TypeScriptParser.INTERFACE_PATTERN.exec(content))) {
            const previousLine = this.getPreviousLine(content, match.index)
            
            this.interfaces.push({
                name: match[1],
                extends: match[2],
                comment: previousLine ? this.getLineComment(previousLine) : undefined,
                properties: this.parseClassProperties(match[3])
            });
        }
    }

    private parseClasses(content: string): void {
        let match: RegExpExecArray | null;
        
        while ((match = TypeScriptParser.CLASS_PATTERN.exec(content))) {
            const previousLine = this.getPreviousLine(content, match.index)

            this.classes.push({
                name: match[1],
                extends: match[2],
                implements: match[3]?.split(',').map(i => i.trim()),
                comment: previousLine ? this.getLineComment(previousLine) : undefined,
                properties: this.parseClassProperties(match[4]),
            });
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
                members.push(member);
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

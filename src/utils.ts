import type { MetadataType, MetadataTypes, TsdHeader } from "./types"

export function plural(word: string, amount?: number): string {
    if (amount !== undefined && amount === 1) {
        return word
    }
    const plural: { [key: string]: string } = {
        '(quiz)$'               : "$1zes",
        '^(ox)$'                : "$1en",
        '([m|l])ouse$'          : "$1ice",
        '(matr|vert|ind)ix|ex$' : "$1ices",
        '(x|ch|ss|sh)$'         : "$1es",
        '([^aeiouy]|qu)y$'      : "$1ies",
        '(hive)$'               : "$1s",
        '(?:([^f])fe|([lr])f)$' : "$1$2ves",
        '(shea|lea|loa|thie)f$' : "$1ves",
        'sis$'                  : "ses",
        '([ti])um$'             : "$1a",
        '(tomat|potat|ech|her|vet)o$': "$1oes",
        '(bu)s$'                : "$1ses",
        '(alias)$'              : "$1es",
        '(octop)us$'            : "$1i",
        '(ax|test)is$'          : "$1es",
        '(us)$'                 : "$1es",
        '([^s]+)$'              : "$1s"
    }
    const irregular: { [key: string]: string } = {
        'move'   : 'moves',
        'foot'   : 'feet',
        'goose'  : 'geese',
        'sex'    : 'sexes',
        'child'  : 'children',
        'man'    : 'men',
        'tooth'  : 'teeth',
        'person' : 'people'
    }
    const uncountable: string[] = [
        'sheep',
        'fish',
        'deer',
        'moose',
        'series',
        'species',
        'money',
        'rice',
        'information',
        'equipment',
        'bison',
        'cod',
        'offspring',
        'pike',
        'salmon',
        'shrimp',
        'swine',
        'trout',
        'aircraft',
        'hovercraft',
        'spacecraft',
        'sugar',
        'tuna',
        'you',
        'wood'
    ]
    // save some time in the case that singular and plural are the same
    if (uncountable.indexOf(word.toLowerCase()) >= 0) {
        return word
    }
    // check for irregular forms
    for (const w in irregular) {
        const pattern = new RegExp(`${w}$`, 'i')
        const replace = irregular[w]
        if (pattern.test(word)) {
            return word.replace(pattern, replace)
        }
    }
    // check for matches using regular expressions
    for (const reg in plural) {
        const pattern = new RegExp(reg, 'i')
        if (pattern.test(word)) {
            return word.replace(pattern, plural[reg])
        }
    }
    return word
}

export function indentLines(src:string, indent:string='    ') {
    return src.split('\n').map(x => indent + x).join('\n')
}

export function requestKey(date:Date): string {
    return `requests/${timestampKey(date)}`
}
export function acceptedKey(date:Date): string {
    return `accepted/${timestampKey(date)}`
}
export function chatKey(date:Date): string {
    return `chat/${timestampKey(date)}`
}

export function timestampKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const timestamp = date.valueOf()
    return `${year}/${month}/${day}/${timestamp}`
}

export function trimStart(str:string, chars = ' ') {
    const cleanStr = String(str)
    const charsToTrim = new Set(chars)
    let start = 0
    while (start < cleanStr.length && charsToTrim.has(cleanStr[start])) {
      start++
    }
    return cleanStr.slice(start)
}

export function leftPart(s:string, needle:string) {
    if (s == null) return null
    let pos = s.indexOf(needle)
    return pos == -1
        ? s
        : s.substring(0, pos)
}

export function rightPart(s:string, needle:string) {
    if (s == null) return null
    let pos = s.indexOf(needle)
    return pos == -1
        ? s
        : s.substring(pos + needle.length)
}

export function lastLeftPart(s:string, needle:string) {
    if (s == null) return null
    let pos = s.lastIndexOf(needle)
    return pos == -1
        ? s
        : s.substring(0, pos)
}
export function lastRightPart(s:string, needle:string) {
    if (s == null) return null
    let pos = s.lastIndexOf(needle)
    return pos == -1
        ? s
        : s.substring(pos + needle.length)
}

export function splitCase(t: string) {
    return typeof t != 'string' ? t : t.replace(/([A-Z]|[0-9]+)/g, ' $1').replace(/_/g, ' ').trim()
}

export function pick(o:any, keys:string[]) {
    const to = {}
    Object.keys(o).forEach(k => {
        if (keys.indexOf(k) >= 0) {
            to[k] = o[k]
        }
    })
    return to
}

export function appendQueryString(url: string, args: any): string {
    for (let k in args) {
        if (args.hasOwnProperty(k)) {
            let val = args[k]
            if (typeof val == 'undefined' || typeof val == 'function' || typeof val == 'symbol') continue
            url += url.indexOf("?") >= 0 ? "&" : "?"
            url += k + (val === null ? '' :  "=" + qsValue(val))
        }
    }
    return url
}
function qsValue(arg: any) {
    if (arg == null)
        return ""
    return encodeURIComponent(arg) || ""
}

export function trimEnd(s: string, c: string) {
    let end = s.length
    while (end > 0 && s[end - 1] === c) {
        --end
    }
    return (end < s.length) ? s.substring(0, end) : s
}

export function refCount(t:MetadataType) {
    return t.properties?.filter(
        x => x.attributes?.some(x => x.name === 'References')).length || 0
}

export function getGroupName(ast:MetadataTypes) {
    let types = ast.types.filter(x => !x.isEnum)
    if (types.length == 0) types = ast.operations.map(x => x.request)
    if (types.length == 0) return null
    return plural(types.sort((x,y) => refCount(y) - refCount(x))[0].name)
}

export function toPascalCase(s?: string) {
    if (!s) return ''
    const isAllCaps = s.match(/^[A-Z0-9_]+$/)
    if (isAllCaps) {
        const words = s.split('_')
        return words.map(x => x[0].toUpperCase() + x.substring(1).toLowerCase()).join('')
    }
    if (s.includes('_')) {
        return s.split('_').filter(x => x[0]).map(x => x[0].toUpperCase() + x.substring(1)).join('')
    }
    return s.charAt(0).toUpperCase() + s.substring(1)
}

export function toCamelCase(s?: string) {
    s = toPascalCase(s)
    if (!s) return ''
    return s.charAt(0).toLowerCase() + s.substring(1)
}

export function camelToKebabCase(str: string): string {
    if (!str || str.length <= 1) return str.toLowerCase();
    // Insert hyphen before capitals and numbers, convert to lowercase
    return str
        .replace(/([A-Z0-9])/g, '-$1')
        .toLowerCase()
        // Remove leading hyphen if exists
        .replace(/^-/, '')
        // Replace multiple hyphens with single hyphen
        .replace(/-+/g, '-');
}

export function replaceMyApp(input: string, projectName: string) {
    const condensed = projectName.replace(/_/g, '')
    const kebabCase = camelToKebabCase(condensed)
    return input
        .replace(/My_App/g, projectName)
        .replace(/MyApp/g, projectName)
        .replace(/My App/g, splitCase(condensed))
        .replace(/my-app/g, kebabCase)
        .replace(/myapp/g, condensed.toLowerCase())
        .replace(/my_app/g, projectName.toLowerCase())
}

export type ErrorResponseType = null | "RefreshTokenException"
export class ResponseStatus {
    public constructor(init?:Partial<ResponseStatus>) { Object.assign(this, init) }
    errorCode?: string
    message?: string
    stackTrace?: string
    errors?: ResponseError[]
    meta?: { [index: string]: string }
}
export class ResponseError {
    public constructor(init?:Partial<ResponseError>) { Object.assign(this, init) }
    errorCode?: string
    fieldName?: string
    message?: string
    meta?: { [index: string]: string }
}
export class ErrorResponse {
    public constructor(init?:Partial<ErrorResponse>) { Object.assign(this, init) }
    type?: ErrorResponseType
    responseStatus?: ResponseStatus
}
export function createError(errorCode:string, message:string, fieldName?:string) {
    return new ErrorResponse({ 
        responseStatus: new ResponseStatus({
            errorCode,
            message,
            errors: fieldName ? [new ResponseError({ errorCode, message, fieldName })] : undefined
        })
    })
}

export function isBinary(contentType:string) {
    return contentType && !contentType.endsWith('+xml') &&
        (contentType.startsWith('image/')
        || contentType.startsWith('video/')
        || contentType.startsWith('audio/')
        || contentType.endsWith('octet-stream')
        || contentType.endsWith('compressed'))
}

export function withAliases(icons:{[name:string]:string}, aliases:{[name:string]:string[]}):{[name:string]:string} {
    const result:{[name:string]:string} = {}
    Object.keys(icons).forEach(name => {
        result[name.toLowerCase()] = icons[name].replaceAll('"',`'`)
    })
    Object.keys(aliases).forEach(name => {
        for (const alias of aliases[name]) {
            result[alias.toLowerCase()] = icons[name].replaceAll('"',`'`)
        }
    })
    return result
}

export function isCloudflareWorker(): boolean {
    // Use a safe approach that works at both build and runtime
    
    // Check for Worker-specific globals without directly referencing types
    // that would cause build errors
    const hasWorkerAPIs = 
      typeof self !== 'undefined' && 
      typeof caches !== 'undefined' && 
      typeof addEventListener !== 'undefined' &&
      'fetch' in self;
      
    // Check for Node-specific features safely
    const hasNodeFeatures = (): boolean => {
      try {
        // Check for global object without direct reference
        return typeof globalThis !== 'undefined' && 
          // Check for process without direct reference that would error in CF
          !!(globalThis as any).process;
      } catch {
        return false;
      }
    };
    
    // Check for service worker context safely
    const isServiceWorkerContext = (): boolean => {
      try {
        return typeof self !== 'undefined' && 
          self.constructor.name === 'ServiceWorkerGlobalScope';
      } catch {
        return false;
      }
    };
    
    // Return true if we have Worker indicators and don't have Node indicators
    return hasWorkerAPIs && isServiceWorkerContext() && !hasNodeFeatures();
}

export function parseJsObject(js: string) {
    if (isCloudflareWorker()) {
        return safeJsObject(js)
    }
    // Parse object literals
    try {
        return (new Function(`return ${js}`))()
    } catch (e) {
        // Cloudflare workers don't support eval or new Function
        return safeJsObject(js)
    }
}

export function safeJsObject(jsStr: string) {
    let result = ''
    let i = 0

    // State tracking
    let inString = false
    let quoteType = null // ' or "
    let depth = 0

    const peek = (n = 1) => i + n < jsStr.length ? jsStr[i + n] : ''

    while (i < jsStr.length) {
        const char = jsStr[i]
        const nextChar = peek()
        const prevChar = i > 0 ? jsStr[i - 1] : ''

        // Handle string boundaries
        if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inString) {
                // Starting a string
                inString = true
                quoteType = char
                result += '"' // Always use double quotes for JSON
            } else if (char === quoteType) {
                // Ending a string
                inString = false
                quoteType = null
                result += '"'
            } else {
                // A quote character inside a string of a different type
                result += char;
            }
            i++
            continue
        }

        // Handle escaped characters in strings
        if (inString && char === '\\') {
            if (nextChar === quoteType) {
                // Convert escaped quote to JSON format
                result += '\\"'
                i += 2
                continue
            } else {
                // Pass through other escape sequences
                result += char
                i++
                continue
            }
        }

        // When not in a string, handle object/array syntax
        if (!inString) {
            // Track nesting depth
            if (char === '{' || char === '[') {
                depth++
                result += char
                i++
                continue
            } else if (char === '}' || char === ']') {
                depth--
                result += char
                i++
                continue
            }

            // Handle property keys - match unquoted keys followed by colon
            if (depth > 0 && /[a-zA-Z0-9_$]/.test(char)) {
                let keyBuffer = ''
                let j = i

                // Collect the potential key name
                while (j < jsStr.length && /[a-zA-Z0-9_$]/.test(jsStr[j])) {
                    keyBuffer += jsStr[j]
                    j++
                }

                // Skip whitespace
                let k = j
                while (k < jsStr.length && /\s/.test(jsStr[k])) k++

                // If followed by a colon, it's a property key
                if (k < jsStr.length && jsStr[k] === ':') {
                    result += `"${keyBuffer}"`; // Add quoted key to result
                    i = k; // Move to the colon position
                    continue
                }
            }
        }

        // Default: add character to result
        result += char
        i++
    }

    // Validate and return
    try {
        return JSON.parse(result)
    } catch (e) {
        throw new Error(`Failed to produce valid JSON: ${e.message}`)
    }
}

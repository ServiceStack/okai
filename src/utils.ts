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
        return s.split('_').map(x => x[0].toUpperCase() + x.substring(1)).join('')
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
import { leftPart } from "./utils"

export type TsdHeader = {
    prompt: string
    api: string
    migration?: string
}

export function parseTsdHeader(tsd:string): TsdHeader | null {
    const header = tsd.includes('/*prompt:')
        ? leftPart(tsd, '*/').replace('/*prompt:','').trim()
        : null
    if (!header) return null

    const lines = header.split('\n')
    const to:TsdHeader = { prompt:'', api:'' }
    for (const line of lines) {
        if (line.startsWith('api:')) {
            to.api = line.replace('api:','').trim()
        } else if (line.startsWith('migration:')) {
            to.migration = line.replace('migration:','').trim()
        } else if (!to.api && !to.migration && line.trim()) {
            to.prompt += line.trim() + '\n'
        }
    }
    if (!to.api) return null
    to.prompt = to.prompt.trim()
    to.api = to.api.trim()
    if (to.migration) to.migration = to.migration.trim()
    return to
}

export function toTsdHeader(header:TsdHeader): string {
    const sb = [
        `/*prompt:  ${header.prompt}`,
        `api:       ${header.api}`,        
    ]
    if (header.migration) {
        sb.push(`migration: ${header.migration}`)
    }
    sb.push('*/')
    return sb.join('\n')
}


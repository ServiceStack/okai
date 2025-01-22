import { splitCase } from "./utils.js"

export function getIcon(type:string):string {
    const words = splitCase(type).split(' ')
    const candidates = generateCombinations(words).map(x => x.toLowerCase())

    type = type.toLowerCase()
    if (Icons[type]) {
        return Icons[type]
    }
    for (const word of candidates) {
        if (Icons[word]) {
            return Icons[word]
        }
        if (word.endsWith('s')) {
            const singular = word.substring(0, word.length - 1)
            if (Icons[singular]) {
                return Icons[singular]
            }
        }
    }
    for (const word of candidates) {
        for (const key of IconKeys) {
            if (word.indexOf(key) >= 0) {
                return Icons[key]
            }
        }
    }
    return null
}

export function generateCombinations(words:string[]) {
    const result = []
    for (let i = 0; i < words.length; i++) {
      // Join the last words.length-i elements
      const combination = words.slice(-(i + 1)).join('')
      result.push(combination)
    }
    const ret = result.reverse()
    words.reverse().forEach((word, i) => {
        if (!ret.includes(word)) {
            ret.push(word)
        }
    })
    return ret
}

function withAliases(icons:{[name:string]:string}, aliases:{[name:string]:string[]}):{[name:string]:string} {
    const result:{[name:string]:string} = {}
    Object.keys(icons).forEach(name => {
        result[name.toLowerCase()] = icons[name]
    })
    Object.keys(aliases).forEach(name => {
        for (const alias of aliases[name]) {
            result[alias.toLowerCase()] = icons[name]
        }
    })
    return result
}

const P = `<svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' `
function S(viewbox:string, body:string) {
    return P + `viewBox='${viewbox}'>${body}</svg>`
}
export const IconMap = {
    /** Users */
    User:     S(`0 0 24 24`,`<path fill='currentColor' d='M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4'/>`),
    Contact:  S(`0 0 16 16`,`<path fill='currentColor' d='M5 3a3 3 0 1 1 6 0a3 3 0 0 1-6 0zm7.001 4h-.553l-3.111 6.316L9.5 7.5L8 6L6.5 7.5l1.163 5.816L4.552 7h-.554c-1.999 0-1.999 1.344-1.999 3v5h12v-5c0-1.656 0-3-1.999-3z'/>`),
    Guest:    S(`0 0 16 16`,`<path fill='currentColor' d='M8 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6m4.735 6c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139z'/>`),
    Anon:     S(`0 0 24 24`,`<path fill='currentColor' d='M12 2a5 5 0 1 0 5 5a5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3a3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z'/>`),
    Team:     S('0 0 16 16','<path fill="currentColor" d="M6.002 4a1.998 1.998 0 1 1 3.996 0a1.998 1.998 0 0 1-3.996 0M8 3.002a.998.998 0 1 0 0 1.996a.998.998 0 0 0 0-1.996M11 4.5a1.5 1.5 0 1 1 3 0a1.5 1.5 0 0 1-3 0m1.5-.5a.5.5 0 1 0 0 1a.5.5 0 0 0 0-1m-9-1a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M3 4.5a.5.5 0 1 1 1 0a.5.5 0 0 1-1 0M4.268 7A2 2 0 0 0 4 8H2v2.5a1.5 1.5 0 0 0 2.096 1.377c.074.331.19.647.34.942A2.5 2.5 0 0 1 1 10.5V8a1 1 0 0 1 1-1zm7.296 5.819A2.5 2.5 0 0 0 15 10.5V8a1 1 0 0 0-1-1h-2.268c.17.294.268.635.268 1h2v2.5a1.5 1.5 0 0 1-2.096 1.377q-.114.498-.34.942M6 6.999a1 1 0 0 0-1 1V11a3 3 0 0 0 6 0V8a1 1 0 0 0-1-1zm0 1h4V11a2 2 0 0 1-4 0z"/>'),
    Signup:   S(`0 0 16 16`,`<g fill='currentColor'><path fill-rule='evenodd' d='M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z'/><path d='M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z'/><path d='M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z'/></g>`),
    Company:  S(`0 0 24 24`,`<path fill='currentColor' d='M18 15h-2v2h2m0-6h-2v2h2m2 6h-8v-2h2v-2h-2v-2h2v-2h-2V9h8M10 7H8V5h2m0 6H8V9h2m0 6H8v-2h2m0 6H8v-2h2M6 7H4V5h2m0 6H4V9h2m0 6H4v-2h2m0 6H4v-2h2m6-10V3H2v18h20V7z'/>`),
    Location: S(`0 0 24 24`,`<path fill='currentColor' d='M12 6.5A2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 9.5 9A2.5 2.5 0 0 1 12 6.5M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 1 0 3 5 9.71C17 12 17 10 17 9a5 5 0 0 0-5-5'/>`),
    Member:   S('0 0 256 256','<path fill="currentColor" d="M200 136H56.46A72.08 72.08 0 0 0 128 200h72a8 8 0 0 1 0 16h-72a88 88 0 0 1 0-176h72a8 8 0 0 1 0 16h-72a72.08 72.08 0 0 0-71.54 64H200a8 8 0 0 1 0 16"/>'),

    /** Admin */
    Dashboard: P + `viewBox='0 0 24 24' fill='none' stroke-width='1.5' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' /></svg>`,
    Stats:     S(`0 0 24 24`,`<path fill='currentColor' d='M8.143 15.857H5.57V9.43h2.572v6.428zm5.143 0h-2.572V3h2.572v12.857zm5.142 0h-2.571v-9h2.571v9z'/><path fill='currentColor' fill-rule='evenodd' d='M21 20.714H3v-2h18v2z' clip-rule='evenodd'/>`),
    Logs:      S(`0 0 24 24`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 12h8m-8 6h8M13 6h8M3 12h1m-1 6h1M3 6h1m4 6h1m-1 6h1M8 6h1'/>`),
    Project:   S(`0 0 24 24`,`<circle cx="12" cy="6" r="1" fill="currentColor"/><path fill="currentColor" d="M6 17h12v2H6zm4-5.17l2.792 2.794l3.932-3.935L18 12V8h-4l1.31 1.275l-2.519 2.519L10 9l-4 4l1.414 1.414z"/><path fill="currentColor" d="M19 3h-3.298a5 5 0 0 0-.32-.425l-.01-.012a4.43 4.43 0 0 0-2.89-1.518a2.6 2.6 0 0 0-.964 0a4.43 4.43 0 0 0-2.89 1.518l-.01.012a5 5 0 0 0-.32.424V3H5a3.003 3.003 0 0 0-3 3v14a3.003 3.003 0 0 0 3 3h14a3.003 3.003 0 0 0 3-3V6a3.003 3.003 0 0 0-3-3m1 17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4.55a2.5 2.5 0 0 1 4.9 0H19a1 1 0 0 1 1 1Z"/>`),
    Task:      S(`0 0 32 32`,`<path fill='currentColor' d='M10.293 5.293L7 8.586L5.707 7.293L4.293 8.707L7 11.414l4.707-4.707zM14 7v2h14V7zm0 8v2h14v-2zm0 8v2h14v-2z'/>`),

    /** Security */
    Padlock: S(`0 0 512 512`,`<path fill='#B1B4B5' d='M376.749 349.097c-13.531 0-24.5-10.969-24.5-24.5V181.932c0-48.083-39.119-87.203-87.203-87.203-48.083 0-87.203 39.119-87.203 87.203v82.977c0 13.531-10.969 24.5-24.5 24.5s-24.5-10.969-24.5-24.5v-82.977c0-75.103 61.1-136.203 136.203-136.203s136.203 61.1 136.203 136.203v142.665c0 13.531-10.969 24.5-24.5 24.5z'/><path fill='#FFB636' d='M414.115 497.459H115.977c-27.835 0-50.4-22.565-50.4-50.4V274.691c0-27.835 22.565-50.4 50.4-50.4h298.138c27.835 0 50.4 22.565 50.4 50.4v172.367c0 27.836-22.565 50.401-50.4 50.401z'/><path fill='#FFD469' d='M109.311 456.841h-2.525c-7.953 0-14.4-6.447-14.4-14.4V279.309c0-7.953 6.447-14.4 14.4-14.4h2.525c7.953 0 14.4 6.447 14.4 14.4v163.132c0 7.953-6.447 14.4-14.4 14.4z'/>`),

    /** Bookings */
    Booking: S(`0 0 24 24`,`<path fill='currentColor' d='M16 10H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1zm3-7h-1V2c0-.55-.45-1-1-1s-1 .45-1 1v1H8V2c0-.55-.45-1-1-1s-1 .45-1 1v1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V8h14v10c0 .55-.45 1-1 1zm-5-5H8c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1s-.45-1-1-1z'/>`),
    Coupon:  S(`0 0 24 24`,`<path fill='currentColor' d='M2 9.5V4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5.5a2.5 2.5 0 1 0 0 5V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5.5a2.5 2.5 0 1 0 0-5zm2-1.532a4.5 4.5 0 0 1 0 8.064V19h16v-2.968a4.5 4.5 0 0 1 0-8.064V5H4v2.968zM9 9h6v2H9V9zm0 4h6v2H9v-2z' />`),
    Hotel:   S(`0 0 24 24`,`<path fill='currentColor' d='M22 21H2v-2h1V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5h2v10h1zm-5-2h2v-8h-6v8h2v-6h2zm0-10V5H5v14h6V9zM7 11h2v2H7zm0 4h2v2H7zm0-8h2v2H7z'/>`),
    Room:    S(`0 0 24 24`,`<path fill='currentColor' d='M14 6v15H3v-2h2V3h9v1h5v15h2v2h-4V6zm-4 5v2h2v-2z'/>`),
    Time:    S(`0 0 24 24`,`<path fill='currentColor' d='M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m1-8h4v2h-6V7h2z'/>`),
    Feature: S(`0 0 24 24`,`<path fill='currentColor' d='m8.58 17.25l.92-3.89l-3-2.58l3.95-.37L12 6.8l1.55 3.65l3.95.33l-3 2.58l.92 3.89L12 15.19zM12 2a10 10 0 0 1 10 10a10 10 0 0 1-10 10A10 10 0 0 1 2 12A10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8a8 8 0 0 0 8 8a8 8 0 0 0 8-8a8 8 0 0 0-8-8'/>`),
    Enroll:  S(`0 0 14 14`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6.35.5h6.302c.469 0 .849.38.849.849v6.778c0 .47-.38.85-.849.85H7.5M3.149 4.001a1.75 1.75 0 1 0 0-3.501a1.75 1.75 0 0 0 0 3.501"/><path d="M9 5.527C9 4.96 8.54 4.5 7.973 4.5H3.149v0A2.65 2.65 0 0 0 .5 7.149V9.5h1.135l.379 4h2.27l.872-6.945h2.817C8.54 6.555 9 6.095 9 5.527"/></g>`),
    Lesson:  S(`0 0 14 14`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6.35.5h6.302c.469 0 .849.38.849.849v6.778c0 .47-.38.85-.849.85H7.5M3.149 4.001a1.75 1.75 0 1 0 0-3.501a1.75 1.75 0 0 0 0 3.501"/><path d="M9 5.527C9 4.96 8.54 4.5 7.973 4.5H3.149v0A2.65 2.65 0 0 0 .5 7.149V9.5h1.135l.379 4h2.27l.872-6.945h2.817C8.54 6.555 9 6.095 9 5.527"/></g>`),
    Course:  S(`0 0 512 512`,`<path fill="currentColor" d="M464 48c-67.61.29-117.87 9.6-154.24 25.69c-27.14 12-37.76 21.08-37.76 51.84V448c41.57-37.5 78.46-48 224-48V48ZM48 48c67.61.29 117.87 9.6 154.24 25.69c27.14 12 37.76 21.08 37.76 51.84V448c-41.57-37.5-78.46-48-224-48V48Z"/>`),
    Quiz:    S(`0 0 24 24`,`<path fill="currentColor" d="M20 16V4H8v12zm2 0c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2zm-6 4v2H4c-1.1 0-2-.9-2-2V7h2v13zM14.2 5q-1.35 0-2.1.6c-.5.4-.8 1-.8 1.8h1.9c0-.3.1-.5.3-.7c.2-.1.4-.2.7-.2s.6.1.8.3s.3.4.3.8c0 .3-.1.6-.2.8s-.4.4-.6.6c-.5.3-.9.6-1 .9c-.4.2-.5.6-.5 1.1h2c0-.3 0-.6.1-.7c.1-.2.3-.4.5-.5c.4-.2.8-.5 1.1-.9c.3-.5.5-.9.5-1.4c0-.8-.3-1.4-.8-1.8c-.5-.5-1.3-.7-2.2-.7M13 12v2h2v-2z"/>`),
    Question:S(`0 0 16 16`,`<path fill="currentColor" d="M9 11H6c0-3 1.6-4 2.7-4.6q.6-.3.9-.6c.5-.5.3-1.2.2-1.4c-.3-.7-1-1.4-2.3-1.4C5.4 3 5 4.9 5 5.3l-3-.4C2.2 3.2 3.7 0 7.5 0c2.3 0 4.3 1.3 5.1 3.2c.7 1.7.4 3.5-.8 4.7c-.5.5-1.1.8-1.6 1.1c-.9.5-1.2 1-1.2 2m.5 3a2 2 0 1 1-3.999.001A2 2 0 0 1 9.5 14"/>`),
    Answer:  S(`0 0 24 24`,`<path fill="currentColor" d="M5.455 15L1 18.5V3a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v12zm-.692-2H16V4H3v10.385zM8 17h10.237L20 18.385V8h1a1 1 0 0 1 1 1v13.5L17.546 19H9a1 1 0 0 1-1-1z"/>`),

    /** Moderation */
    Thread:  S(`0 0 24 24`,`<g fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'><path d='M3 21c-.667-.667 3.262-6.236 11.785-16.709a3.5 3.5 0 1 1 5.078 4.791C9.288 17.694 3.667 21.667 3 21zM17.5 6.5l-1 1'/><path d='M17 7c-2.333-2.667-3.5-4-5-4s-2 1-2 2c0 4 8.161 8.406 6 11c-1.056 1.268-3.363 1.285-5.75.808m-4.511-1.383C4.346 14.86 2 13.5 2 12m17.5-2.5L21 11'/></g>`),
    Post:    S(`0 0 24 24`,`<path fill='currentColor' d='M16 10H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1zm3-7h-1V2c0-.55-.45-1-1-1s-1 .45-1 1v1H8V2c0-.55-.45-1-1-1s-1 .45-1 1v1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V8h14v10c0 .55-.45 1-1 1zm-5-5H8c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1s-.45-1-1-1z'/>`),
    Comment: S(`0 0 512 512`,`<path fill='currentColor' d='M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4c32.7 12.3 69 19.4 107.4 19.4c141.4 0 256-93.1 256-208S397.4 32 256 32zM128 272c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z'/>`),
    Vote:    S(`0 0 24 24`,`<path fill='currentColor' d='M12.781 2.375c-.381-.475-1.181-.475-1.562 0l-8 10A1.001 1.001 0 0 0 4 14h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7h4a1.001 1.001 0 0 0 .781-1.625l-8-10zM15 12h-1v8h-4v-8H6.081L12 4.601L17.919 12H15z'/>`),
    Report:  S(`0 0 24 24`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5'></path>`),
    Like:    S(`0 0 48 48`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M15 8C8.925 8 4 12.925 4 19c0 11 13 21 20 23.326C31 40 44 30 44 19c0-6.075-4.925-11-11-11c-3.72 0-7.01 1.847-9 4.674A10.987 10.987 0 0 0 15 8Z'/>`),
    Message: S(`0 0 24 24`,`<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9h8m-8 4h6m4-9a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/>`),
    
    /** HR */
    Job:         S(`0 0 28 28`,`<path fill='currentColor' d='M13.11 2.293a1.5 1.5 0 0 1 1.78 0l9.497 7.005c1.124.83.598 2.578-.74 2.7H4.353c-1.338-.122-1.863-1.87-.74-2.7l9.498-7.005ZM14 8.999a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Zm5.5 4h2.499v6h-2.5v-6Zm-2 6v-6H15v6h2.5ZM13 19v-6h-2.5v6H13Zm-4.499 0v-6h-2.5v6h2.5Zm-2.25 1a3.25 3.25 0 0 0-3.25 3.25v.5a.752.752 0 0 0 .75.751h20.497a.75.75 0 0 0 .75-.75v-.5a3.25 3.25 0 0 0-3.25-3.25H6.252Z'/>`),
    Application: S(`0 0 24 24`,`<path fill='currentColor' d='M18 19H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1M12 7a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m7 0h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z'/>`),
    Attachment:  S(`0 0 15 15`,`<path fill='currentColor' d='M0 4.5V0h1v4.5a1.5 1.5 0 1 0 3 0v-3a.5.5 0 0 0-1 0V5H2V1.5a1.5 1.5 0 1 1 3 0v3a2.5 2.5 0 0 1-5 0Z'/><path fill='currentColor' fill-rule='evenodd' d='M12.5 0H6v4.5A3.5 3.5 0 0 1 2.5 8H1v5.5A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 0ZM11 4H7v1h4V4Zm0 3H7v1h4V7Zm-7 3h7v1H4v-1Z' clip-rule='evenodd'/>`),
    Listing:     S(`0 0 32 32`,`<path fill='currentColor' d='M10.28 5.28L7 8.563l-1.28-1.28L4.28 8.72l2 2l.72.686l.72-.687l4-4zM15 7v2h13V7zm-4.72 6.28L7 16.564L5.72 15.28l-1.44 1.44l2 2l.72.686l.72-.687l4-4l-1.44-1.44zM15 15v2h13v-2zm-4.72 6.28L7 24.563l-1.28-1.28l-1.44 1.437l2 2l.72.686l.72-.687l4-4l-1.44-1.44zM15 23v2h13v-2z'/>`),
    Event:       S(`0 0 24 24`,`<path fill='currentColor' d='M18 11c1.49 0 2.87.47 4 1.26V8c0-1.11-.89-2-2-2h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h7.68A6.995 6.995 0 0 1 18 11zm-8-7h4v2h-4V4z'/><path fill='currentColor' d='M18 13c-2.76 0-5 2.24-5 5s2.24 5 5 5s5-2.24 5-5s-2.24-5-5-5zm1.65 7.35L17.5 18.2V15h1v2.79l1.85 1.85l-.7.71z'/>`),
    Screening:   S(`0 0 24 24`,`<path fill='currentColor' d='M22 3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 1.99-.9 1.99-2L24 5c0-1.1-.9-2-2-2zM8 6c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3zm6 12H2v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1zm3.85-4h1.64L21 16l-1.99 1.99A7.512 7.512 0 0 1 16.28 14c-.18-.64-.28-1.31-.28-2s.1-1.36.28-2a7.474 7.474 0 0 1 2.73-3.99L21 8l-1.51 2h-1.64c-.22.63-.35 1.3-.35 2s.13 1.37.35 2z'/>`),
    Interview:   S(`0 0 20 20`,`<path fill='currentColor' d='M5.8 12.2V6H2C.9 6 0 6.9 0 8v6c0 1.1.9 2 2 2h1v3l3-3h5c1.1 0 2-.9 2-2v-1.82a.943.943 0 0 1-.2.021h-7V12.2zM18 1H9c-1.1 0-2 .9-2 2v8h7l3 3v-3h1c1.1 0 2-.899 2-2V3c0-1.1-.9-2-2-2z'/>`),
    Offer:       S(`0 0 36 36`,`<path fill='currentColor' d='M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2Zm7.65 21.59c-1 3-3.61 3.84-5.9 4v2a1.25 1.25 0 0 1-2.5 0v-2A11.47 11.47 0 0 1 11 25a1.25 1.25 0 1 1 1.71-1.83a9.11 9.11 0 0 0 4.55 1.94v-6.28a9.63 9.63 0 0 1-3.73-1.41a4.8 4.8 0 0 1-1.91-5.84c.59-1.51 2.42-3.23 5.64-3.51V6.25a1.25 1.25 0 0 1 2.5 0v1.86a9.67 9.67 0 0 1 4.9 2A1.25 1.25 0 0 1 23 11.95a7.14 7.14 0 0 0-3.24-1.31v6.13c.6.13 1.24.27 1.91.48a5.85 5.85 0 0 1 3.69 2.82a4.64 4.64 0 0 1 .29 3.52Z' class='clr-i-solid clr-i-solid-path-1'/><path fill='currentColor' d='M20.92 19.64c-.4-.12-.79-.22-1.17-.3v5.76c2-.2 3.07-.9 3.53-2.3a2.15 2.15 0 0 0-.15-1.58a3.49 3.49 0 0 0-2.21-1.58Z' class='clr-i-solid clr-i-solid-path-2'/><path fill='currentColor' d='M13.94 12.48a2.31 2.31 0 0 0 1 2.87a6.53 6.53 0 0 0 2.32.92v-5.72c-2.1.25-3.07 1.29-3.32 1.93Z' class='clr-i-solid clr-i-solid-path-3'/><path fill='none' d='M0 0h36v36H0z'/>`),
    Check:       S(`0 0 24 24`,`<path fill="currentColor" d="M5.55 19L2 15.45l1.4-1.4l2.125 2.125l4.25-4.25l1.4 1.425zm0-8L2 7.45l1.4-1.4l2.125 2.125l4.25-4.25l1.4 1.425zM13 17v-2h9v2zm0-8V7h9v2z"/>`),
    Gift:        S(`0 0 14 14`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 2.5h-7v5h7zm-3.5 0v5M8.5.5l1.5 2l1.5-2M.5 11l2.444 2.036a2 2 0 0 0 1.28.463h6.442c.46 0 .834-.373.834-.833c0-.92-.746-1.667-1.667-1.667H5.354"/><path d="m3.5 10l.75.75a1.06 1.06 0 0 0 1.5-1.5L4.586 8.085A2 2 0 0 0 3.17 7.5H.5"/></g>`),
    Deduct:      S(`0 0 20 20`,`<path fill="currentColor" d="M10 20a10 10 0 1 1 0-20a10 10 0 0 1 0 20m0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16m5-9v2H5V9z"/>`),
    Tax:         S(`0 0 24 24`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M2 8.57c0-1.197.482-1.93 1.48-2.486l4.11-2.287C9.743 2.6 10.82 2 12 2s2.257.6 4.41 1.797l4.11 2.287C21.517 6.64 22 7.373 22 8.57c0 .324 0 .487-.035.62c-.186.7-.821.811-1.434.811H3.469c-.613 0-1.247-.11-1.434-.811C2 9.056 2 8.893 2 8.569M4 10v8.5M8 10v8.5m3 0H5a3 3 0 0 0-3 3a.5.5 0 0 0 .5.5H11m10.5-7.5l-7 7"/><circle cx="15.25" cy="15.25" r=".75"/><circle cx="20.75" cy="20.75" r=".75"/></g>`),
    Skill:       S(`0 0 256 256`,`<path fill="currentColor" d="M188 48a27.75 27.75 0 0 0-12 2.71V44a28 28 0 0 0-54.65-8.6A28 28 0 0 0 80 60v64l-3.82-6.13a28 28 0 0 0-48.6 27.82c16 33.77 28.93 57.72 43.72 72.69C86.24 233.54 103.2 240 128 240a88.1 88.1 0 0 0 88-88V76a28 28 0 0 0-28-28m12 104a72.08 72.08 0 0 1-72 72c-20.38 0-33.51-4.88-45.33-16.85C69.44 193.74 57.26 171 41.9 138.58a6 6 0 0 0-.3-.58a12 12 0 0 1 20.79-12a2 2 0 0 0 .14.23l18.67 30A8 8 0 0 0 96 152V60a12 12 0 0 1 24 0v60a8 8 0 0 0 16 0V44a12 12 0 0 1 24 0v76a8 8 0 0 0 16 0V76a12 12 0 0 1 24 0Z"/>`),

    /** Media */
    Creative: S(`0 0 15 15`,`<path fill='currentColor' d='M10.71 3L7.85.15a.5.5 0 0 0-.707-.003L7.14.15L4.29 3H1.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5zM7.5 1.21L9.29 3H5.71zM13 12H2V4h11zM5 7a1 1 0 1 1 0-2a1 1 0 0 1 0 2zm7 4H4.5L6 8l1.25 2.5L9.5 6z'/>`),
    Artifact: S(`0 0 16 16`,`<g fill='currentColor'><path d='M8.002 5.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0z'/><path d='M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11L5.835 9.7a.5.5 0 0 0-.611.076L3 12V2z'/></g>`),
    Artist:   S(`0 0 32 32`,`<g fill='currentColor'><path d='M24 19a3 3 0 1 0 0-6a3 3 0 0 0 0 6Zm0-1a2 2 0 1 1 0-4a2 2 0 0 1 0 4Zm-7.5-9.25a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0Zm-6 4a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0ZM8.25 22a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5ZM16 24.25a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0Z'/><path d='M16.2 31a16.717 16.717 0 0 1-7.84-2.622a15.045 15.045 0 0 1-6.948-9.165A13.032 13.032 0 0 1 2.859 9.22c3.757-6.2 12.179-8.033 19.588-4.256c4.419 2.255 7.724 6.191 8.418 10.03a6.8 6.8 0 0 1-1.612 6.02c-2.158 2.356-4.943 2.323-6.967 2.3h-.007c-1.345-.024-2.185 0-2.386.4c.07.308.192.604.36.873a3.916 3.916 0 0 1-.209 4.807A4.7 4.7 0 0 1 16.2 31ZM14.529 5a11.35 11.35 0 0 0-9.961 5.25a11.048 11.048 0 0 0-1.218 8.473a13.03 13.03 0 0 0 6.03 7.934c3.351 1.988 7.634 3.3 9.111 1.473c.787-.968.537-1.565-.012-2.622a2.843 2.843 0 0 1-.372-2.7c.781-1.54 2.518-1.523 4.2-1.5c1.835.025 3.917.05 5.472-1.649a4.909 4.909 0 0 0 1.12-4.314c-.578-3.2-3.536-6.653-7.358-8.6a15.482 15.482 0 0 0-7.01-1.74L14.529 5Z'/></g>`),
    Modifier: S(`0 0 24 24`,`<path fill='currentColor' d='M19.75 2A2.25 2.25 0 0 1 22 4.25v5.462a3.25 3.25 0 0 1-.952 2.298l-8.5 8.503a3.255 3.255 0 0 1-4.597.001L3.489 16.06a3.25 3.25 0 0 1-.004-4.596l8.5-8.51a3.25 3.25 0 0 1 2.3-.953h5.465Zm0 1.5h-5.466c-.464 0-.91.185-1.238.513l-8.512 8.523a1.75 1.75 0 0 0 .015 2.462l4.461 4.454a1.755 1.755 0 0 0 2.477 0l8.5-8.503a1.75 1.75 0 0 0 .513-1.237V4.25a.75.75 0 0 0-.75-.75ZM17 5.502a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z'/>`),
    Album:    S(`0 0 24 24`,`<path fill='currentColor' d='M11.024 11.536L10 10l-2 3h9l-3.5-5z'/><circle cx='9.503' cy='7.497' r='1.503' fill='currentColor'/><path fill='currentColor' d='M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2zm0 14H5V5c0-.806.55-.988 1-1h13v12z'/>`),

    /** Sales & Marketing */
    Sales:        S(`0 0 24 24`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14 9.846c-1-.923-3.667-1.23-3.667.616S14 11.385 14 13.23s-3 1.846-4 .615m2 .857V16m0-6.887V8M2 8l9.732-4.866a.6.6 0 0 1 .536 0L22 8"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/></g>`),
    Channel:      S(`0 0 24 24`,`<path fill="none" stroke="currentColor" stroke-width="2" d="M2 9h20v13H2zm19-7l-8 7h-2L3 2"/>`),
    Product:      S(`0 0 24 24`,`<path fill="currentColor" d="M22 3H2v6h1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9h1zM4 5h16v2H4zm15 15H5V9h14zM9 11h6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2"/>`),
    Inventory:    S(`0 0 24 24`,`<path fill="currentColor" d="m15.5 19.925l-4.25-4.25l1.4-1.4l2.85 2.85l5.65-5.65l1.4 1.4zM21 10h-2V5h-2v3H7V5H5v14h6v2H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h4.175q.275-.875 1.075-1.437T12 1q1 0 1.788.563T14.85 3H19q.825 0 1.413.588T21 5zm-9-5q.425 0 .713-.288T13 4t-.288-.712T12 3t-.712.288T11 4t.288.713T12 5"/>`),
    Order:        S(`0 0 24 24`,`<g fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="17" x="5" y="4" rx="2"/><path stroke-linecap="round" d="M9 9h6m-6 4h6m-6 4h4"/></g>`),
    LineItem:     S(`0 0 24 24`,`<path fill="currentColor" d="M17 4V2.068a.5.5 0 0 1 .82-.385l4.12 3.433a.5.5 0 0 1-.321.884H2V4zM2 18h20v2H2zm0-7h20v2H2z"/>`),
    Pay:          S(`0 0 24 24`,`<path fill="currentColor" d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2m0 14H4v-6h16zm0-10H4V6h16z"/>`),
    Supplier:     S(`0 0 24 24`,`<path fill="currentColor" d="M3 4a2 2 0 0 0-2 2v11h2a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h2v-5l-3-4h-3V4m-7 2l4 4l-4 4v-3H4V9h6m7 .5h2.5l1.97 2.5H17M6 15.5A1.5 1.5 0 0 1 7.5 17A1.5 1.5 0 0 1 6 18.5A1.5 1.5 0 0 1 4.5 17A1.5 1.5 0 0 1 6 15.5m12 0a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5"/>`),
    Ship:         S(`0 0 24 24`,`<path fill="currentColor" d="M4 10.4V4a1 1 0 0 1 1-1h5V1h4v2h5a1 1 0 0 1 1 1v6.4l1.086.326a1 1 0 0 1 .683 1.2l-1.517 6.068A4.99 4.99 0 0 1 16 16a5 5 0 0 1-4 2a5 5 0 0 1-4-2a4.99 4.99 0 0 1-4.252 1.994l-1.516-6.068a1 1 0 0 1 .682-1.2zm2-.6L12 8l2.754.826l1.809.543L18 9.8V5H6zM4 20a5.98 5.98 0 0 0 4-1.528A5.98 5.98 0 0 0 12 20a5.98 5.98 0 0 0 4-1.528A5.98 5.98 0 0 0 20 20h2v2h-2a7.96 7.96 0 0 1-4-1.07A7.96 7.96 0 0 1 12 22a7.96 7.96 0 0 1-4-1.07A7.96 7.96 0 0 1 4 22H2v-2z"/>`),
    Stock:        S(`0 0 24 24`,`<path fill="currentColor" d="M8.005 5.003h3v9h-3v3h-2v-3h-3v-9h3v-3h2zm10 5h3v9h-3v3h-2v-3h-3v-9h3v-3h2z"/>`),
    Opportunity:  S(`0 0 32 32`,`<path fill="currentColor" d="M11 24h10v2H11zm2 4h6v2h-6zm3-26A10 10 0 0 0 6 12a9.19 9.19 0 0 0 3.46 7.62c1 .93 1.54 1.46 1.54 2.38h2c0-1.84-1.11-2.87-2.19-3.86A7.2 7.2 0 0 1 8 12a8 8 0 0 1 16 0a7.2 7.2 0 0 1-2.82 6.14c-1.07 1-2.18 2-2.18 3.86h2c0-.92.53-1.45 1.54-2.39A9.18 9.18 0 0 0 26 12A10 10 0 0 0 16 2"/>`),
    Connect:      S(`0 0 24 24`,`<path fill="none" stroke="currentColor" stroke-width="2" d="M10 21c-2.5 2.5-5 2-7 0s-2.5-4.5 0-7l3-3l7 7zm4-18c2.5-2.5 5-2 7.001 0s2.499 4.5 0 7l-3 3L11 6zm-3 7l-2.5 2.5zm3 3l-2.5 2.5z"/>`),
    Conversion:   S(`0 0 24 24`,`<path fill="currentColor" d="M19 21q-.975 0-1.75-.562T16.175 19H11q-1.65 0-2.825-1.175T7 15t1.175-2.825T11 11h2q.825 0 1.413-.587T15 9t-.587-1.412T13 7H7.825q-.325.875-1.088 1.438T5 9q-1.25 0-2.125-.875T2 6t.875-2.125T5 3q.975 0 1.738.563T7.825 5H13q1.65 0 2.825 1.175T17 9t-1.175 2.825T13 13h-2q-.825 0-1.412.588T9 15t.588 1.413T11 17h5.175q.325-.875 1.088-1.437T19 15q1.25 0 2.125.875T22 18t-.875 2.125T19 21M5 7q.425 0 .713-.288T6 6t-.288-.712T5 5t-.712.288T4 6t.288.713T5 7"/>`),
    Source:       S(`0 0 24 24`,`<path fill="currentColor" d="M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m-1-4V3h2v2zm0 16v-2h2v2z"/>`),
    Account:      S(`0 0 24 24`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M14 9h4m-4 3.5h3"/><rect width="20" height="18" x="2" y="3" rx="5"/><path d="M5 16c1.208-2.581 5.712-2.75 7 0m-1.5-7a2 2 0 1 1-4 0a2 2 0 0 1 4 0"/></g>`),
    Library:      S(`0 0 36 36`,`<path fill="currentColor" d="M12.75 3h-7.5A1.15 1.15 0 0 0 4 4v29h10V4a1.15 1.15 0 0 0-1.25-1" class="clr-i-solid clr-i-solid-path-1"/><path fill="currentColor" d="m33.77 31.09l-6.94-18.3a1 1 0 0 0-1.29-.58L22 13.59V9a1 1 0 0 0-1-1h-5v25h6V14.69L28.93 33Z" class="clr-i-solid clr-i-solid-path-2"/><path fill="none" d="M0 0h36v36H0z"/>`),
    Analytics:    S(`0 0 32 32`,`<path fill="currentColor" d="M4 2H2v26a2 2 0 0 0 2 2h26v-2H4Z"/><path fill="currentColor" d="M30 9h-7v2h3.59L19 18.59l-4.29-4.3a1 1 0 0 0-1.42 0L6 21.59L7.41 23L14 16.41l4.29 4.3a1 1 0 0 0 1.42 0l8.29-8.3V16h2Z"/>`),
    Activity:     S(`0 0 24 24`,`<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h4l3 8l4-16l3 8h4"/>`),
    Budget:       S(`0 0 24 24`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M19.5 16v-3.994c0-1.486 0-2.23-.256-2.91c-.255-.68-.745-1.24-1.723-2.358L16 5H8L6.48 6.738C5.5 7.856 5.01 8.416 4.755 9.096s-.256 1.424-.256 2.91V16c0 2.828 0 4.243.879 5.121S7.672 22 10.5 22h3c2.828 0 4.243 0 5.121-.879c.879-.878.879-2.293.879-5.121"/><path d="M9.5 15.683c0 1.23 1.854 2.237 3.633 1.672s1.517-2.23.913-2.884s-1.491-.544-2.506-.596c-2.281-.116-2.442-2.303-.595-3.168c1.355-.635 3.093.18 3.293 1.293m-2.267-2.5v.978m0 7.242v.78M7.5 2h9c.466 0 .699 0 .883.076a1 1 0 0 1 .54.541c.077.184.077.417.077.883s0 .699-.076.883a1 1 0 0 1-.541.54C17.199 5 16.966 5 16.5 5h-9c-.466 0-.699 0-.883-.076a1 1 0 0 1-.54-.541C6 4.199 6 3.966 6 3.5s0-.699.076-.883a1 1 0 0 1 .541-.54C6.801 2 7.034 2 7.5 2"/></g>`),
    Cast:         S(`0 0 24 24`,`<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16.85 18.58a9 9 0 1 0-9.7 0"/><path d="M8 14a5 5 0 1 1 8 0"/><circle cx="12" cy="11" r="1"/><path d="M13 17a1 1 0 1 0-2 0l.5 4.5a.5.5 0 1 0 1 0Z"/></g>`),
    Target:       S(`0 0 24 24`,`<path fill="currentColor" d="M19.938 13A8.004 8.004 0 0 1 13 19.938V22h-2v-2.062A8.004 8.004 0 0 1 4.062 13H2v-2h2.062A8.004 8.004 0 0 1 11 4.062V2h2v2.062A8.004 8.004 0 0 1 19.938 11H22v2zM12 18a6 6 0 1 0 0-12a6 6 0 0 0 0 12m0-3a3 3 0 1 0 0-6a3 3 0 0 0 0 6"/>`),
    Mail:         S(`0 0 24 24`,`<path fill='currentColor' d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5l8-5v10zm-8-7L4 6h16l-8 5z'/>`),
    MailRun:      S(`0 0 24 24`,`<path fill='currentColor' d='M21 3a1 1 0 0 1 1 1v16.007a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V19h18V7.3l-8 7.2l-10-9V4a1 1 0 0 1 1-1h18ZM8 15v2H0v-2h8Zm-3-5v2H0v-2h5Zm14.566-5H4.434L12 11.81L19.566 5Z'/>`),
    Subscription: S(`0 0 24 24`,`<path fill='currentColor' d='M12.525 4H5.25l-.184.005A3.25 3.25 0 0 0 2 7.25v9.5l.005.184A3.25 3.25 0 0 0 5.25 20h13.5l.184-.005A3.25 3.25 0 0 0 22 16.75V9.332a1.743 1.743 0 0 1-.75.168h-.75v7.25l-.006.143A1.75 1.75 0 0 1 18.75 18.5H5.25l-.144-.006A1.75 1.75 0 0 1 3.5 16.75V9.374l8.15 4.29l.097.042a.75.75 0 0 0 .602-.042L20.26 9.5h-3.22L12 12.152L3.5 7.68v-.43l.006-.144A1.75 1.75 0 0 1 5.25 5.5h6.768a1.745 1.745 0 0 1 .508-1.5Zm8.725-2a.75.75 0 1 1 0 1.5h-7.5a.747.747 0 0 1-.75-.75a.75.75 0 0 1 .75-.75h7.5Zm0 2.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h7.5ZM13 7.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z'/>`),
    Newsletter:   S(`0 0 20 20`,`<path fill='currentColor' d='M16 2h4v15a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V0h16v2zm0 2v13a1 1 0 0 0 1 1a1 1 0 0 0 1-1V4h-2zM2 2v15a1 1 0 0 0 1 1h11.17a2.98 2.98 0 0 1-.17-1V2H2zm2 8h8v2H4v-2zm0 4h8v2H4v-2zM4 4h8v4H4V4z'/>`),
    Expense:      S(`0 0 24 24`,`<path fill="currentColor" d="M7 15h2c0 1.08 1.37 2 3 2s3-.92 3-2c0-1.1-1.04-1.5-3.24-2.03C9.64 12.44 7 11.78 7 9c0-1.79 1.47-3.31 3.5-3.82V3h3v2.18C15.53 5.69 17 7.21 17 9h-2c0-1.08-1.37-2-3-2s-3 .92-3 2c0 1.1 1.04 1.5 3.24 2.03C14.36 11.56 17 12.22 17 15c0 1.79-1.47 3.31-3.5 3.82V21h-3v-2.18C8.47 18.31 7 16.79 7 15"/>`),
    Approve:      S(`0 0 24 24`,`<path fill="currentColor" d="m23 12l-2.44-2.78l.34-3.68l-3.61-.82l-1.89-3.18L12 3L8.6 1.54L6.71 4.72l-3.61.81l.34 3.68L1 12l2.44 2.78l-.34 3.69l3.61.82l1.89 3.18L12 21l3.4 1.46l1.89-3.18l3.61-.82l-.34-3.68zm-13 5l-4-4l1.41-1.41L10 14.17l6.59-6.59L18 9z"/>`),
    Actual:       S(`0 0 24 24`,`<path fill="none" stroke="currentColor" stroke-width="2" d="M9 15v3c0 .943 0 1.414-.293 1.707S7.943 20 7 20H6c-.943 0-1.414 0-1.707-.293S4 18.943 4 18v-1c0-.943 0-1.414.293-1.707S5.057 15 6 15zm6-11h5v5m0-5L9 15"/>`),
    Refund:       S(`0 0 20 20`,`<path fill="currentColor" fill-rule="evenodd" d="M5 2a2 2 0 0 0-2 2v14l3.5-2l3.5 2l3.5-2l3.5 2V4a2 2 0 0 0-2-2zm4.707 3.707a1 1 0 0 0-1.414-1.414l-3 3a1 1 0 0 0 0 1.414l3 3a1 1 0 0 0 1.414-1.414L8.414 9H10a3 3 0 0 1 3 3v1a1 1 0 1 0 2 0v-1a5 5 0 0 0-5-5H8.414z" clip-rule="evenodd"/>`),
    Result:       S(`0 0 2048 2048`,`<path fill="currentColor" d="M2048 640v640h-768v512H128v128H0V0h128v128h1408v512zM128 256v384h1280V256zm1024 1408v-384H128v384zm768-512V768H128v384z"/>`),

    /** CMS */
    Page:     S('0 0 24 24','<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M4 21.4V2.6a.6.6 0 0 1 .6-.6h11.652a.6.6 0 0 1 .424.176l3.148 3.148A.6.6 0 0 1 20 5.75V21.4a.6.6 0 0 1-.6.6H4.6a.6.6 0 0 1-.6-.6M8 10h8m-8 8h8m-8-4h4"/><path d="M16 2v3.4a.6.6 0 0 0 .6.6H20"/></g>'),
    Tag:      S('0 0 24 24','<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0-2 0"/><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592-5.592a2.41 2.41 0 0 0 0-3.408l-7.71-7.71A2 2 0 0 0 11.172 3H6a3 3 0 0 0-3 3"/></g>'),
    Type:     S('0 0 24 24','<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7V6a2 2 0 0 1 2-2h5m7 3V6a2 2 0 0 0-2-2h-5m0 0v16m0 0H9m3 0h3"/>'),
    Category: S('0 0 24 24','<path fill="currentColor" d="m2.25 8.452l9.5 5.48a.5.5 0 0 0 .5 0l9.5-5.48a.5.5 0 0 0 0-.866l-9.5-5.476a.51.51 0 0 0-.5 0l-9.5 5.476a.5.5 0 0 0 0 .866M12 3.122l8.499 4.898L12 12.923L3.501 8.02zm9.248 12.404L12 20.921l-9.248-5.395a.5.5 0 1 0-.504.864l9.5 5.542a.5.5 0 0 0 .504 0l9.5-5.542a.5.5 0 1 0-.504-.864m0-4L12 16.921l-9.248-5.395a.5.5 0 1 0-.504.864l9.5 5.542a.5.5 0 0 0 .504 0l9.5-5.542a.5.5 0 1 0-.504-.864"/>'),
    Menu:     S('0 0 24 24','<path fill="currentColor" d="M2 2h20v20H2zm2 2v5.5h16V4zm16 7.5H4V20h16zM5.996 6H8v2h-.004v.004h-2zM10 6h8v2h-8z"/>'),
    MenuItem: S('0 0 24 24','<path fill="currentColor" d="M3 6h10v2H3zm0 10h10v2H3zm0-5h12v2H3zm13-4l-1.42 1.39L18.14 12l-3.56 3.61L16 17l5-5z"/>'),
    Setting:  S('-2 -4 24 24','<path fill="currentColor" d="M9 12V1a1 1 0 1 1 2 0v11h1a1 1 0 0 1 0 2h-1v1a1 1 0 0 1-2 0v-1H8a1 1 0 0 1 0-2zm7-10V1a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2h-1v11a1 1 0 0 1-2 0V4h-1a1 1 0 0 1 0-2zM4 5h1a1 1 0 1 1 0 2H4v8a1 1 0 0 1-2 0V7H1a1 1 0 1 1 0-2h1V1a1 1 0 1 1 2 0z"/>'),
    Metadata: S('0 0 32 32','<path fill="currentColor" d="m30 28.6l-2.8-2.8c.5-.8.8-1.8.8-2.8c0-2.8-2.2-5-5-5s-5 2.2-5 5s2.2 5 5 5c1 0 2-.3 2.8-.8l2.8 2.8zM20 23c0-1.7 1.3-3 3-3s3 1.3 3 3s-1.3 3-3 3s-3-1.3-3-3M8 16h10v2H8zm0-6h12v2H8z"/><path fill="currentColor" d="m14 27.7l-5.2-2.8C5.8 23.4 4 20.3 4 17V4h20v11h2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v13c0 4.1 2.2 7.8 5.8 9.7L14 30z"/>'),
    Version:  S('0 0 24 24','<path fill="currentColor" fill-rule="evenodd" d="M16.242 7.757A6 6 0 0 0 6.81 8.986l.734-.376a1 1 0 0 1 .911 1.78l-2.704 1.385l-.438-.856l.438.856a1.222 1.222 0 0 1-1.708-.678l-.985-2.761a1 1 0 0 1 1.884-.672l.123.345a8 8 0 1 1 6.364 11.971a1 1 0 0 1 .142-1.995a6 6 0 0 0 4.672-10.227M12 7.111a1 1 0 0 1 1 1v3.808c0 .317-.126.621-.35.845l-2.443 2.443a1 1 0 0 1-1.414-1.414L11 11.586V8.11a1 1 0 0 1 1-1m-5.657 9.132a1 1 0 0 1 1.414 0q.386.384.815.683a1 1 0 1 1-1.144 1.64a8 8 0 0 1-1.085-.91a1 1 0 0 1 0-1.413" clip-rule="evenodd"/>'),
    Mapping:  S('0 0 48 48','<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"><path d="M8 28a4 4 0 1 0 0-8a4 4 0 0 0 0 8ZM42 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4Zm0 18a2 2 0 1 0 0-4a2 2 0 0 0 0 4Zm0 18a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z"/><path stroke-linecap="round" d="M32 6H20v36h12M12 24h20"/></g>'),
    Policy:   S('0 0 24 24','<path fill="currentColor" d="m21 5l-9-4l-9 4v6c0 5.55 3.84 10.74 9 12c2.3-.56 4.33-1.9 5.88-3.71l-3.12-3.12a4.994 4.994 0 0 1-6.29-.64a5.003 5.003 0 0 1 0-7.07a5.003 5.003 0 0 1 7.07 0a5.006 5.006 0 0 1 .64 6.29l2.9 2.9C20.29 15.69 21 13.38 21 11z"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
    Resource: S('0 0 24 24','<path fill="currentColor" d="M13.272 1v2.65l6.613 3.89v7.745l2.465 1.295l-.93 1.77l-2.507-1.317l-5.641 3.317V23h-2v-2.65l-5.69-3.346l-3.12 1.304l-.77-1.845l2.967-1.24V7.539l6.613-3.889V1zm-1 4.382l-4.64 2.73l4.64 2.728l4.64-2.729zm5.613 4.477l-4.613 2.713v5.458l4.613-2.713zm-6.613 8.17v-5.457L6.66 9.859v5.458z"/>'),
    Ticket:   S('0 0 24 24','<path fill="currentColor" d="M4 4a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2a2 2 0 0 1-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 1-2-2a2 2 0 0 1 2-2V6a2 2 0 0 0-2-2zm0 2h16v2.54c-1.24.71-2 2.03-2 3.46s.76 2.75 2 3.46V18H4v-2.54c1.24-.71 2-2.03 2-3.46s-.76-2.75-2-3.46z"/>'),

    /** Formatting */
    PlainText:  S(`0 0 256 256`,`<path fill='currentColor' d='M212 56v32a12 12 0 0 1-24 0V68h-48v120h20a12 12 0 0 1 0 24H96a12 12 0 0 1 0-24h20V68H68v20a12 12 0 0 1-24 0V56a12 12 0 0 1 12-12h144a12 12 0 0 1 12 12Z'/>`),
    Markup:     S(`0 0 24 24`,`<path fill='currentColor' d='M10 20q-.425 0-.713-.288T9 19v-5q-2.075 0-3.538-1.463T4 9q0-2.075 1.463-3.538T9 4h8q.425 0 .713.288T18 5q0 .425-.288.713T17 6h-1v13q0 .425-.288.713T15 20q-.425 0-.713-.288T14 19V6h-3v13q0 .425-.288.713T10 20Z'/>`),
    HtmlFormat: S(`0 0 24 24`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m10 20l4-16m4 4l4 4l-4 4M6 16l-4-4l4-4'/>`),

    /** Components */
    Navigation: S(`0 0 24 24`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m3 11l19-9l-9 19l-2-8z'/>`),
    Alert:      S(`0 0 24 24`,`<path fill='currentColor' d='M12 2L1 21h22M12 6l7.53 13H4.47M11 10v4h2v-4m-2 6v2h2v-2'/>`),

    /** Actions */
    Completed: S(`0 0 2048 2048`,`<path fill='currentColor' d='M1024 0q141 0 272 36t244 104t207 160t161 207t103 245t37 272q0 141-36 272t-104 244t-160 207t-207 161t-245 103t-272 37q-141 0-272-36t-244-104t-207-160t-161-207t-103-245t-37-272q0-141 36-272t104-244t160-207t207-161T752 37t272-37m603 685l-136-136l-659 659l-275-275l-136 136l411 411z'/>`),
    Failed:    S(`0 0 2048 2048`,`<path fill='currentColor' d='M1024 0q141 0 272 36t244 104t207 160t161 207t103 245t37 272q0 141-36 272t-104 244t-160 207t-207 161t-245 103t-272 37q-141 0-272-36t-244-104t-207-160t-161-207t-103-245t-37-272q0-141 36-272t104-244t160-207t207-161T752 37t272-37m113 1024l342-342l-113-113l-342 342l-342-342l-113 113l342 342l-342 342l113 113l342-342l342 342l113-113z'/>`),
}
export const IconGroups = { 
    User:['AppUser'],
    Company:['Organization'],
    Contact:['Customer','Client','Employee','Applicant'],
    Location:['Address','JobLocation'],
    Time:['TimeSlot','DateRange'],
    Feature:['Amenity'],
    Application:['JobApplication'],
    Project:['Campaign'],
    Listing:['List','JobListing'],
    Check:['Require'],
    Screening:['PhoneScreen'],
    Artifact:['Media'],
    Product:['Sku'],
    Order:['Invoice'],
    LineItem:['InvoiceItem'],
    Opportunity:['Lead','Deal'],
    Connect:['Interaction'],
    Conversion:['Convert'],
    Expense:['Cost','Price','Amount'],
    Approve:['Approval'],
    Refund:['Return','Reimburse'],
    Library:['Module'],
    Page:['Article','Document'],
    Policy:['Privacy','CompanyPolicy'],
    Gift:['Benefit'],
    Deduct:['Deduction'],
    Tax:['Taxes'],
    Tag:['Label'],
    Type:['Title','JobTitle'],
    Message:['Note'],
    Category:['Group','Department'],
    Markup:['TextMarkup'],
    HtmlFormat:['RichHtml'],
    Alert:['Notification'],
}
export const Icons:{[name:string]:string} = withAliases(IconMap, IconGroups)

const IconKeys = Object.keys(Icons).sort((a,b)=>b.length-a.length)
function withAliases(icons:{[name:string]:string}, aliases:{[name:string]:string[]}):{[name:string]:string} {
    const result:{[name:string]:string} = Object.assign({}, icons)
    Object.keys(aliases).forEach(name => {
        for (const alias of aliases[name]) {
            result[alias] = icons[name]
        }
    })
    return result
}

const P = `<svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' `
function S(viewbox:string, body:string) {
    return P + `viewBox='${viewbox}'>${body}</svg>`
}

export const Icons:{[name:string]:string} = withAliases({
    /** Users */
    User:     S(`0 0 20 20`,`<path fill='currentColor' d='M10.277 2.084a.5.5 0 0 0-.554 0a15.05 15.05 0 0 1-6.294 2.421A.5.5 0 0 0 3 5v4.5c0 3.891 2.307 6.73 6.82 8.467a.5.5 0 0 0 .36 0C14.693 16.23 17 13.39 17 9.5V5a.5.5 0 0 0-.43-.495a15.05 15.05 0 0 1-6.293-2.421ZM10 9.5a2 2 0 1 1 0-4a2 2 0 0 1 0 4Zm0 5c-2.5 0-3.5-1.25-3.5-2.5A1.5 1.5 0 0 1 8 10.5h4a1.5 1.5 0 0 1 1.5 1.5c0 1.245-1 2.5-3.5 2.5Z'/>`),
    Contact:  S(`0 0 16 16`,`<path fill='currentColor' d='M5 3a3 3 0 1 1 6 0a3 3 0 0 1-6 0zm7.001 4h-.553l-3.111 6.316L9.5 7.5L8 6L6.5 7.5l1.163 5.816L4.552 7h-.554c-1.999 0-1.999 1.344-1.999 3v5h12v-5c0-1.656 0-3-1.999-3z'/>`),
    Guest:    S(`0 0 16 16`,`<path fill='currentColor' d='M8 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6m4.735 6c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139z'/>`),
    AnonUser: S(`0 0 24 24`,`<path fill='#556080' d='M12 2a5 5 0 1 0 5 5a5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3a3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z'/>`),
    Signup:   S(`0 0 16 16`,`<g fill='currentColor'><path fill-rule='evenodd' d='M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z'/><path d='M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z'/><path d='M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z'/></g>`),
    Company:  S(`0 0 24 24`,`<path fill='currentColor' d='M18 15h-2v2h2m0-6h-2v2h2m2 6h-8v-2h2v-2h-2v-2h2v-2h-2V9h8M10 7H8V5h2m0 6H8V9h2m0 6H8v-2h2m0 6H8v-2h2M6 7H4V5h2m0 6H4V9h2m0 6H4v-2h2m0 6H4v-2h2m6-10V3H2v18h20V7z'/>`),
    Location: S(`0 0 24 24`,`<path fill='currentColor' d='M12 6.5A2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5A2.5 2.5 0 0 1 9.5 9A2.5 2.5 0 0 1 12 6.5M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 1 0 3 5 9.71C17 12 17 10 17 9a5 5 0 0 0-5-5'/>`),

    /** Admin */
    Dashboard: P + `viewBox='0 0 24 24' fill='none' stroke-width='1.5' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' d='M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' /></svg>`,
    Stats:     S(`0 0 24 24`,`<path fill='currentColor' d='M8.143 15.857H5.57V9.43h2.572v6.428zm5.143 0h-2.572V3h2.572v12.857zm5.142 0h-2.571v-9h2.571v9z'/><path fill='currentColor' fill-rule='evenodd' d='M21 20.714H3v-2h18v2z' clip-rule='evenodd'/>`),
    Logs:      S(`0 0 24 24`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M13 12h8m-8 6h8M13 6h8M3 12h1m-1 6h1M3 6h1m4 6h1m-1 6h1M8 6h1'/>`),
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

    /** Moderation */
    Thread:  S(`0 0 24 24`,`<g fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'><path d='M3 21c-.667-.667 3.262-6.236 11.785-16.709a3.5 3.5 0 1 1 5.078 4.791C9.288 17.694 3.667 21.667 3 21zM17.5 6.5l-1 1'/><path d='M17 7c-2.333-2.667-3.5-4-5-4s-2 1-2 2c0 4 8.161 8.406 6 11c-1.056 1.268-3.363 1.285-5.75.808m-4.511-1.383C4.346 14.86 2 13.5 2 12m17.5-2.5L21 11'/></g>`),
    Post:    S(`0 0 24 24`,`<path fill='currentColor' d='M16 10H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1zm3-7h-1V2c0-.55-.45-1-1-1s-1 .45-1 1v1H8V2c0-.55-.45-1-1-1s-1 .45-1 1v1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V8h14v10c0 .55-.45 1-1 1zm-5-5H8c-.55 0-1 .45-1 1s.45 1 1 1h5c.55 0 1-.45 1-1s-.45-1-1-1z'/>`),
    Comment: S(`0 0 512 512`,`<path fill='currentColor' d='M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4c32.7 12.3 69 19.4 107.4 19.4c141.4 0 256-93.1 256-208S397.4 32 256 32zM128 272c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z'/>`),
    Vote:    S(`0 0 24 24`,`<path fill='currentColor' d='M12.781 2.375c-.381-.475-1.181-.475-1.562 0l-8 10A1.001 1.001 0 0 0 4 14h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7h4a1.001 1.001 0 0 0 .781-1.625l-8-10zM15 12h-1v8h-4v-8H6.081L12 4.601L17.919 12H15z'/>`),
    Report:  S(`0 0 24 24`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5'></path>`),
    Like:    S(`0 0 48 48`,`<path fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M15 8C8.925 8 4 12.925 4 19c0 11 13 21 20 23.326C31 40 44 30 44 19c0-6.075-4.925-11-11-11c-3.72 0-7.01 1.847-9 4.674A10.987 10.987 0 0 0 15 8Z'/>`),

    /** HR */
    Job:         S(`0 0 28 28`,`<path fill='currentColor' d='M13.11 2.293a1.5 1.5 0 0 1 1.78 0l9.497 7.005c1.124.83.598 2.578-.74 2.7H4.353c-1.338-.122-1.863-1.87-.74-2.7l9.498-7.005ZM14 8.999a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Zm5.5 4h2.499v6h-2.5v-6Zm-2 6v-6H15v6h2.5ZM13 19v-6h-2.5v6H13Zm-4.499 0v-6h-2.5v6h2.5Zm-2.25 1a3.25 3.25 0 0 0-3.25 3.25v.5a.752.752 0 0 0 .75.751h20.497a.75.75 0 0 0 .75-.75v-.5a3.25 3.25 0 0 0-3.25-3.25H6.252Z'/>`),
    Application: S(`0 0 24 24`,`<path fill='currentColor' d='M18 19H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1M12 7a3 3 0 0 1 3 3a3 3 0 0 1-3 3a3 3 0 0 1-3-3a3 3 0 0 1 3-3m0-4a1 1 0 0 1 1 1a1 1 0 0 1-1 1a1 1 0 0 1-1-1a1 1 0 0 1 1-1m7 0h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z'/>`),
    Attachment:  S(`0 0 15 15`,`<path fill='currentColor' d='M0 4.5V0h1v4.5a1.5 1.5 0 1 0 3 0v-3a.5.5 0 0 0-1 0V5H2V1.5a1.5 1.5 0 1 1 3 0v3a2.5 2.5 0 0 1-5 0Z'/><path fill='currentColor' fill-rule='evenodd' d='M12.5 0H6v4.5A3.5 3.5 0 0 1 2.5 8H1v5.5A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 0ZM11 4H7v1h4V4Zm0 3H7v1h4V7Zm-7 3h7v1H4v-1Z' clip-rule='evenodd'/>`),
    Listing:     S(`0 0 32 32`,`<path fill='currentColor' d='M10.28 5.28L7 8.563l-1.28-1.28L4.28 8.72l2 2l.72.686l.72-.687l4-4zM15 7v2h13V7zm-4.72 6.28L7 16.564L5.72 15.28l-1.44 1.44l2 2l.72.686l.72-.687l4-4l-1.44-1.44zM15 15v2h13v-2zm-4.72 6.28L7 24.563l-1.28-1.28l-1.44 1.437l2 2l.72.686l.72-.687l4-4l-1.44-1.44zM15 23v2h13v-2z'/>`),
    Event:       S(`0 0 24 24`,`<path fill='currentColor' d='M18 11c1.49 0 2.87.47 4 1.26V8c0-1.11-.89-2-2-2h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h7.68A6.995 6.995 0 0 1 18 11zm-8-7h4v2h-4V4z'/><path fill='currentColor' d='M18 13c-2.76 0-5 2.24-5 5s2.24 5 5 5s5-2.24 5-5s-2.24-5-5-5zm1.65 7.35L17.5 18.2V15h1v2.79l1.85 1.85l-.7.71z'/>`),
    Screening:   S(`0 0 24 24`,`<path fill='currentColor' d='M22 3H2C.9 3 0 3.9 0 5v14c0 1.1.9 2 2 2h20c1.1 0 1.99-.9 1.99-2L24 5c0-1.1-.9-2-2-2zM8 6c1.66 0 3 1.34 3 3s-1.34 3-3 3s-3-1.34-3-3s1.34-3 3-3zm6 12H2v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1zm3.85-4h1.64L21 16l-1.99 1.99A7.512 7.512 0 0 1 16.28 14c-.18-.64-.28-1.31-.28-2s.1-1.36.28-2a7.474 7.474 0 0 1 2.73-3.99L21 8l-1.51 2h-1.64c-.22.63-.35 1.3-.35 2s.13 1.37.35 2z'/>`),
    Interview:   S(`0 0 20 20`,`<path fill='currentColor' d='M5.8 12.2V6H2C.9 6 0 6.9 0 8v6c0 1.1.9 2 2 2h1v3l3-3h5c1.1 0 2-.9 2-2v-1.82a.943.943 0 0 1-.2.021h-7V12.2zM18 1H9c-1.1 0-2 .9-2 2v8h7l3 3v-3h1c1.1 0 2-.899 2-2V3c0-1.1-.9-2-2-2z'/>`),
    Offer:       S(`0 0 36 36`,`<path fill='currentColor' d='M18 2a16 16 0 1 0 16 16A16 16 0 0 0 18 2Zm7.65 21.59c-1 3-3.61 3.84-5.9 4v2a1.25 1.25 0 0 1-2.5 0v-2A11.47 11.47 0 0 1 11 25a1.25 1.25 0 1 1 1.71-1.83a9.11 9.11 0 0 0 4.55 1.94v-6.28a9.63 9.63 0 0 1-3.73-1.41a4.8 4.8 0 0 1-1.91-5.84c.59-1.51 2.42-3.23 5.64-3.51V6.25a1.25 1.25 0 0 1 2.5 0v1.86a9.67 9.67 0 0 1 4.9 2A1.25 1.25 0 0 1 23 11.95a7.14 7.14 0 0 0-3.24-1.31v6.13c.6.13 1.24.27 1.91.48a5.85 5.85 0 0 1 3.69 2.82a4.64 4.64 0 0 1 .29 3.52Z' class='clr-i-solid clr-i-solid-path-1'/><path fill='currentColor' d='M20.92 19.64c-.4-.12-.79-.22-1.17-.3v5.76c2-.2 3.07-.9 3.53-2.3a2.15 2.15 0 0 0-.15-1.58a3.49 3.49 0 0 0-2.21-1.58Z' class='clr-i-solid clr-i-solid-path-2'/><path fill='currentColor' d='M13.94 12.48a2.31 2.31 0 0 0 1 2.87a6.53 6.53 0 0 0 2.32.92v-5.72c-2.1.25-3.07 1.29-3.32 1.93Z' class='clr-i-solid clr-i-solid-path-3'/><path fill='none' d='M0 0h36v36H0z'/>`),

    /** Media */
    Creative: S(`0 0 15 15`,`<path fill='currentColor' d='M10.71 3L7.85.15a.5.5 0 0 0-.707-.003L7.14.15L4.29 3H1.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5zM7.5 1.21L9.29 3H5.71zM13 12H2V4h11zM5 7a1 1 0 1 1 0-2a1 1 0 0 1 0 2zm7 4H4.5L6 8l1.25 2.5L9.5 6z'/>`),
    Artifact: S(`0 0 16 16`,`<g fill='currentColor'><path d='M8.002 5.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0z'/><path d='M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11L5.835 9.7a.5.5 0 0 0-.611.076L3 12V2z'/></g>`),
    Artist:   S(`0 0 32 32`,`<g fill='currentColor'><path d='M24 19a3 3 0 1 0 0-6a3 3 0 0 0 0 6Zm0-1a2 2 0 1 1 0-4a2 2 0 0 1 0 4Zm-7.5-9.25a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0Zm-6 4a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0ZM8.25 22a2.25 2.25 0 1 0 0-4.5a2.25 2.25 0 0 0 0 4.5ZM16 24.25a2.25 2.25 0 1 1-4.5 0a2.25 2.25 0 0 1 4.5 0Z'/><path d='M16.2 31a16.717 16.717 0 0 1-7.84-2.622a15.045 15.045 0 0 1-6.948-9.165A13.032 13.032 0 0 1 2.859 9.22c3.757-6.2 12.179-8.033 19.588-4.256c4.419 2.255 7.724 6.191 8.418 10.03a6.8 6.8 0 0 1-1.612 6.02c-2.158 2.356-4.943 2.323-6.967 2.3h-.007c-1.345-.024-2.185 0-2.386.4c.07.308.192.604.36.873a3.916 3.916 0 0 1-.209 4.807A4.7 4.7 0 0 1 16.2 31ZM14.529 5a11.35 11.35 0 0 0-9.961 5.25a11.048 11.048 0 0 0-1.218 8.473a13.03 13.03 0 0 0 6.03 7.934c3.351 1.988 7.634 3.3 9.111 1.473c.787-.968.537-1.565-.012-2.622a2.843 2.843 0 0 1-.372-2.7c.781-1.54 2.518-1.523 4.2-1.5c1.835.025 3.917.05 5.472-1.649a4.909 4.909 0 0 0 1.12-4.314c-.578-3.2-3.536-6.653-7.358-8.6a15.482 15.482 0 0 0-7.01-1.74L14.529 5Z'/></g>`),
    Modifier: S(`0 0 24 24`,`<path fill='currentColor' d='M19.75 2A2.25 2.25 0 0 1 22 4.25v5.462a3.25 3.25 0 0 1-.952 2.298l-8.5 8.503a3.255 3.255 0 0 1-4.597.001L3.489 16.06a3.25 3.25 0 0 1-.004-4.596l8.5-8.51a3.25 3.25 0 0 1 2.3-.953h5.465Zm0 1.5h-5.466c-.464 0-.91.185-1.238.513l-8.512 8.523a1.75 1.75 0 0 0 .015 2.462l4.461 4.454a1.755 1.755 0 0 0 2.477 0l8.5-8.503a1.75 1.75 0 0 0 .513-1.237V4.25a.75.75 0 0 0-.75-.75ZM17 5.502a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z'/>`),
    Album:    S(`0 0 24 24`,`<path fill='currentColor' d='M11.024 11.536L10 10l-2 3h9l-3.5-5z'/><circle cx='9.503' cy='7.497' r='1.503' fill='currentColor'/><path fill='currentColor' d='M19 2H6c-1.206 0-3 .799-3 3v14c0 2.201 1.794 3 3 3h15v-2H6.012C5.55 19.988 5 19.806 5 19s.55-.988 1.012-1H21V4c0-1.103-.897-2-2-2zm0 14H5V5c0-.806.55-.988 1-1h13v12z'/>`),

    /** Marketing */
    Mail:         S(`0 0 24 24`,`<path fill='currentColor' d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5l8-5v10zm-8-7L4 6h16l-8 5z'/>`),
    MailRun:      S(`0 0 24 24`,`<path fill='currentColor' d='M21 3a1 1 0 0 1 1 1v16.007a1 1 0 0 1-.992.993H2.992A.993.993 0 0 1 2 20.007V19h18V7.3l-8 7.2l-10-9V4a1 1 0 0 1 1-1h18ZM8 15v2H0v-2h8Zm-3-5v2H0v-2h5Zm14.566-5H4.434L12 11.81L19.566 5Z'/>`),
    Subscription: S(`0 0 24 24`,`<path fill='currentColor' d='M12.525 4H5.25l-.184.005A3.25 3.25 0 0 0 2 7.25v9.5l.005.184A3.25 3.25 0 0 0 5.25 20h13.5l.184-.005A3.25 3.25 0 0 0 22 16.75V9.332a1.743 1.743 0 0 1-.75.168h-.75v7.25l-.006.143A1.75 1.75 0 0 1 18.75 18.5H5.25l-.144-.006A1.75 1.75 0 0 1 3.5 16.75V9.374l8.15 4.29l.097.042a.75.75 0 0 0 .602-.042L20.26 9.5h-3.22L12 12.152L3.5 7.68v-.43l.006-.144A1.75 1.75 0 0 1 5.25 5.5h6.768a1.745 1.745 0 0 1 .508-1.5Zm8.725-2a.75.75 0 1 1 0 1.5h-7.5a.747.747 0 0 1-.75-.75a.75.75 0 0 1 .75-.75h7.5Zm0 2.5a.75.75 0 1 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h7.5ZM13 7.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z'/>`),
    Newsletter:   S(`0 0 20 20`,`<path fill='currentColor' d='M16 2h4v15a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V0h16v2zm0 2v13a1 1 0 0 0 1 1a1 1 0 0 0 1-1V4h-2zM2 2v15a1 1 0 0 0 1 1h11.17a2.98 2.98 0 0 1-.17-1V2H2zm2 8h8v2H4v-2zm0 4h8v2H4v-2zM4 4h8v4H4V4z'/>`),
    
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
}, { 
    User:['AppUser'],
    Company:['Organization'],
    Contact:['Customer'],
    Location:['Address','JobLocation'],
    Time:['TimeSlot','DateRange'],
    Feature:['Amenity'],
    Application:['JobApplication'],
    Listing:['List','JobListing'],
    Screening:['PhoneScreen'],
    Subscription:['MailSubscription'],
    Markup:['TextMarkup'],
    HtmlFormat:['RichHtml'],
    Alert:['Notification'],
})

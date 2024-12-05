export function replaceMyApp(input: string, projectName: string) {
    const condensed = projectName.replace(/_/g, '')
    const kebabCase = camelToKebabCase(condensed)
    const splitCase = splitPascalCase(condensed)
    return input
        .replace(/My_App/g, projectName)
        .replace(/MyApp/g, projectName)
        .replace(/My App/g, splitCase)
        .replace(/my-app/g, kebabCase)
        .replace(/myapp/g, condensed.toLowerCase())
        .replace(/my_app/g, projectName.toLowerCase())
}

export function splitPascalCase(str: string): string {
    if (!str || str.length <= 1) return str
    // Replace capital letters with space + letter, trim any leading space
    return str
        .replace(/([A-Z])/g, ' $1')
        .trim()
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

import type { GistFile } from "./types"
import { tsdWithoutPrompt } from "./utils.js"

export function getFileContent(file:GistFile) {
    return file.filename.endsWith('.d.ts')
        ? tsdWithoutPrompt(file.content)
        : file.content
}

export type GistFile = {
    filename: string
    content: string
}
export type Gist = {
    files: { [key: string]: GistFile }
}

export type ProjectInfo = {
    projectName: string
    slnDir: string
    hostDir?: string
    migrationsDir?: string
    serviceModelDir?: string
    serviceInterfaceDir?: string
}


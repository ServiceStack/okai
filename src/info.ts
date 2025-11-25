import type { ProjectInfo } from "./types"
import fs from "fs"
import path from "path"

export function isDir(filePath:string) {
    try {
        return fs.statSync(filePath).isDirectory()
    } catch(e) {
        return false
    }
}

export function projectInfo(cwd: string) : ProjectInfo {
    const config = fs.existsSync(path.join(cwd, "okai.json"))
        ? JSON.parse(fs.readFileSync(path.join(cwd, "okai.json")).toString())
        : null
    if (config) return config

    // Search for .sln or .slnx file by walking up the directory tree
    let slnDir = ''
    let sln = ''
    let currentDir = cwd
    const root = path.parse(currentDir).root

    while (currentDir !== root) {
        try {
            const found = fs.readdirSync(currentDir).find(f => f.endsWith(".sln") || f.endsWith(".slnx"))
            if (found) {
                sln = found
                slnDir = currentDir
                break
            }
        } catch (e) {
            // ignore permission errors
        }
        const parentDir = path.dirname(currentDir)
        if (parentDir === currentDir) break // reached root
        currentDir = parentDir
    }

    if (!sln) {
        return null
    }
    const projectName = sln.endsWith('.slnx')
        ? sln.substring(0, sln.length - 5)
        : sln.substring(0, sln.length - 4)

    function getDir(slnDir:string, match:(file:string) => boolean) {
        if (fs.readdirSync(slnDir).find(match))
            return slnDir
        const dirs = fs.readdirSync(slnDir).filter(f => isDir(path.join(slnDir, f)))
        for (let dir of dirs) {
            try {
                const hasFile = fs.readdirSync(path.join(slnDir, dir)).find(match)
                if (hasFile)
                    return path.join(slnDir, dir)
            } catch (e) {
                // ignore
            }
        }
        return null
    }

    const hostDir = getDir(slnDir, f => f === `${projectName}.csproj`)
    if (!hostDir) {
        return null
    }

    const serviceModelDirName = fs.readdirSync(slnDir).find(f => f.endsWith("ServiceModel"))
    const serviceModelDir = serviceModelDirName
        ? path.join(slnDir, serviceModelDirName)
        : null

    const serviceInterfaceDirName = fs.readdirSync(slnDir).find(f => f.endsWith("ServiceInterface"))
    const serviceInterfaceDir = serviceInterfaceDirName
        ? path.join(slnDir, serviceInterfaceDirName)
        : null

    const migrationsDir = hostDir && fs.readdirSync(hostDir).find(f => f === "Migrations")
        ? path.join(hostDir, "Migrations")
        : null
    
    const info:ProjectInfo = {
        projectName,
        slnDir,
        hostDir,
        migrationsDir,
        serviceModelDir,
        serviceInterfaceDir,
    }

    const uiVueDir = path.join(hostDir, "wwwroot", "admin", "sections")
    if (fs.existsSync(uiVueDir)) {
        info.uiMjsDir = uiVueDir
    }

    for (const file of walk(serviceInterfaceDir, [], {
        include: (path) => path.endsWith(".cs"),
        excludeDirs: ["obj", "bin"]
    })) {
        const content = fs.readFileSync(file).toString()
        const userInfo = parseUserType(content)
        if (userInfo) {
            info.userType = userInfo.userType
            info.userIdType = userInfo.userIdType ?? 'string'
            break
        }
    }
    for (const file of walk(serviceModelDir, [], {
        include: (path) => path.endsWith(".cs"),
        excludeDirs: ["obj", "bin"]
    })) {
        const content = fs.readFileSync(file).toString()
        const dtoInfo = parseUserDtoType(content)
        if (dtoInfo?.userType) {
            info.userType = dtoInfo.userType
            if (dtoInfo.userIdType) info.userIdType = dtoInfo.userIdType
            if (dtoInfo.userLabel) info.userLabel = dtoInfo.userLabel
            break
        }
    }

    return config
        ? Object.assign({}, info, config)
        : info
}

export function parseUserType(cs:string) {
    const typePattern = /class\s+(\w+)\s*:\s*IdentityUser(?:<(.+)>)?/
    const match = cs.match(typePattern)
    if (!match) return null
    
    return {
        userType: match[1],           // Type name
        userIdType: match[2] || null // Generic arguments (content between < >)
    }
}

export function parseUserDtoType(cs:string) {
    const userAliasPos = cs.indexOf('[Alias("AspNetUsers")]')
    if (userAliasPos === -1) return null

    const typeMatch = cs.substring(userAliasPos).match(/class\s+(\w+)\s*/)
    if (!typeMatch) return null

    const idMatch = cs.substring(userAliasPos).match(/\s+(\w+\??)\s+Id\s+/i)

    const nameMatch = Array.from(cs.substring(userAliasPos).matchAll(/\s+(\w+Name)\s+/ig))
        .find(x => x[1].toLowerCase() !== 'username')?.[1]
    const userLabel = cs.includes('DisplayName')
        ? 'DisplayName'
        : nameMatch
            ? nameMatch
            : undefined

    return {
        userType: typeMatch[1], // DTO Type name
        userIdType: idMatch ? idMatch[1] : null,
        userLabel,
    }
}

function walk(dir: string, fileList: string[] = [], opt?: { include:(path:string) => boolean, excludeDirs:string[] }): string[] {
    if (!dir) return fileList
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
            if (!opt?.excludeDirs || !opt.excludeDirs.includes(file)) {
                walk(filePath, fileList, opt)
            }
        } else {
            if (!opt?.include || opt?.include(filePath)) {
                fileList.push(filePath)
            }
        }
    }
    return fileList
}

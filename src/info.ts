import type { ProjectInfo } from "./types"
import fs from "fs"
import path from "path"

export function projectInfo(cwd: string) : ProjectInfo {
    const config = fs.existsSync(path.join(cwd, "okai.json"))
        ? JSON.parse(fs.readFileSync(path.join(cwd, "okai.json")).toString())
        : null

    const parentDir = path.dirname(cwd)
    let slnDir = ''
    let sln = fs.readdirSync(cwd).find(f => f.endsWith(".sln"))
    if (sln) {
        slnDir = cwd
    } else {
        sln = fs.readdirSync(parentDir).find(f => f.endsWith(".sln"))
        if (sln) {
            slnDir = parentDir
        }
    }
    if (!sln) {
        if (config) return config
        return null
    }
    const projectName = sln.substring(0, sln.length - 4)

    function getDir(slnDir:string, match:(file:string) => boolean) {
        if (fs.readdirSync(slnDir).find(match))
            return slnDir
        const dirs = fs.readdirSync(slnDir).filter(f => fs.statSync(path.join(slnDir, f)).isDirectory())
        for (let dir of dirs) {
            const hasFile = fs.readdirSync(path.join(slnDir, dir)).find(match)
            if (hasFile)
                return path.join(slnDir, dir)
        }
        return null
    }

    const hostDir = getDir(slnDir, f => f === `${projectName}.csproj`)

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

    for (const file of walk(serviceInterfaceDir, [], {
        include: (path) => path.endsWith(".cs"),
        excludeDirs: ["obj", "bin"]
    })) {
        const content = fs.readFileSync(file).toString()
        const userInfo = parseTypeName(content)
        if (userInfo) {
            info.userType = userInfo.userType
            info.userIdType = userInfo.userIdType ?? 'string'
            break
        }
    }
    
    return config
        ? Object.assign({}, info, config)
        : info
}


function parseTypeName(cs:string) {
    const typePattern = /class\s+(\w+)\s*:\s*IdentityUser(?:<(.+)>)?/
    const match = cs.match(typePattern)
    if (!match) return null
    
    return {
        userType: match[1],           // Type name
        userIdType: match[2] || null // Generic arguments (content between < >)
    }
}

function walk(dir: string, fileList: string[] = [], opt?: { include:(path:string) => boolean, excludeDirs:string[] }): string[] {
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

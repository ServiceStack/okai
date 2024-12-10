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
        throw new Error("No .sln file found")
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

    const info = {
        projectName,
        slnDir,
        hostDir,
        migrationsDir,
        serviceModelDir,
        serviceInterfaceDir,
    }
    return config
        ? Object.assign({}, info, config)
        : info
}

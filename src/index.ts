import type { Gist, GistFile, ProjectInfo } from "./types"
import fs from "fs"
import path, { parse } from "path"
import blessed from 'blessed'
import { projectInfo } from './info'
import { getGroupName, leftPart, replaceMyApp, trimStart } from "./utils"
import { toAst } from "./ts-ast"
import { toMetadataTypes } from "./cs-ast"
import { CSharpApiGenerator } from "./cs-apis"
import { CSharpMigrationGenerator } from "./cs-migrations"
import { parseTsdHeader } from "./client"

type Command = {
  type:       "prompt" | "update" | "help" | "version" | "init" | "info" | "verbose" | "list" | "remove"
  prompt?:    string
  models?:    string
  tsdFile?:   string
  license?:   string
  watch?:     boolean
  init?:      boolean
  verbose?:   boolean
  ignoreSsl?: boolean
  debug?:     boolean
  unknown?:   string[]
  baseUrl:    string
  script:     string
  list?:      string
  info?:      ProjectInfo
}

function normalizeSwitches(cmd:string) { return cmd.replace(/^-+/, '/') }

function parseArgs(...args: string[]) : Command {
  const ret:Command = { 
    type: "help", 
    baseUrl: process.env.OKAI_URL || "https://okai.servicestack.com",
    script: path.basename(process.argv[1]) || "okai",
  }

  for (let i=0; i<args.length; i++) {
    const arg = args[i]
    const opt = normalizeSwitches(arg)
    if (opt.startsWith('/')) {
      switch (opt) {
        case "/?":
        case "/h":
        case "/help":
            ret.type = "help"
            break
        case "/v":
        case "/verbose":
            ret.verbose = true
            break
        case "/D":
            ret.verbose = ret.debug = true
            break
        case "/w":
        case "/watch":
            ret.watch = true
            break
        case "/m":
        case "/models":
            ret.models = args[++i]
            break            
        case "/l":
        case "/license":
            ret.license = args[++i]
            break
        default:
            ret.unknown = ret.unknown || []
            ret.unknown.push(arg)
            break
      }
    } else if (ret.type === "help" && ["help","info","init","ls","rm"].includes(arg)) {
      if (arg == "help")      ret.type = "help"
      else if (arg == "info") ret.type = "info"
      else if (arg == "init") ret.type = "init"
      else if (arg == "rm")   ret.type = "remove"
      else if (arg == "ls") {
        ret.type = "list"
        ret.list = args[++i]
      }
    } else if (arg.endsWith('.d.ts')) {
      if (ret.type == "help") ret.type = "update"
      ret.tsdFile = arg
    } else {
      ret.type = "prompt"
      if (ret.prompt) {
        ret.prompt += ' '
      }
      ret.prompt = (ret.prompt ?? '') + arg
    }
  }

  if (ret.type === "prompt") {
    if (!ret.models && process.env.OKAI_MODELS) {
      ret.models = process.env.OKAI_MODELS
    }
    if (ret.models && !ret.license && process.env.OKAI_LICENSE) {
      ret.license = process.env.OKAI_LICENSE
    }
  }
  
  return ret
}

export async function cli(cmdArgs:string[]) {
  const command = parseArgs(...cmdArgs)
  const script = command.script
  
  if (command.verbose) {
    console.log(`Command: ${JSON.stringify(command, undefined, 2)}`)    
  }
  if (command.debug) {
    process.exit(0)
    return
  }

  if (command.type === 'init') {
    let info = {}
    try {
      info = projectInfo(process.cwd())
    } catch (err) {
      info = {
        projectName: "",
        sln: "",
        slnDir: "",
        hostDir: "",
        migrationsDir: "",
        serviceModelDir: "",
        serviceInterfaceDir: "",
      }
    }
    fs.writeFileSync('okai.json', JSON.stringify(info, undefined, 2))
    process.exit(0)
    return
  }
  if (command.type === 'help' || command.unknown?.length) {
    const exitCode = command.unknown?.length ? -1 : 0
    if (command.unknown?.length) {
      console.log(`Unknown Command: ${command.script} ${command.unknown!.join(' ')}\n`)
    }
    console.log(`Usage: 
${script} init               - Initialize okai.json with project info to override default paths
${script} <prompt>           - Generate new APIs and Tables for the specified prompt
${script} <models>.d.ts      - Regenerate APIs and Tables for the specified TypeScript Definition models
${script} rm <models>.d.ts   - Remove data models and associated C# APIs, Tables and Migrations
${script} ls models          - Display list of available LLM models

Options:
    -m, -models <models,>    Specify up to 5 LLM models to generate .d.ts Data Models (env OKAI_MODELS)
    -l, -license <LC-xxx>    Specify valid license certificate to use premium models  (env OKAI_LICENSE)
    -v, -verbose             Display verbose logging
        --ignore-ssl-errors  Ignore SSL Errors`)
    process.exit(exitCode)
    return
  }

  const info = command.info = projectInfo(process.cwd())
  if (command.type === 'info') {
    try {
      console.log(JSON.stringify(command.info, undefined, 2))
    } catch (err:any) {
      console.error(err.message ?? `${err}`)
    }
    process.exit(0)
    return
  }
  
  if (command.ignoreSsl) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"        
  }

  if (command.type === 'list') {
    if (command.list == "models") {
      const url = new URL('/models/list', command.baseUrl)
      const res = await fetch(url)
      if (!res.ok) {
        console.log(`Failed to fetch models: ${res.statusText}`)
        process.exit(1)
      }
      const models = await res.text()
      console.log(models)
      process.exit(0)
      return
    }
  }

  function assertTsdPath(tsdFile:string) {
    const tryPaths = [
      path.join(process.cwd(), tsdFile),
    ]
    if (info?.serviceModelDir) {
      tryPaths.push(path.join(info.serviceModelDir, tsdFile))
    }
    const tsdPath = tryPaths.find(fs.existsSync)
    if (!tsdPath) {
      console.log(`Could not find: ${command.tsdFile}, tried:\n${tryPaths.join('\n')}`)
      process.exit(1)
    }
    return tsdPath
  }

  if (command.type === 'update') {
    let tsdPath = assertTsdPath(command.tsdFile)

    console.log(`Updating: ${tsdPath}...`)
    const tsdContent = fs.readFileSync(tsdPath, 'utf-8')
    const header = parseTsdHeader(tsdContent)
    console.log(JSON.stringify(header, undefined, 2))
    process.exit(0)
  }
  if (command.type === 'remove') {
    let tsdPath = assertTsdPath(command.tsdFile)

    if (command.verbose) console.log(`Removing: ${tsdPath}...`)
    const tsdContent = fs.readFileSync(tsdPath, 'utf-8')
    const header = parseTsdHeader(tsdContent)
    if (command.verbose) console.log(JSON.stringify(header, undefined, 2))

    if (header?.migration) {
      const migrationPath = header.migration.startsWith('~/') 
        ? path.join(info.slnDir, trimStart(header.migration, '~/'))
        : path.join(process.cwd(), header.migration)
      if (fs.existsSync(migrationPath)) {
        fs.unlinkSync(migrationPath)
        console.log(`Removed: ${migrationPath}`)
      } else {
        console.log(`Migration file not found: ${migrationPath}`)
      }
    }
    if (header?.api) {
      const apiPath = header.api.startsWith('~/')
        ? path.join(info.slnDir, trimStart(header.api, '~/'))
        : path.join(process.cwd(), header.api)
      if (fs.existsSync(apiPath)) {
        fs.unlinkSync(apiPath)
        console.log(`Removed: ${apiPath}`)
      } else {
        console.log(`APIs file not found: ${apiPath}`)
      }
    }
    fs.unlinkSync(tsdPath)
    console.log(`Removed: ${tsdPath}`)

    process.exit(0)
  }

  if (command.type === 'prompt') {
    try {
      if (!info.serviceModelDir) throw new Error("Could not find ServiceModel directory")
      console.log(`Generating new APIs and Tables for: ${command.prompt}...`)
      const gist = await fetchGistFiles(command.baseUrl, command.prompt)
      // const projectGist = convertToProjectGist(info, gist)
      const ctx = await createGistPreview(command.prompt, gist)
      ctx.screen.key('a', () => chooseFile(ctx, info, gist))
      // ctx.screen.key('a', () => applyCSharpGist(ctx, info, gist, { accept: true }))
      // ctx.screen.key('d', () => applyCSharpGist(ctx, info, gist, { discard: true }))
      // ctx.screen.key('S-a', () => applyCSharpGist(ctx, info, gist, { acceptAll: true }))
      ctx.screen.render()
    } catch (err) {
      console.error(err)
    }
  }
}

async function fetchGistFiles(baseUrl:string, text:string) {
  const url = new URL('/models/gist', baseUrl)
  if (process.env.OKAI_CACHED) {
    url.searchParams.append('cached', `1`)
  }
  url.searchParams.append('text', text)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to generate files: ${res.statusText}`)
  }
  const gist = await res.json()
  const files = gist.files
  if (!files || Object.keys(files).length === 0) {
    throw new Error(`Request didn't generate any files`)
  }
  return gist as Gist
}

// When writing to disk, replace MyApp with the project name
function convertToProjectGist(info: ProjectInfo, gist: Gist) {
  const to = Object.assign({}, gist, { files: {} })
  const cwd = process.cwd()
  for (const [displayName, file] of Object.entries(gist.files)) {
    const writeFileName = file.filename
    const type = `text/csharp`
    const content = replaceMyApp(file.content, info.projectName)
    const size = content.length
    if (writeFileName.startsWith('MyApp.ServiceModel/') && info.serviceModelDir) {
      const fullPath = path.join(info.serviceModelDir, writeFileName.substring('MyApp.ServiceModel/'.length))
      const relativePath = path.relative(cwd, fullPath)
      to.files[relativePath] = {
        filename: path.basename(fullPath),
        content,
        type,
        size,
      }

    } else if (writeFileName.startsWith('MyApp/Migrations/') && info.migrationsDir) {
      const fullPath = path.join(info.migrationsDir, writeFileName.substring('MyApp.Migrations/'.length))
      const relativePath = path.relative(cwd, fullPath)
      to.files[relativePath] = Object.assign({}, file, {
        filename: path.basename(fullPath),
        content,
        type,
        size,
      })
    } else {
      const fullPath = path.join(info.slnDir, writeFileName)
      const relativePath = path.relative(cwd, fullPath)
      const toFilename = replaceMyApp(relativePath, info.projectName)
      to.files[relativePath] = Object.assign({}, file, {
        filename: path.basename(toFilename),
        content,
        type,
        size,
      })
    }
  }
  return to
}

async function createGistPreview(title:string, gist:Gist) {
  // Initialize screen
  const screen = blessed.screen({
    smartCSR: true,
    title,
  })

  // Create title bar
  const titleBar = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ` ${title}`,
    style: {
      fg: 'black',
      bg: 'white'
    }
  })

  // Create file list
  const fileList = blessed.list({
    left: 0,
    top: 1,
    width: '35%',
    height: '95%-1',
    border: {
      type: 'line'
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white'
      }
    },
    keys: true,
    vi: true,
    mouse: true,
    items: Object.keys(gist.files)
  })

  const firstFilename = Object.keys(gist.files)[0]
  // Create preview pane
  const preview = blessed.box({
    right: 0,
    top: 1,
    width: '65%',
    height: '95%-1',
    border: {
      type: 'line'
    },
    content: gist.files[firstFilename].content,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    mouse: true
  })

  // Create status bar
  const statusBar = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: 'Press (a) accept  (q) quit',
    style: {
      fg: 'white',
      bg: 'blue'
    }
  })

  // Add components to screen
  screen.append(titleBar)
  screen.append(fileList)
  screen.append(preview)
  screen.append(statusBar)

  const result = {
    selectedFile: firstFilename
  }

  // Handle file selection
  fileList.on('select item', (item) => {
    const filename = item.content
    result.selectedFile = filename
    const file = gist.files[filename]
    if (file) {
      preview.setContent(file.content)
      screen.render()
    }
  })

  // Handle key events
  screen.key(['q', 'C-c'], () => process.exit(0))

  // Focus on file list
  fileList.focus()

  // Render screen
  return { screen, titleBar, fileList, preview, statusBar, result }
}

function chooseFile(ctx:Awaited<ReturnType<typeof createGistPreview>>, info:ProjectInfo, gist:Gist) {
  const { screen, titleBar, fileList, preview, statusBar, result } = ctx
  const file = gist.files[result.selectedFile] as GistFile
  screen.destroy()
  const tsd = file.content
  const tsdAst = toAst(tsd)
  const csAst = toMetadataTypes(tsdAst)
  const groupName = getGroupName(csAst)

  const genApis = new CSharpApiGenerator()
  const csApiFiles = genApis.generate(csAst)

  const getMigrations = new CSharpMigrationGenerator()
  const csMigrationFiles = getMigrations.generate(csAst)

  const relativeServiceModelDir = trimStart(info.serviceModelDir.substring(info.slnDir.length), '~/')
  const relativeMigrationDir = trimStart(info.migrationsDir.substring(info.slnDir.length), '~/')

  const apiFileName = `${groupName}.cs`
  const apiContent = replaceMyApp(csApiFiles[Object.keys(csApiFiles)[0]], info.projectName)

  const migrationPath = resolveMigrationFile(path.join(info.migrationsDir, `Migration1000.cs`))
  const migrationFileName = path.basename(migrationPath)
  const migrationCls = leftPart(migrationFileName, '.')
  const migrationContent = replaceMyApp(csMigrationFiles[Object.keys(csMigrationFiles)[0]].replaceAll('Migration1000', migrationCls), info.projectName)

  const sb:string[] = []
  sb.push(`/*prompt: ${titleBar.content.replaceAll('/*', '').replaceAll('*/', '')}`)
  sb.push(`api:       ~/${path.join(relativeServiceModelDir,apiFileName)}`)
  sb.push(`migration: ~/${path.join(relativeMigrationDir,migrationFileName)}`)
  sb.push(`*/`)
  sb.push('')
  sb.push(tsd)
  const tsdContent = sb.join('\n')

  const tsdFileName = `${groupName}.d.ts`
  const fullTsdPath = path.join(info.slnDir,relativeServiceModelDir,tsdFileName)
  const fullApiPath = path.join(info.slnDir,relativeServiceModelDir,apiFileName)
  const fullMigrationPath = path.join(info.slnDir,relativeMigrationDir,migrationFileName)

  if (!fs.existsSync(path.dirname(fullTsdPath))) {
    console.log(`Directory does not exist: ${path.dirname(fullTsdPath)}`)
    process.exit(0)
  }
  console.log(`\nSelected '${result.selectedFile}' data models`)
  fs.writeFileSync(fullTsdPath, tsdContent, { encoding: 'utf-8' })
  console.log(`\nSaved: ${fullTsdPath}`)
  if (fs.existsSync(path.dirname(fullApiPath))) {
    fs.writeFileSync(fullApiPath, apiContent, { encoding: 'utf-8' })
    console.log(`Saved: ${fullApiPath}`)
  }
  if (fs.existsSync(path.dirname(fullMigrationPath))) {
    fs.writeFileSync(fullMigrationPath, migrationContent, { encoding: 'utf-8' })
    console.log(`Saved: ${fullMigrationPath}`)
  }

  const script = path.basename(process.argv[1])
  console.log(`\nTo regenerate classes, update '${tsdFileName}' then run:`)
  console.log(`$ ${script} ${tsdFileName}`)

  process.exit(0)
}

function writeFile(info:ProjectInfo, filename: string, content:string) {
  let fullPath = path.join(process.cwd(), filename)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (fs.existsSync(fullPath)) {
    const filename = path.basename(fullPath)
    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    // filename: Migration1000.cs, baseName: Migration1000, ext: .cs
    // console.log(`File already exists: ${fullPath}`, { filename, baseName, ext })
    const numberedFile = baseName.match(/(\d+)$/)
    if (numberedFile) {
      let nextNumber = parseInt(numberedFile[1])
      while (fs.existsSync(fullPath)) {
        if (numberedFile) {
          nextNumber += 1
          fullPath = path.join(dir, `${baseName.replace(/\d+$/, '')}${nextNumber}${ext}`)
        }
      }
      const renamedFile = `${baseName.replace(/\d+$/, '')}${nextNumber}`
      content = content.replaceAll(baseName, renamedFile)
    }
  }
  fs.writeFileSync(fullPath, content)
}

function resolveMigrationFile(fullPath:string) {
  const dir = path.dirname(fullPath)
  const filename = path.basename(fullPath)
  const ext = path.extname(filename)
  const baseName = path.basename(filename, ext)
  // filename: Migration1000.cs, baseName: Migration1000, ext: .cs
  // console.log(`File already exists: ${fullPath}`, { filename, baseName, ext })
  const numberedFile = baseName.match(/(\d+)$/)
  if (numberedFile) {
    let nextNumber = parseInt(numberedFile[1])
    while (fs.existsSync(fullPath)) {
      if (numberedFile) {
        nextNumber += 1
        fullPath = path.join(dir, `${baseName.replace(/\d+$/, '')}${nextNumber}${ext}`)
      }
    }
  }
  return fullPath
}

function exit(screen:blessed.Widgets.Screen, info:ProjectInfo, gist:Gist) {
  screen.destroy()
  if (info.migrationsDir) {
    console.log(`\nRun 'dotnet run --AppTasks=migrate' to apply any new migrations and create the new tables`)
  }
  process.exit(0)
}

function applyCSharpGist(ctx:Awaited<ReturnType<typeof createGistPreview>>, 
  info:ProjectInfo, gist:Gist, 
  { accept = false, acceptAll = false, discard = false }) {
  const { screen, titleBar, fileList, preview, statusBar, result } = ctx

  function removeSelected() {    
    delete gist.files[result.selectedFile]
    fileList.removeItem(result.selectedFile)
    const nextFile = Object.keys(gist.files)[0]
    if (nextFile) {
      result.selectedFile = nextFile
      const nextFileIndex = fileList.getItemIndex(nextFile)
      fileList.select(nextFileIndex)
      preview.setContent(gist.files[nextFile].content)
    }
    screen.render()
    if (Object.keys(gist.files).length === 0) {
      //screen.destroy()
      exit(screen, info, gist)
    }
  }

  if (discard) {
    const file = gist.files[result.selectedFile]
    removeSelected()
  } else if (accept) {
    const file = gist.files[result.selectedFile]
    writeFile(info, result.selectedFile, file.content)
    removeSelected()
  } else if (acceptAll) {
    for (const [filename, file] of Object.entries(gist.files)) {
      writeFile(info, filename, file.content)
    }
    exit(screen, info, gist)
  }
}

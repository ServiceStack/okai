import type { Gist, GistFile, ProjectInfo } from "./types"
import fs from "fs"
import path from "path"
import blessed from 'blessed'
import { projectInfo } from './info'
import { getGroupName, leftPart, replaceMyApp, trimStart } from "./utils"
import { toAst } from "./ts-ast"
import { toMetadataTypes } from "./cs-ast"
import { CSharpApiGenerator } from "./cs-apis"
import { CSharpMigrationGenerator } from "./cs-migrations"

type Command = {
  type:       "prompt" | "update" | "help" | "version" | "init" | "info" | "verbose" | "list"
  prompt?:    string
  models?:    string
  tsdFile?:   string
  license?:   string
  watch?:     boolean
  init?:      boolean
  verbose?:   boolean
  ignoreSsl?: boolean
  unknown?:   string[]
  baseUrl:    string
  list?:      string
  info?:      ProjectInfo
}

function normalizeSwitches(cmd:string) { return cmd.replace(/^-+/, '/') }

function parseArgs(...args: string[]) : Command {
  const ret:Command = { type: "help", baseUrl: "https://okai.servicestack.com" }
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
        case "/verbose":
            ret.verbose = true
            break
        case "/w":
        case "/watch":
            ret.watch = true
            break
        case "/models":
            ret.models = args[++i]
            break            
        case "/license":
            ret.license = args[++i]
            break
        case "/list":
        case "/ls":
            ret.type = "list"
            ret.list = args[++i]
            break
        default:
            ret.unknown = ret.unknown || []
            ret.unknown.push(arg)
            break
      }
    } else if (arg.endsWith('.d.ts')) {
      ret.type = "update"
      ret.tsdFile = arg
    } else if (ret.type === "help" && ["info","init"].includes(arg)) {
      if (arg == "info") ret.type = "info"
      else if (arg == "init") ret.type = "init"      
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

  const script = path.basename(process.argv[1])
  const command = parseArgs(...cmdArgs)

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
  if (command.type === 'help') {
    console.log(`Usage: 
${script} init          - Initialize okai.json with project info to override default paths
${script} <prompt>      - Generate new APIs and Tables for the specified prompt
${script} <models>.d.ts - Regenerate APIs and Tables for the specified TypeScript Definition models

Options:
    -h, --help, ?             Print this message
        --list models         Display list of available LLM models
        --models <models>     Specify up to 5 LLM models to use to generate .d.ts Data Models
        --verbose             Display verbose logging
        --ignore-ssl-errors   Ignore SSL Errors`)
    process.exit(0)
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
  if (process.env.OKAI_URL) {
    command.baseUrl = process.env.OKAI_URL as string
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
  sb.push(`/*prompt: ${titleBar.content}`)
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

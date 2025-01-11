import type { Gist, GistFile, ProjectInfo, TsdHeader } from "./types"
import fs from "fs"
import path from "path"
import blessed from 'blessed'
import { projectInfo } from './info.js'
import { parseTsdHeader, toTsdHeader, leftPart, replaceMyApp, trimStart, toPascalCase, plural } from "./utils.js"
import { generateCsAstFromTsd, toAst, astForProject } from "./ts-ast.js"
import { CSharpApiGenerator } from "./cs-apis.js"
import { CSharpMigrationGenerator } from "./cs-migrations.js"
import { getFileContent } from "./client.js"
import { toTsd } from "./tsd-gen.js"
import { UiMjsGroupGenerator, UiMjsIndexGenerator } from "./ui-mjs.js"

type Command = {
  type:       "prompt" | "update" | "help" | "version" | "init" | "info" | "verbose" | "list" | "add" | "remove" | "accept" | "chat"
  prompt?:    string
  models?:    string
  tsdFile?:   string
  license?:   string
  watch?:     boolean
  verbose?:   boolean
  ignoreSsl?: boolean
  debug?:     boolean
  cached?:    boolean
  system?:    string
  unknown?:   string[]
  baseUrl:    string
  script:     string
  list?:      string
  add?:       string
  accept?:    string
  init?:      string
  chat?:      string
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
        case "/url":
            ret.baseUrl = args[++i]
            break
        case "/cached":
            ret.cached = true
            break
        case "/system":
            ret.system = args[++i]
            break
        default:
            ret.unknown = ret.unknown || []
            ret.unknown.push(arg)
            break
      }
    } else if (ret.type === "help" && ["help","info","init","ls","add","rm","update","accept"].includes(arg)) {
      if (arg == "help")      ret.type = "help"
      else if (arg == "info") ret.type = "info"
      else if (arg == "init") {
        ret.type = "init"
        if (args[i+1]) {
          ret.init = args[++i]
        }
      }
      else if (arg == "update") {
        ret.type = "update"
        ret.tsdFile = args[++i]
        if (ret.tsdFile && !ret.tsdFile.endsWith('.d.ts')) {
          ret.tsdFile += '.d.ts'
        }        
      } else if (arg == "rm") {
        ret.type = "remove"
        ret.tsdFile = args[++i]
        if (ret.tsdFile && !ret.tsdFile.endsWith('.d.ts')) {
          ret.tsdFile += '.d.ts'
        }        
      } else if (arg == "ls") {
        ret.type = "list"
        ret.list = args[++i]
      } else if (arg == "add") {
        ret.type = "add"
        ret.add = args[++i]
      } else if (arg == "accept") {
        ret.type = "accept"
        ret.accept = args[++i]
      }
    } else if (arg == "chat") {
      ret.type = "chat"
      ret.chat = args[++i]
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
    if (!ret.cached && process.env.OKAI_CACHED) {
      ret.cached = true
    }
    if (!ret.models && process.env.OKAI_MODELS) {
      ret.models = process.env.OKAI_MODELS
    }
    if (ret.models) {
      if (!ret.license && process.env.SERVICESTACK_CERTIFICATE) {
        ret.license = process.env.SERVICESTACK_CERTIFICATE
      }
      if (!ret.license && process.env.SERVICESTACK_LICENSE) {
        ret.license = process.env.SERVICESTACK_LICENSE
      }
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

    console.log(`Environment:`)
    Object.keys(process.env).forEach(k => {
      console.log(`${k}: ${process.env[k]}`)
    })

    process.exit(0)
    return
  }

  if (command.type === "init" && !command.init) {
    let info = projectInfo(process.cwd()) ?? {
      projectName: "<MyApp>",      
      slnDir: "/path/to/.sln/folder",
      hostDir: "/path/to/MyApp",
      migrationsDir: "/path/to/MyApp/Migrations",
      serviceModelDir: "/path/to/MyApp.ServiceModel",
      serviceInterfaceDir: "/path/to/MyApp.ServiceInterfaces",
      uiMjsDir: "/path/to/MyApp/wwwroot/admin/sections",
    }
    fs.writeFileSync('okai.json', JSON.stringify(info, undefined, 2))
    console.log(`Added: okai.json`)
    process.exit(0)
    return
  }
  if (command.type === "help" || command.unknown?.length) {
    const exitCode = command.unknown?.length ? 1 : 0
    if (command.unknown?.length) {
      console.log(`Unknown Command: ${command.script} ${command.unknown!.join(' ')}\n`)
    }
    const bin = script.padStart(7, ' ')
    console.log(`Usage: 
${bin} <prompt>             Generate new TypeScript Data Models, C# APIs and Migrations from prompt
    -m, -models <model,>     Specify up to 5 LLM models to generate .d.ts Data Models
    -l, -license <LC-xxx>    Specify valid license certificate or key to use premium models

${bin} <models>.d.ts        Regenerate C# *.cs files for Data Models defined in the TypeScript .d.ts file
    -w, -watch               Watch for changes to <models>.d.ts and regenerate *.cs on save

${bin} rm <models>.d.ts     Remove <models>.d.ts and its generated *.cs files
${bin} ls models            Display list of available premium LLM models
${bin} init                 Initialize okai.json with project info to override default paths
${bin} init <model>         Create an empty <model>.d.ts file for the specified model
${bin} info                 Display current project info
${bin} chat <prompt>        Submit a new OpenAI chat request with the specified prompt
    -system <prompt>         Specify a system prompt

Options:
    -v, -verbose             Display verbose logging
        --ignore-ssl-errors  Ignore SSL Errors`)

        process.exit(exitCode)
    return
  }

  const info = command.info = projectInfo(process.cwd())
  if (!info) {
    if (!info) {
      console.log(`No .sln file found`)
      console.log(`okai needs to be run within a ServiceStack App that contains a ServiceModel project`)
      console.log(`To use with an external or custom project, create an okai.json config file with:`)
      console.log(`$ ${script} init`)
      process.exit(1)
    }
  }

  if (command.type === "info") {
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

  if (command.type === "list") {
    if (command.list == "models") {
      const url = new URL('/models/list', command.baseUrl)
      if (command.verbose) console.log(`GET: ${url}`)
      const res = await fetch(url)
      if (!res.ok) {
        console.log(`Failed to fetch models: ${res.statusText}`)
        process.exit(1)
      }
      const models = await res.text()
      console.log(models)
      process.exit(0)
    }
  }

  if (command.type == "init" && command.info) {
    const toApiFile = path.join(info.serviceModelDir, 'api.d.ts')
    fs.copyFileSync(path.join(import.meta.dirname, 'api.d.ts'), toApiFile)
    console.log(`Added: ${toApiFile}`)

    let model = toPascalCase(leftPart(command.init, '.'))
    let groupName = plural(model)
    if (model == groupName) {
      if (model.endsWith('s')) {
        model = model.substring(0, model.length - 1)
      }
    }
    
    let tsd = `
      export class ${model} {
        id:number
        name:string
      }
    `
    const tsdAst = toAst(tsd)
    if (tsdAst.references.length == 0) {
      tsdAst.references.push({ path: './api.d.ts' })
    }
    tsd = toTsd(tsdAst)
    let uiFileName = info.uiMjsDir 
      ? path.join(info.uiMjsDir, `${groupName}.mjs`)
      : null

    const tsdContent = createTsdFile(info, {
      prompt:`New ${model}`, 
      apiFileName:`${groupName}.cs`, 
      tsd,
      uiFileName,
    })
    command.type = "update" // let update handle the rest
    command.tsdFile = groupName + '.d.ts'
    fs.writeFileSync(path.join(info.serviceModelDir, command.tsdFile), tsdContent, { encoding: 'utf-8' })
  }

  if (command.type === "add") {
    if (command.add == "types" || command.add?.startsWith("api")) {
      const apiFile = path.join(import.meta.dirname, 'api.d.ts')
      if (!fs.existsSync(apiFile)) {
        console.log(`Could not find: ${apiFile}`)
        process.exit(1)
      }

      const toFile = path.join(info.serviceModelDir, 'api.d.ts')
      fs.copyFileSync(apiFile, toFile)
      console.log(`Added: ${toFile}`)
      process.exit(0)
    } else {
      console.log(`Unknown add command: ${command.add}`)
      console.log(`Usage:  add types`)
      process.exit(1)
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
  function resolveFile(filePath:string) {
    return filePath.startsWith('~/') 
        ? path.join(info.slnDir, trimStart(filePath, '~/'))
        : path.join(process.cwd(), filePath)
  }

  if (command.type === "update") {
    let tsdPath = assertTsdPath(command.tsdFile)

    if (command.verbose) console.log(`Updating: ${tsdPath}...`)
    let tsdContent = fs.readFileSync(tsdPath, 'utf-8')
    const header = parseTsdHeader(tsdContent)
    if (command.verbose) console.log(JSON.stringify(header, undefined, 2))

    function regenerate(header:TsdHeader, tsdContent:string, logPrefix = '') {
  
      const result = generateCsAstFromTsd(tsdContent)
      tsdContent = result.tsd
    
      const genApis = new CSharpApiGenerator()
      const csApiFiles = genApis.generate(result.csAst)
      const apiContent = replaceMyApp(csApiFiles[Object.keys(csApiFiles)[0]], info.projectName)
      const apiPath = resolveFile(header.api)
      console.log(`${logPrefix}${apiPath}`)
      fs.writeFileSync(apiPath, apiContent, { encoding: 'utf-8' })
  
      if (header?.migration) {
        const migrationCls = leftPart(path.basename(header.migration), '.')
        const getMigrations = new CSharpMigrationGenerator()
        const csMigrationFiles = getMigrations.generate(result.csAst)
        const migrationContent = replaceMyApp(csMigrationFiles[Object.keys(csMigrationFiles)[0]].replaceAll('Migration1000', migrationCls), info.projectName)
        const migrationPath = resolveFile(header.migration)
        console.log(`${logPrefix}${migrationPath}`)
        fs.writeFileSync(migrationPath, migrationContent, { encoding: 'utf-8' })
      }

      if (header?.uiMjs) {
        const uiMjsGroupPath = resolveFile(header.uiMjs)

        const uiMjsGroupGen = new UiMjsGroupGenerator()
        const uiMjsGroup = uiMjsGroupGen.generate(result.csAst, result.groupName)
        console.log(`${logPrefix}${uiMjsGroupPath}`)
        fs.writeFileSync(uiMjsGroupPath, uiMjsGroup, { encoding: 'utf-8' })

        const uiMjsDir = path.dirname(uiMjsGroupPath)
        const uiMjsIndexGen = new UiMjsIndexGenerator()
        const uiMjsIndex = uiMjsIndexGen.generate(fs.readdirSync(uiMjsDir))
        const uiMjsIndexPath = path.join(uiMjsDir, 'index.mjs')
        console.log(`${logPrefix}${uiMjsIndexPath}`)
        fs.writeFileSync(uiMjsIndexPath, uiMjsIndex, { encoding: 'utf-8' })        
      }
  
      console.log(`${logPrefix}${tsdPath}`)
      const newTsdContent = toTsdHeader(header) + (tsdContent.startsWith('///') ? '' : '\n\n') + tsdContent
      fs.writeFileSync(tsdPath, newTsdContent, { encoding: 'utf-8' })
      return newTsdContent
    }

    if (command.watch) {
      let lastTsdContent = tsdContent
      console.log(`watching ${tsdPath} ...`)
      let i = 0
      fs.watchFile(tsdPath, { interval: 100 }, (curr, prev) => {
        let tsdContent = fs.readFileSync(tsdPath, 'utf-8')
        if (tsdContent == lastTsdContent) {
          if (command.verbose) console.log(`No change detected`)
          return
        }
        console.log(`\n${++i}. regenerated files at ${leftPart(new Date().toTimeString(), ' ')}:`)
        lastTsdContent = regenerate(header,tsdContent)
      })
      return
    } else {
    
      regenerate(header,tsdContent,'saved: ')
      console.log(`\nLast migration can be rerun with 'npm run rerun:last' or:`)
      console.log(`$ dotnet run --AppTasks=migrate.rerun:last`)
    
      process.exit(0)
    }
  }
  if (command.type === "remove") {
    let tsdPath = assertTsdPath(command.tsdFile)

    if (command.verbose) console.log(`Removing: ${tsdPath}...`)
    const tsdContent = fs.readFileSync(tsdPath, 'utf-8')
    const header = parseTsdHeader(tsdContent)
    if (command.verbose) console.log(JSON.stringify(header, undefined, 2))

    if (header?.migration) {
      const migrationPath = resolveFile(header.migration)
      if (fs.existsSync(migrationPath)) {
        fs.unlinkSync(migrationPath)
        console.log(`Removed: ${migrationPath}`)
      } else {
        console.log(`Migration .cs file not found: ${migrationPath}`)
      }
    }
    if (header?.api) {
      const apiPath = resolveFile(header.api)
      if (fs.existsSync(apiPath)) {
        fs.unlinkSync(apiPath)
        console.log(`Removed: ${apiPath}`)
      } else {
        console.log(`APIs .cs file not found: ${apiPath}`)
      }
    }
    if (header?.uiMjs) {
      const uiMjsGroupPath = resolveFile(header.uiMjs)
      if (fs.existsSync(uiMjsGroupPath)) {
        fs.unlinkSync(uiMjsGroupPath)
        console.log(`Removed: ${uiMjsGroupPath}`)
        const uiMjsDir = path.dirname(uiMjsGroupPath)
        const uiMjsIndexGen = new UiMjsIndexGenerator()
        const uiMjsIndex = uiMjsIndexGen.generate(fs.readdirSync(uiMjsDir))
        const uiMjsIndexPath = path.join(uiMjsDir, 'index.mjs')
        fs.writeFileSync(uiMjsIndexPath, uiMjsIndex, { encoding: 'utf-8' })        
      } else {
        console.log(`UI .mjs file not found: ${uiMjsGroupPath}`)
      }
    }
    fs.unlinkSync(tsdPath)
    console.log(`Removed: ${tsdPath}`)

    const serviceModelDir = path.dirname(tsdPath)
    const tsds = fs.readdirSync(serviceModelDir).filter(x => x.endsWith('.d.ts'))
    if (tsds.length == 1 && tsds[0] == 'api.d.ts') {
      const typesApiPath = path.join(serviceModelDir, 'api.d.ts')
      fs.unlinkSync(typesApiPath)
      console.log(`Removed: ${typesApiPath}`)
    }

    process.exit(0)
  }

  if (command.type == "accept") {
    await acceptGist(command, command.accept)
    process.exit(0)
  }

  if (command.type === "chat") {
    try {
      const url = new URL('/chat', command.baseUrl)
      const formData = new FormData()
      formData.append('prompt', command.chat)
      if (command.system) {
        formData.append('system', command.system)
      }
      if (command.models) {
        formData.append('model', command.models)
        if (command.license) {
          formData.append('license', command.license)
        }
      }
      if (command.verbose) console.log(`POST: ${url}`)
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        console.log(`Failed to chat: ${res.statusText}`)
        process.exit(1)
      }
      const response = await res.json()
      if (command.verbose) console.log(JSON.stringify(response, undefined, 2))
      const content = response.choices[response.choices.length - 1]?.message?.content
      console.log(content)
    } catch (err) {
      console.error(err)
    }
    process.exit(0)
  }

  if (command.type === "prompt") {
    try {
      if (!info.serviceModelDir) throw new Error("Could not find ServiceModel directory")
      console.log(`Generating new APIs and Tables for: ${command.prompt}...`)
      const gist = await fetchGistFiles(command)
      // const projectGist = convertToProjectGist(info, gist)
      const ctx = await createGistPreview(command.prompt, gist)
      ctx.screen.key('a', () => chooseFile(ctx, info, gist, command))
      ctx.screen.render()
    } catch (err) {
      console.error(err)
    }
  } else {
    console.log(`Unknown command: ${command.type}`)
    process.exit(1)
  }
}

async function acceptGist(command:Command, id:string) { 
  try {
    const url = new URL(`/gist/${id}/accept`, command.baseUrl)
    if (command.verbose) console.log(`POST: ${url}`)
    const r = await fetch(url, {
      method: 'POST',
    })
    const res = await r.text()
    if (command.verbose) console.log(`Accepted: ${res}`)
  } catch (err) {
    if (command.verbose) console.error(err)
  }
}

async function fetchGistFiles(command:Command) {
  const url = new URL('/models/gist', command.baseUrl)
  const formData = new FormData()
  if (command.cached) {
    formData.append('cached', `1`)
  }
  formData.append('prompt', command.prompt)
  if (command.models) {
    formData.append('models', command.models)
    if (command.license) {
      formData.append('license', command.license)
    }
  }
  
  if (command.verbose) console.log(`POST: ${url}`)
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    try {
      const errorResponse = await res.json()
      console.error(errorResponse?.responseStatus?.message ?? errorResponse.message ?? errorResponse)
    } catch (err) {
      console.log(`Failed to generate data models: ${res.statusText}`)
    }
    process.exit(1)
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
        raw_url: fullPath,
      }

    } else if (writeFileName.startsWith('MyApp/Migrations/') && info.migrationsDir) {
      const fullPath = path.join(info.migrationsDir, writeFileName.substring('MyApp.Migrations/'.length))
      const relativePath = path.relative(cwd, fullPath)
      to.files[relativePath] = Object.assign({}, file, {
        filename: path.basename(fullPath),
        content,
        type,
        size,
        raw_url: fullPath,
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
        raw_url: fullPath,
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
        fg: 'black'
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
    content: getFileContent(gist.files[firstFilename]),
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
      fg: 'black',
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
      const content = getFileContent(file)
      preview.setContent(content)
      screen.render()
    }
  })

  fileList.on('keypress', (ch, key) => {
    const boxHeight = preview.height as number
    const currentScroll = preview.getScroll()
    const contentHeight = preview.getLines().length
  
    // Calculate scroll amount (half the box height)
    const scrollAmount = Math.floor(boxHeight / 2)
  
    // Page Up handler
    if (key.name === 'pageup') {
      // Calculate new scroll position, ensuring it doesn't go below 0
      const newScrollPosition = Math.max(0, currentScroll - scrollAmount)
      preview.setScroll(newScrollPosition)
      // titleBar.setContent(`UP ${newScrollPosition} = ${currentScroll} - ${scrollAmount}`)
      screen.render()
    }
    
    // Page Down handler
    if (key.name === 'pagedown') {
      // Calculate max scroll position to prevent scrolling beyond content
      const maxScroll = Math.max(0, contentHeight - boxHeight + 2)
      // Calculate new scroll position, ensuring it doesn't exceed max
      const newScrollPosition = Math.min(maxScroll, currentScroll + scrollAmount)
      preview.setScroll(newScrollPosition)
      // titleBar.setContent(`DOWN ${maxScroll} = ${contentHeight} - ${boxHeight}; min(${maxScroll}, ${currentScroll} + ${scrollAmount}) => ${newScrollPosition}`)
      screen.render()
    }

    // Home key handler (scroll to top)
    if (key.name === 'home') {
      preview.setScroll(0)
      screen.render()
    }

    // End key handler (scroll to bottom)
    if (key.name === 'end') {
      // Calculate max scroll position to show last page of content
      const maxScroll = Math.max(0, contentHeight - boxHeight + 2)
      preview.setScroll(maxScroll)
      screen.render()
    }

  })

  // Handle key events
  screen.key(['q', 'C-c'], () => process.exit(0))
  // screen.on('keypress', (ch, key) => {
  //   console.log('keypress', ch, key)
  // })

  // Focus on file list
  fileList.focus()

  // Render screen
  return { screen, titleBar, fileList, preview, statusBar, result }
}

function chooseFile(ctx:Awaited<ReturnType<typeof createGistPreview>>, info:ProjectInfo, gist:Gist, comamnd:Command) {
  const { screen, titleBar, fileList, preview, statusBar, result } = ctx
  const file = gist.files[result.selectedFile] as GistFile
  screen.destroy()
  console.clear()

  let acceptTask = null
  if (file.raw_url) {
    const acceptUrl = path.join(file.raw_url, 'accept')
    if (comamnd.verbose) console.log(`POST ${acceptUrl}`)
    acceptTask = fetch(acceptUrl, { method: 'POST' })
  } 

  const origTsd = file.content
  const tsdAst = astForProject(toAst(origTsd), info)
  const res = generateCsAstFromTsd(toTsd(tsdAst), { references:[`./api.d.ts`] })

  const genApis = new CSharpApiGenerator()
  const csApiFiles = genApis.generate(res.csAst)

  const getMigrations = new CSharpMigrationGenerator()
  const csMigrationFiles = getMigrations.generate(res.csAst)

  const relativeServiceModelDir = trimStart(info.serviceModelDir.substring(info.slnDir.length), '~/')
  const relativeMigrationDir = trimStart(info.migrationsDir.substring(info.slnDir.length), '~/')

  const apiFileName = `${res.groupName}.cs`
  const apiContent = replaceMyApp(csApiFiles[Object.keys(csApiFiles)[0]], info.projectName)

  const migrationPath = resolveMigrationFile(path.join(info.migrationsDir, `Migration1000.cs`))
  const migrationFileName = path.basename(migrationPath)
  const migrationCls = leftPart(migrationFileName, '.')
  const migrationContent = replaceMyApp(csMigrationFiles[Object.keys(csMigrationFiles)[0]].replaceAll('Migration1000', migrationCls), info.projectName)

  const apiTypesPath = path.join(info.slnDir,relativeServiceModelDir,`api.d.ts`)
  const apiFile = path.join(import.meta.dirname, 'api.d.ts')
  fs.writeFileSync(apiTypesPath, fs.readFileSync(apiFile, 'utf-8'))

  let uiFileName = null
  if (info.uiMjsDir) {
    uiFileName = `${res.groupName}.mjs`
    const uiGroupPath = path.join(info.uiMjsDir, uiFileName)
    const uiVueGen = new UiMjsGroupGenerator()
    const uiGroupSrc = uiVueGen.generate(res.csAst, res.groupName)
    fs.writeFileSync(uiGroupPath, uiGroupSrc)
    const uiIndexGen = new UiMjsIndexGenerator()
    const uiIndexSrc = uiIndexGen.generate(fs.readdirSync(info.uiMjsDir))
    fs.writeFileSync(path.join(info.uiMjsDir, `index.mjs`), uiIndexSrc)
  }

  const tsdContent = createTsdFile(info, {
      prompt: titleBar.content.replaceAll('/*', '').replaceAll('*/', ''), 
      apiFileName, 
      tsd: res.tsd,
      uiFileName,
    })

  const tsdFileName = `${res.groupName}.d.ts`
  const fullTsdPath = path.join(info.slnDir,relativeServiceModelDir,tsdFileName)
  const fullApiPath = path.join(info.slnDir,relativeServiceModelDir,apiFileName)
  const fullMigrationPath = path.join(info.slnDir,relativeMigrationDir,migrationFileName)

  if (!fs.existsSync(path.dirname(fullTsdPath))) {
    console.log(`Directory does not exist: ${path.dirname(fullTsdPath)}`)
    process.exit(1)
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
    console.log(`\nRun 'dotnet run --AppTasks=migrate' to apply the new migration and create the new tables`)
  }

  const script = path.basename(process.argv[1])
  console.log(`\nTo regenerate classes, update '${tsdFileName}' then run:`)
  console.log(`$ ${script} ${tsdFileName}`)

  if (acceptTask) {
    acceptTask.then((r:Response) => r.text())
      .then((txt:string) => {
        if (comamnd.verbose) console.log(`${txt}`)
        process.exit(0)
      })
      .catch((err:any) => {
        if (comamnd.verbose) console.log(`ERROR: ${err.message ?? err}`)
        process.exit(1)
      })
  } else {
    process.exit(0)
  }
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

function createTsdFile(info:ProjectInfo, opt:{prompt:string, apiFileName:string, tsd:string, uiFileName?:string}) {
  const migrationPath = resolveMigrationFile(path.join(info.migrationsDir, `Migration1000.cs`))
  const migrationFileName = path.basename(migrationPath)
  const relativeServiceModelDir = trimStart(info.serviceModelDir.substring(info.slnDir.length), '~/')
  const relativeMigrationDir = info.migrationsDir && fs.existsSync(info.migrationsDir)
    ? trimStart(info.migrationsDir.substring(info.slnDir.length), '~/')
    : null
  const relativeUiVueDir = opt.uiFileName && info.uiMjsDir && fs.existsSync(info.uiMjsDir)
    ? trimStart(info.uiMjsDir.substring(info.slnDir.length), '~/')
    : null

  const sb:string[] = [
    `/*prompt:  ${opt.prompt}`,
    `api:       ~/${path.join(relativeServiceModelDir,opt.apiFileName)}`,
  ]
  if (relativeMigrationDir) {
    sb.push(`migration: ~/${path.join(relativeMigrationDir,migrationFileName)}`)
  }
  if (relativeUiVueDir) {
    sb.push(`ui.mjs:    ~/${path.join(relativeUiVueDir,opt.uiFileName)}`)
  }
  sb.push('*/')
  sb.push('')
  return sb.join('\n') + (opt.tsd.startsWith('///') ? '' : '\n\n') + opt.tsd
}

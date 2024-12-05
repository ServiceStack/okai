import type { Gist, ProjectInfo } from "./types.js"
import fs from "fs"
import path from "path"
import blessed from 'blessed'
import { projectInfo } from './info.js'
import { replaceMyApp } from "./utils.js"

export async function cli(args:string[]) {
  const text = args.join(' ').trim()
  if (text === 'init') {
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
  }
  if (!text || text === '?' || text === 'help') {
    console.log(`Usage: 
okai init      - Initialize okai.json with project info to override default paths
okai <prompt>  - Generate new APIs and Tables for the specified prompt`)
    process.exit(0)
    return
  }
  
  const baseUrl = process.env.OKAI_URL || 'https://okai.servicestack.com'

  try {
    const info = projectInfo(process.cwd())
    if (!info.serviceModelDir) throw new Error("Could not find ServiceModel directory")
    console.log(`Generating new APIs and Tables for: ${text}...`)
    const gist = await fetchGistFiles(baseUrl, text)
    const projectGist = convertToProjectGist(info, gist)
    const ctx = await createGistPreview(text, projectGist)
    ctx.screen.key('a', () => applyGist(ctx, info, projectGist, { accept: true }))
    ctx.screen.key('d', () => applyGist(ctx, info, projectGist, { discard: true }))
    ctx.screen.key('S-a', () => applyGist(ctx, info, projectGist, { acceptAll: true }))
    ctx.screen.render()
  } catch (err) {
    console.error(err)
  }
}

async function fetchGistFiles(baseUrl:string, text: string) {
  const url = new URL('/gist', baseUrl)
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

function convertToProjectGist(info: ProjectInfo, gist: Gist) {
  const to = Object.assign({}, gist, { files: {} })
  const cwd = process.cwd()
  for (const [fileName, file] of Object.entries(gist.files)) {
    if (fileName.startsWith('MyApp.ServiceModel/') && info.serviceModelDir) {
      const fullPath = path.join(info.serviceModelDir, file.filename.substring('MyApp.ServiceModel/'.length))
      const relativePath = path.relative(cwd, fullPath)
      to.files[relativePath] = {
        filename: path.basename(fullPath),
        content: replaceMyApp(gist.files[fileName].content, info.projectName)
      }

    } else if (fileName.startsWith('MyApp/Migrations/') && info.migrationsDir) {
      const fullPath = path.join(info.migrationsDir, file.filename.substring('MyApp.Migrations/'.length))
      const relativePath = path.relative(cwd, fullPath)
      to.files[relativePath] = Object.assign({}, file, {
        filename: path.basename(fullPath),
        content: replaceMyApp(gist.files[fileName].content, info.projectName)
      })
    } else {
      const fullPath = path.join(info.slnDir, file.filename)
      const relativePath = path.relative(cwd, fullPath)
      const toFilename = replaceMyApp(relativePath, info.projectName)
      to.files[relativePath] = Object.assign({}, file, {
        filename: path.basename(toFilename),
        content: replaceMyApp(file.content, info.projectName)
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
    content: 'Press (a) accept  (d) discard  (A) Accept All  (q) quit',
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

function exit(screen:blessed.Widgets.Screen, info:ProjectInfo, gist:Gist) {
  screen.destroy()
  if (info.migrationsDir) {
    console.log(`\nRun 'dotnet run --AppTasks=migrate' to apply any new migrations and create the new tables`)
  }
  process.exit(0)
}

function applyGist(ctx:Awaited<ReturnType<typeof createGistPreview>>, 
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

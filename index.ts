import blessed from 'blessed';
import fs from 'fs';
import path from 'path';

// Create a screen object
const screen = blessed.screen({
  smartCSR: true,
  title: 'File Preview'
});

// Create a box for file list
const fileList = blessed.list({
  left: 0,
  top: 0,
  width: '50%',
  height: '100%',
  border: {
    type: 'line'
  },
  style: {
    selected: {
      bg: 'blue'
    }
  },
  keys: true,
  vi: true
});

// Create a box for file preview
const preview = blessed.box({
  right: 0,
  top: 0,
  width: '50%',
  height: '100%',
  border: {
    type: 'line'
  },
  content: 'Select a file to preview',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true
});

// Add components to screen
screen.append(fileList);
screen.append(preview);

// Load current directory files
const updateFileList = async (dir:string) => {
  try {
    const files = await fs.readdirSync(dir);
    fileList.setItems(files);
    screen.render();
  } catch (err:any) {
    preview.setContent(`Error reading directory: ${err.message}`);
    screen.render();
  }
};

// Handle file selection
fileList.on('select', async (item) => {
  const filePath = path.join(process.cwd(), item.content);
  try {
    const stats = await fs.statSync(filePath);
    if (stats.isDirectory()) {
      process.chdir(filePath);
      await updateFileList(process.cwd());
    } else {
      const content = await fs.readFileSync(filePath, 'utf8');
      preview.setContent(content);
      screen.render();
    }
  } catch (err:any) {
    preview.setContent(`Error: ${err.message}`);
    screen.render();
  }
});

// Quit on q, or Control-C
screen.key(['q', 'C-c'], () => process.exit(0));

// Focus file list
fileList.focus();

// Initial file list load
await updateFileList(process.cwd());

// Render the screen
screen.render();

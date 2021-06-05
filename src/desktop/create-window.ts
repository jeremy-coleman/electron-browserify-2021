import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as url from "url";

//@ts-ignore
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS=true
app.commandLine.appendSwitch('enable-unsafe-webgpu')
app.allowRendererProcessReuse = true

let mainWindow: Electron.BrowserWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
      sandbox: false
    },
    height: 600,
    width: 800
  });


  mainWindow.loadFile(path.join(__dirname, '..', 'client', "index.html"))

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}


app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// https://www.electronjs.org/docs/tutorial
// https://www.electronjs.org/docs/tutorial/multithreading
// https://www.electronjs.org/docs/tutorial/message-ports
// https://www.electronjs.org/docs/tutorial/fuses
// https://www.electronjs.org/docs/tutorial/offscreen-rendering
// https://www.electronjs.org/docs/tutorial/sandbox
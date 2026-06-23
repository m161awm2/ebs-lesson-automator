import electron from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LessonRunner } from "./runner.js";

const { app, BrowserWindow, ipcMain } = electron;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let runner;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 720,
    minWidth: 760,
    minHeight: 560,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer.html"));
}

function emitStatus(payload) {
  mainWindow?.webContents.send("runner:status", payload);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", async () => {
  if (runner) {
    await runner.stop();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("runner:start", async (_event, config) => {
  if (runner) {
    await runner.stop();
  }

  runner = new LessonRunner({
    ...config,
    onStatus: emitStatus
  });

  await runner.start();
  return { ok: true };
});

ipcMain.handle("runner:stop", async () => {
  if (runner) {
    await runner.stop();
    runner = null;
  }
  return { ok: true };
});

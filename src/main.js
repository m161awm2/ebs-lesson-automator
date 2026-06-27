import electron from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LessonRunner } from "./runner.js";

const { app, BrowserWindow, dialog, ipcMain } = electron;
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
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer.html"));
}

function emitStatus(payload) {
  mainWindow?.webContents.send("runner:status", payload);
  if (payload.type === "logged-out") {
    showLoggedOutDialog(payload.message);
  }
}

function showLoggedOutDialog(message) {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }

  void dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "EBS 로그인이 필요합니다",
    message,
    detail: "열려 있는 EBS 브라우저에서 다시 로그인하면 자동으로 보던 강의로 돌아갑니다.",
    buttons: ["확인"],
    defaultId: 0
  });
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

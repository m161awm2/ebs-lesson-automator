const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lessonApp", {
  start: (config) => ipcRenderer.invoke("runner:start", config),
  stop: () => ipcRenderer.invoke("runner:stop"),
  onStatus: (callback) => {
    ipcRenderer.on("runner:status", (_event, payload) => callback(payload));
  }
});

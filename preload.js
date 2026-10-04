const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rigcheck", {
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  closeApp: () => ipcRenderer.send("app:close"),
  scanHardware: () => ipcRenderer.invoke("hardware:scan"),
  readThermals: () => ipcRenderer.invoke("hardware:thermals"),
  openTuningTool: (toolId) => ipcRenderer.invoke("tuning:open", toolId),
  startCpuStress: (durationMs) => ipcRenderer.invoke("stress:cpu:start", durationMs),
  stopCpuStress: () => ipcRenderer.invoke("stress:cpu:stop")
});
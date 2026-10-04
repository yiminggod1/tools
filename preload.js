const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rigcheck", {
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  scanHardware: () => ipcRenderer.invoke("hardware:scan"),
  readThermals: () => ipcRenderer.invoke("hardware:thermals"),
  startCpuStress: (durationMs) => ipcRenderer.invoke("stress:cpu:start", durationMs),
  stopCpuStress: () => ipcRenderer.invoke("stress:cpu:stop")
});
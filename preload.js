const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("rigcheck", {
  scanHardware: () => ipcRenderer.invoke("hardware:scan"),
  startCpuStress: (durationMs) => ipcRenderer.invoke("stress:cpu:start", durationMs),
  stopCpuStress: () => ipcRenderer.invoke("stress:cpu:stop")
});
const { app, BrowserWindow, ipcMain } = require("electron");
const os = require("node:os");
const path = require("node:path");
const { Worker } = require("node:worker_threads");
const si = require("systeminformation");

let mainWindow;
let activeCpuRun;

function assertTrustedWindow(event) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || window !== mainWindow) throw new Error("Untrusted renderer");
}

async function safeRead(reader, fallback) {
  try {
    return await reader();
  } catch {
    return fallback;
  }
}

async function scanHardware(event) {
  assertTrustedWindow(event);
  const [cpu, memory, graphics, board, bios, disks, temperature, operatingSystem] = await Promise.all([
    safeRead(() => si.cpu(), {}),
    safeRead(() => si.mem(), {}),
    safeRead(() => si.graphics(), { controllers: [] }),
    safeRead(() => si.baseboard(), {}),
    safeRead(() => si.bios(), {}),
    safeRead(() => si.diskLayout(), []),
    safeRead(() => si.cpuTemperature(), {}),
    safeRead(() => si.osInfo(), {})
  ]);

  return {
    cpu: {
      manufacturer: cpu.manufacturer || "",
      brand: cpu.brand || "",
      speed: cpu.speed || 0,
      cores: cpu.physicalCores || 0,
      threads: cpu.processors || os.cpus().length
    },
    memory: {
      total: memory.total || 0,
      available: memory.available || memory.free || 0
    },
    graphics: (graphics.controllers || []).map((controller) => ({
      model: controller.model || controller.name || "",
      vendor: controller.vendor || "",
      vram: controller.vram || 0,
      driver: controller.driverVersion || ""
    })),
    board: {
      manufacturer: board.manufacturer || "",
      model: board.model || "",
      version: board.version || ""
    },
    bios: {
      vendor: bios.vendor || "",
      version: bios.version || "",
      releaseDate: bios.releaseDate || ""
    },
    disks: disks.map((disk) => ({
      name: disk.name || disk.type || "存储设备",
      vendor: disk.vendor || "",
      type: disk.type || "",
      size: disk.size || 0,
      interfaceType: disk.interfaceType || "",
      health: disk.smartStatus || ""
    })),
    temperature: {
      main: Number(temperature.main) || 0,
      max: Number(temperature.max) || 0
    },
    operatingSystem: {
      distro: operatingSystem.distro || operatingSystem.platform || "",
      release: operatingSystem.release || "",
      arch: operatingSystem.arch || process.arch
    }
  };
}

function finishCpuRun(stopped, reason) {
  const run = activeCpuRun;
  if (!run) return null;
  activeCpuRun = null;
  clearTimeout(run.timeout);
  clearInterval(run.temperatureTimer);
  for (const worker of run.workers) worker.terminate();
  const operations = run.operations.reduce((total, count) => total + count, 0);
  const result = {
    operations,
    threads: run.workers.length,
    elapsedMs: Math.max(1, Date.now() - run.startedAt),
    stopped,
    reason
  };
  run.resolve(result);
  return result;
}

async function startCpuRun(event, requestedDuration) {
  assertTrustedWindow(event);
  if (activeCpuRun) throw new Error("A CPU test is already running");
  const durationMs = Math.max(1000, Math.min(30000, Number(requestedDuration) || 10000));
  const temperature = await safeRead(() => si.cpuTemperature(), {});
  if (Number(temperature.main) >= 90) {
    return { operations: 0, threads: 0, elapsedMs: 0, stopped: true, reason: "thermal-limit" };
  }

  const threadCount = Math.max(1, Math.min(os.cpus().length, 16));
  return new Promise((resolve) => {
    const run = {
      workers: [],
      operations: Array(threadCount).fill(0),
      startedAt: Date.now(),
      resolve,
      timeout: null,
      temperatureTimer: null
    };
    activeCpuRun = run;
    run.workers = Array.from({ length: threadCount }, (_, index) => {
      const worker = new Worker(path.join(__dirname, "cpu-worker.js"), { workerData: { durationMs } });
      worker.on("message", (message) => {
        if (message.type === "progress" || message.type === "done") run.operations[index] = message.operations;
        if (message.type === "done") {
          run.completed = (run.completed || 0) + 1;
          if (run.completed === threadCount) finishCpuRun(false, "completed");
        }
      });
      worker.on("error", () => finishCpuRun(true, "worker-error"));
      return worker;
    });
    run.timeout = setTimeout(() => finishCpuRun(false, "time-limit"), durationMs + 1500);
    let checkingTemperature = false;
    run.temperatureTimer = setInterval(async () => {
      if (checkingTemperature || activeCpuRun !== run) return;
      checkingTemperature = true;
      const reading = await safeRead(() => si.cpuTemperature(), {});
      checkingTemperature = false;
      if (activeCpuRun === run && Number(reading.main) >= 90) finishCpuRun(true, "thermal-limit");
    }, 1000);
  });
}

function stopCpuRun(event) {
  assertTrustedWindow(event);
  return finishCpuRun(true, "user-stopped");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 360,
    minHeight: 620,
    backgroundColor: "#111815",
    title: "RigCheck 硬件体检台",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, target) => {
    if (!target.startsWith("file:")) event.preventDefault();
  });
  mainWindow.on("closed", () => {
    finishCpuRun(true, "window-closed");
    mainWindow = null;
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.handle("hardware:scan", scanHardware);
ipcMain.handle("stress:cpu:start", startCpuRun);
ipcMain.handle("stress:cpu:stop", stopCpuRun);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => finishCpuRun(true, "app-closed"));
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
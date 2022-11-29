const { app, ipcMain, desktopCapturer, screen, Menu, BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const dns = require('dns');
require('dotenv').config();

function createWindow() {
  let window = new BrowserWindow({
    show: false,
    title: "Zoom",
    icon: path.join(__dirname, "assets/favicon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  window.maximize();
  window.show();
  dns.lookupService("8.8.8.8", 53, (err) => {
    if (!err) {
      window.loadURL(process.env.URL);
    } else {
      window.loadFile("internet/index.html");
    }
  });
  window.on("closed", () => {
    window = null;
  });
  ipcMain.on("availableInternetConnection", () => {
    window.loadURL(process.env.URL);
  });
  ipcMain.on("noInternetConnection", () => {
    window.loadFile("internet/index.html");
  });
  ipcMain.on("captureScreen", () => {
    desktopCapturer.getSources({
      types: ["window", "screen"]
    }).then((sources) => {
      let sourceMenu = Menu.buildFromTemplate(
        sources.map((source) => ({
          label: source.name,
          click: () => {
            window.webContents.send("captureScreen", source.id);
          }
        }))
      );
      sourceMenu.popup();
    });
  });
  ipcMain.on("recordMeeting", () => {
    window.webContents.send("recordMeeting", window.getMediaSourceId());
  });
  let interval = setInterval(() => {
    try {
      let cpus = os.cpus();
      let user = nice = sys = idle = irq = total = 0;
      cpus.forEach((cpu, index) => {
        if (!cpus.hasOwnProperty(index)) return;
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        irq += cpu.times.irq;
        idle += cpu.times.idle;
      });
      let startIdle = idle;
      let startTotal = user + nice + sys + irq + idle;
      setTimeout(() => {
        let cpus = os.cpus();
        user = nice = sys = idle = irq = total = 0;
        cpus.forEach((cpu, index) => {
          if (!cpus.hasOwnProperty(index)) return;
          user += cpu.times.user;
          nice += cpu.times.nice;
          sys += cpu.times.sys;
          irq += cpu.times.irq;
          idle += cpu.times.idle;
        });
        let endIdle = idle;
        let endTotal = user + nice + sys + irq + idle;
        window.webContents.send("cpuUsage", (
          1 - (
            (
              endIdle - startIdle
            ) / (
              endTotal - startTotal
            )
          )
        ) * 100);
        window.webContents.send("memoryUsage", (
          os.freemem() / os.totalmem()
        ) * 100);
        window.webContents.send("totalMemoryUsage", (
          os.totalmem() / (
            1024 * 1024
          )
        ) / 1024);
      }, 1000);
    } catch {
      clearInterval(interval);
    }
  }, 500);
}

app.whenReady().then(() => {
  createWindow();
  if (process.platform === "win32") app.setAppUserModelId("Zoom");
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
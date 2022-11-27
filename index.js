const { app, ipcMain, desktopCapturer, Menu, BrowserWindow } = require('electron');
const path = require('path');
const os = require('os-utils');
require('dotenv').config();

function createWindow() {
  let window = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Zoom",
    icon: path.join(__dirname, "icons/favicon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  window.loadURL(process.env.URL);
  window.on("closed", () => {
    window = null;
  });
  ipcMain.on("captureScreen", () => {
    desktopCapturer.getSources({
      types: ["window", "screen"]
    }).then((sources) => {
      let sourceMenu = Menu.buildFromTemplate(
        sources.map((source) => ({
          label: source.name,
          click: () => {
            console.log("HAHA")
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
      os.cpuUsage((v) => {
        window.webContents.send("cpuUsage", v * 100);
        window.webContents.send("memoryUsage", os.freememPercentage() * 100);
        window.webContents.send("totalMemoryUsage", os.totalmem() / 1024);
      });
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

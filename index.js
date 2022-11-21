const { app, BrowserWindow } = require('electron');
const path = require('path');
require('dotenv').config();

function createWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Zoom",
    icon: path.join(__dirname, "favicon.png")
  });
  window.loadURL(process.env.URL);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
window.addEventListener("online", () => {
  require("electron").ipcRenderer.send("availableInternetConnection");
});
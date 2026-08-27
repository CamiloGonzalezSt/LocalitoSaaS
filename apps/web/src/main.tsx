import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshingForUpdate = false;

    if (hadController) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshingForUpdate) return;
        refreshingForUpdate = true;
        window.location.reload();
      });
    }

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        // Localito sigue funcionando si el navegador bloquea el modo instalable.
      });
  });
}

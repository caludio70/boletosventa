import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// PWA: evitar quedarnos con una versión vieja en caché (botón "Actualizar")
let updateSW: (reloadPage?: boolean) => Promise<void>;
updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Auto-actualizar para que siempre veas los botones/cambios nuevos
    setTimeout(() => {
      void updateSW(true);
    }, 800);

    toast("Actualizando a la última versión…", {
      duration: 2500,
    });
  },
  onOfflineReady() {
    // Silencioso para no molestar; activar si lo querés visible.
  },
});

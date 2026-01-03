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
    toast("Hay una nueva versión disponible.", {
      duration: Infinity,
      action: {
        label: "Actualizar",
        onClick: () => void updateSW(true),
      },
    });
  },
  onOfflineReady() {
    // Silencioso para no molestar; activar si lo querés visible.
  },
});

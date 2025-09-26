import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// iOS/Safari viewport height fix: set --app-vh to actual innerHeight
function setAppVh() {
  const vh = window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${vh}px`);
}

setAppVh();
window.addEventListener("resize", setAppVh);
window.addEventListener("orientationchange", () => setTimeout(setAppVh, 100));

createRoot(document.getElementById("root")!).render(<App />);

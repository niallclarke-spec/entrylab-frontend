import { createRoot } from "react-dom/client";
import "./lib/vite-dep-preload";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

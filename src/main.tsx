import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "beercss/dist/cdn/beer.min.css";
import "./styles/theme.css";
import "./styles/app.css";
import "./styles/logging.css";
import "./styles/onboarding.css";
import "./styles/pages.css";
import "./styles/settings.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

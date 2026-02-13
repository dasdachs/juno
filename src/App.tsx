import { BrowserRouter } from "react-router-dom";
import { VaultProvider } from "./contexts/VaultContext";
import { IdentityProvider } from "./contexts/IdentityContext";
import { CompositeAuthProvider } from "./contexts/CompositeAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UpdateNotification } from "./components/UpdateNotification";
import { RootRouter } from "./pages/RootRouter";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <IdentityProvider>
            <VaultProvider>
              <CompositeAuthProvider>
                <RootRouter />
                <UpdateNotification />
              </CompositeAuthProvider>
            </VaultProvider>
          </IdentityProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

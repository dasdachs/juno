import { BrowserRouter } from "react-router-dom";
import { VaultProvider } from "./contexts/VaultContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { DateFormatProvider } from "./contexts/DateFormatContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UpdateNotification } from "./components/UpdateNotification";
import { RootRouter } from "./pages/RootRouter";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <VaultProvider>
            <ToastProvider>
              <DateFormatProvider>
                <RootRouter />
                <UpdateNotification />
              </DateFormatProvider>
            </ToastProvider>
          </VaultProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

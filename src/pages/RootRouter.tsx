import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/common/Protected";
import { CalendarPage } from "./CalendarPage";
import { InsightsPage } from "./InsightsPage";
import { HistoryPage } from "./HistoryPage";
import { SettingsPage } from "./SettingsPage";
import { ProfilePage } from "./ProfilePage";
import { Layout } from "../components/Layout";

export function RootRouter() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<CalendarPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

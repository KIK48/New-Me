import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/home";
import Weekly from "./pages/weekly"
import WeekTViewPage from "./pages/weeklyT";
import Login from "./pages/login";
import { ModeProvider } from "./hooks/ModeContext";
import ProtectedRoute from "./components/ProtectedRoute";


export default function App() {
  return (
    <Routes>
      {/* Public route — accessible without a token */}
      <Route path="/login" element={<Login />} />

      {/* All other routes require authentication */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="weekly" element={<ModeProvider><Weekly /></ModeProvider>} />
        <Route path="weeklyT" element={<ModeProvider><WeekTViewPage /></ModeProvider>} />
      </Route>
    </Routes>
  );
}

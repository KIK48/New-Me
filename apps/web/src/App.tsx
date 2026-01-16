import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/home";
import Weekly from "./pages/weekly"
import WeekViewPage from "./pages/temp";
import WeekTViewPage from "./pages/weeklyT";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="weekly" element={<Weekly />} />
        <Route path="temp" element={<WeekViewPage/>} />
        <Route path="weeklyT" element={<WeekTViewPage/>} />
      </Route>
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/home";
import Weekly from "./pages/weekly"
import { ModeProvider } from "./hooks/ModeContext";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="weekly" element={<ModeProvider><Weekly /></ModeProvider>} />
      </Route>
    </Routes>
  );
}

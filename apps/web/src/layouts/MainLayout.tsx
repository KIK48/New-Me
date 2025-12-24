import { Outlet } from "react-router-dom";
import Navbar from "../components/navbar";

export default function MainLayout() {
  return (
    <div className="application">
      <Navbar />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

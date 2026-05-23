import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App'
import { AuthProvider } from "./hooks/AuthContext";
import "./styles/App.css";
import "./styles/resusables.css";


const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No #root element found");

ReactDOM.createRoot(rootEl).render(
  // AuthProvider must wrap BrowserRouter so ProtectedRoute can read auth state
  // during the initial render before any navigation happens
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);

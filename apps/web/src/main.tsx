import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from './App'
import "./styles/App.css";
import "./styles/resusables.css";


const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No #root element found");

ReactDOM.createRoot(rootEl).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App";
import NotFound from "./components/NotFound";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

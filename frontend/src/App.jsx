import { BrowserRouter } from "react-router-dom";
import Router from "./routes";
import { AuthContextProvider } from "../hooks/AuthContextProvider";

export default function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </AuthContextProvider>
  )
}
import { Navigate, Routes, Route } from "react-router-dom";
import Forms from "./pages/Forms";
import FormsSubmission from "./pages/FormsSubmission";
import Login from "./pages/Login";
import SubmissionView from "./pages/SubmissionView";

function HomeRedirect() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || user?.type_of_account;
  return <Navigate to={role === "admin" ? "/forms" : "/submit"} replace />;
}
export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/forms" element={<Forms />} />
      <Route path="/submit" element={<FormsSubmission />} />
      <Route path="/submissions" element={<SubmissionView />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}
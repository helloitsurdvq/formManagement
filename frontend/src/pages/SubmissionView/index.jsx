/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Logout, Refresh } from "@mui/icons-material";
import { Alert, Snackbar } from "@mui/material";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";
import api from "../../services/fetchAPI";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative h-10 px-1 text-sm font-medium transition ${
          isActive
            ? "text-blue-700 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-blue-600"
            : "text-slate-600 hover:text-blue-700"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function IconButton({ children, label, onClick, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-red-700 hover:bg-red-50"
      : "text-slate-700 hover:bg-blue-50";

  return (
    <button
      aria-label={label}
      title={label}
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${toneClass}`}
    >
      {children}
    </button>
  );
}

function SubmissionViewPageLayout({ user, role, isAdmin, onLogout, children }) {
  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b border-blue-100">
        <div className="flex flex-col gap-4 px-4 py-4 mx-auto max-w-7xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              Form Management
            </h1>
            <p className="text-sm text-slate-500">
              Signed in as {user?.email} - {role}
            </p>
          </div>
          <div className="flex items-center gap-5">
            {isAdmin && <NavItem to="/forms">Forms</NavItem>}
            <NavItem to="/submit">Form Submission</NavItem>
            <NavItem to="/submissions">Submission View</NavItem>
            <IconButton label="Logout" onClick={onLogout} tone="danger">
              <Logout fontSize="small" />
            </IconButton>
          </div>
        </div>
      </header>
      <main className="px-4 py-6 mx-auto max-w-7xl">{children}</main>
    </div>
  );
}

export default function SubmissionView() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { user, dispatch } = useAuthContext();
  const token = localStorage.getItem("token");
  const role = user?.role || user?.type_of_account;
  const isAdmin = role === "admin";
  const [submissions, setSubmissions] = useState([]);
  const [notice, setNotice] = useState(null);
  const showNotice = (severity, message) => setNotice({ severity, message });
  const loadSubmissions = async () => {
    const response = await api.getSubmissions(token);
    setSubmissions(response.data || []);
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    loadSubmissions().catch((error) =>
      showNotice(
        "error",
        error.response?.data?.message || "Cannot load submissions",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      dispatch({ type: "LOGOUT" });
      navigate("/login");
    }
  };

  return (
    <SubmissionViewPageLayout user={user} role={role} isAdmin={isAdmin} onLogout={handleLogout}>
      <section className="p-5 bg-white border border-blue-100 rounded-lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Submission View
            </h2>
            <p className="text-sm text-slate-500">
              {isAdmin
                ? "All submitted forms."
                : "Only submissions created by your account."}
            </p>
          </div>
          <IconButton label="Refresh" onClick={loadSubmissions}>
            <Refresh fontSize="small" />
          </IconButton>
        </div>

        <div className="overflow-hidden border border-blue-100 rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="text-white bg-blue-600">
              <tr>
                <th className="px-3 py-2">Form</th>
                <th className="px-3 py-2">Submitted By</th>
                <th className="px-3 py-2">Submitted At</th>
                <th className="px-3 py-2">Values</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className="align-top odd:bg-white even:bg-blue-50"
                >
                  <td className="px-3 py-3 font-medium text-slate-900">
                    {submission.form_title}
                  </td>
                  <td className="px-3 py-3">{submission.submitted_by_email}</td>
                  <td className="px-3 py-3">
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleString()
                      : ""}
                  </td>
                  <td className="px-3 py-3">
                    <div className="grid gap-1">
                      {(submission.values || []).map((item) => (
                        <p key={item.id}>
                          <span className="font-medium text-slate-700">
                            {item.label}:{" "}
                          </span>
                          <span className="text-slate-600">
                            {String(item.value ?? "")}
                          </span>
                        </p>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td className="px-3 py-5 text-center text-slate-500" colSpan={4}>
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {notice && (
          <Alert
            severity={notice.severity}
            onClose={() => setNotice(null)}
            variant="filled"
          >
            {notice.message}
          </Alert>
        )}
      </Snackbar>
    </SubmissionViewPageLayout>
  );
}
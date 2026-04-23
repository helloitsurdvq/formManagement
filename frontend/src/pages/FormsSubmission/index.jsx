/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Logout, Refresh, Send } from "@mui/icons-material";
import { Alert, MenuItem, Snackbar, TextField } from "@mui/material";
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

function SubmissionPageLayout({ user, role, isAdmin, onLogout, children }) {
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

export default function FormsSubmission() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { user, dispatch } = useAuthContext();
  const token = localStorage.getItem("token");
  const role = user?.role || user?.type_of_account;
  const isAdmin = role === "admin";
  const [activeForms, setActiveForms] = useState([]);
  const [selectedSubmitFormId, setSelectedSubmitFormId] = useState("");
  const [submissionValues, setSubmissionValues] = useState({});
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedSubmitForm = useMemo(() => {
    return activeForms.find(
      (form) => Number(form.id) === Number(selectedSubmitFormId),
    );
  }, [activeForms, selectedSubmitFormId]);

  const showNotice = (severity, message) => setNotice({ severity, message });

  const loadActiveForms = async () => {
    const response = await api.getActiveForms(token);
    setActiveForms(response.data || []);
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    loadActiveForms().catch((error) =>
      showNotice(
        "error",
        error.response?.data?.message || "Cannot load active forms",
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

  const handleSubmitForm = async (event) => {
    event.preventDefault();
    if (!selectedSubmitFormId) {
      showNotice("error", "Select a form to submit");
      return;
    }
    setLoading(true);
    try {
      await api.submitForm(token, selectedSubmitFormId, submissionValues);
      showNotice("success", "Form submitted");
      setSubmissionValues({});
    } catch (error) {
      showNotice(
        "error",
        error.response?.data?.message || "Cannot submit form",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInputForField = (field) => {
    const value = submissionValues[field.id] ?? "";
    const commonProps = {
      key: field.id,
      label: field.label,
      value,
      required: Boolean(field.is_required),
      fullWidth: true,
      size: "small",
      onChange: (event) =>
        setSubmissionValues((current) => ({
          ...current,
          [field.id]: event.target.value,
        })),
    };

    if (field.field_type === "select") {
      return (
        <TextField {...commonProps} select>
          {(field.options || []).map((option) => (
            <MenuItem
              key={option.id || option.option_value}
              value={option.option_value}
            >
              {option.option_label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (field.field_type === "number") {
      return <TextField {...commonProps} type="number" />;
    }

    if (field.field_type === "date") {
      return (
        <TextField
          {...commonProps}
          type="date"
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    if (field.field_type === "color") {
      return (
        <TextField
          {...commonProps}
          type="color"
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    return (
      <TextField
        {...commonProps}
        inputProps={{ maxLength: field.max_length || undefined }}
      />
    );
  };

  return (
    <SubmissionPageLayout user={user} role={role} isAdmin={isAdmin} onLogout={handleLogout}>
      <section className="p-5 bg-white border border-blue-100 rounded-lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Form Submission
            </h2>
            <p className="text-sm text-slate-500">Fill active forms.</p>
          </div>
          <IconButton label="Refresh" onClick={loadActiveForms}>
            <Refresh fontSize="small" />
          </IconButton>
        </div>

        <form onSubmit={handleSubmitForm} className="grid gap-4">
          <TextField
            label="Active Form"
            size="small"
            select
            value={selectedSubmitFormId}
            onChange={(event) => {
              setSelectedSubmitFormId(event.target.value);
              setSubmissionValues({});
            }}
          >
            {activeForms.map((form) => (
              <MenuItem key={form.id} value={form.id}>
                {form.title}
              </MenuItem>
            ))}
          </TextField>

          {selectedSubmitForm && (
            <div className="p-4 border border-blue-100 rounded-md">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900">
                  {selectedSubmitForm.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedSubmitForm.form_description}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(selectedSubmitForm.fields || []).map(renderInputForField)}
              </div>
              {selectedSubmitForm.fields?.length === 0 && (
                <p className="text-sm text-slate-500">
                  This active form has no fields.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedSubmitFormId}
            className="inline-flex items-center h-10 gap-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md w-fit hover:bg-blue-700 disabled:opacity-60"
          >
            <Send fontSize="small" />
            Submit Form
          </button>
        </form>
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
    </SubmissionPageLayout>
  );
}
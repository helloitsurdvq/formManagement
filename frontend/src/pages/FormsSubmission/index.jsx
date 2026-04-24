/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Close, Logout, Refresh, Send } from "@mui/icons-material";
import { Alert, Dialog, DialogContent, DialogTitle, MenuItem, Snackbar, TextField } from "@mui/material";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setIsModalOpen(false);
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

  const openFormModal = (formId) => {
    setSelectedSubmitFormId(formId);
    setSubmissionValues({});
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setSubmissionValues({});
  };

  return (
    <SubmissionPageLayout
      user={user}
      role={role}
      isAdmin={isAdmin}
      onLogout={handleLogout}
    >
      <section className="p-5 bg-white border border-blue-100 rounded-lg">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Form Submission
            </h2>
            <p className="text-sm text-slate-500">
              Select an active form to open and submit it.
            </p>
          </div>
          <IconButton label="Refresh" onClick={loadActiveForms}>
            <Refresh fontSize="small" />
          </IconButton>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeForms.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => openFormModal(form.id)}
              className="p-5 text-left transition bg-white border border-blue-100 rounded-lg hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold truncate text-slate-900">
                    {form.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium tracking-wide text-blue-600 uppercase">
                    Active form
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md">
                  #{form.display_order}
                </span>
              </div>
              <p className="text-sm line-clamp-3 text-slate-500">
                {form.form_description || "No description"}
              </p>
              <div className="mt-4 text-sm text-slate-600">
                {(form.fields || []).length} field
                {(form.fields || []).length === 1 ? "" : "s"}
              </div>
            </button>
          ))}
          {activeForms.length === 0 && (
            <div className="px-4 py-10 text-sm text-center border border-blue-100 rounded-lg bg-blue-50 text-slate-500 md:col-span-2 xl:col-span-3">
              No active forms available.
            </div>
          )}
        </div>
      </section>

      <Dialog
        open={isModalOpen}
        onClose={closeFormModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle className="border-b border-blue-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {selectedSubmitForm?.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedSubmitForm?.form_description}
              </p>
            </div>
            <button
              type="button"
              onClick={closeFormModal}
              className="inline-flex items-center justify-center rounded-md h-9 w-9 text-slate-500 hover:bg-blue-50 hover:text-slate-700"
              aria-label="Close form dialog"
            >
              <Close fontSize="small" />
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="bg-blue-50">
          <form onSubmit={handleSubmitForm} className="grid gap-4 py-4">
            {selectedSubmitForm && (
              <div className="p-4 bg-white border border-blue-100 rounded-md">
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

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeFormModal}
                className="h-10 px-4 text-sm font-medium border rounded-md border-slate-300 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedSubmitFormId}
                className="inline-flex items-center h-10 gap-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
              >
                <Send fontSize="small" />
                Submit Form
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

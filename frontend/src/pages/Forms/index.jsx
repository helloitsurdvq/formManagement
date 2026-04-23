/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Add, Delete, Edit, Logout, Refresh, Save } from "@mui/icons-material";
import { Alert, Checkbox, FormControlLabel, MenuItem, Snackbar, TextField,} from "@mui/material";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";
import api from "../../services/fetchAPI";

const emptyForm = {
  title: "",
  form_description: "",
  display_order: 0,
  form_status: "draft",
};

const emptyField = {
  label: "",
  field_type: "text",
  display_order: 0,
  is_required: false,
  max_length: "",
  min_value: "",
  max_value: "",
  allow_past_date: false,
  optionsText: "",
};

const fieldTypes = ["text", "number", "date", "color", "select"];

const parseOptions = (optionsText) => {
  return optionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [label, value] = line.split(":");
      return {
        option_label: label?.trim(),
        option_value: (value || label)?.trim(),
        display_order: index + 1,
      };
    });
};

const fieldToFormState = (field) => ({
  label: field.label || "",
  field_type: field.field_type || "text",
  display_order: field.display_order || 0,
  is_required: Boolean(field.is_required),
  max_length: field.max_length ?? "",
  min_value: field.min_value ?? "",
  max_value: field.max_value ?? "",
  allow_past_date: Boolean(field.allow_past_date),
  optionsText: (field.options || [])
    .map((option) => `${option.option_label}:${option.option_value}`)
    .join("\n"),
});

const cleanFieldPayload = (fieldForm) => {
  const payload = {
    label: fieldForm.label,
    field_type: fieldForm.field_type,
    display_order: Number(fieldForm.display_order) || 0,
    is_required: fieldForm.is_required,
    max_length:
      fieldForm.max_length === "" ? null : Number(fieldForm.max_length),
    min_value: fieldForm.min_value === "" ? null : Number(fieldForm.min_value),
    max_value: fieldForm.max_value === "" ? null : Number(fieldForm.max_value),
    allow_past_date: fieldForm.allow_past_date,
  };

  if (fieldForm.field_type === "select") {
    payload.options = parseOptions(fieldForm.optionsText);
  }

  return payload;
};

function NavbarItem({ to, children }) {
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

function FormPageLayout({ user, role, isAdmin, onLogout, children }) {
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
            {isAdmin && <NavbarItem to="/forms">Forms</NavbarItem>}
            <NavbarItem to="/submit">Form Submission</NavbarItem>
            <NavbarItem to="/submissions">Submission View</NavbarItem>
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

export default function Forms() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { user, dispatch } = useAuthContext();
  const token = localStorage.getItem("token");
  const role = user?.role || user?.type_of_account;
  const isAdmin = role === "admin";
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState("");
  const [editingFormId, setEditingFormId] = useState(null);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [fieldData, setFieldData] = useState(emptyField);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedForm = useMemo(() => {
    return forms.find((form) => Number(form.id) === Number(selectedFormId));
  }, [forms, selectedFormId]);

  const showNotice = (severity, message) => setNotice({ severity, message });

  const loadAdminForms = async () => {
    const response = await api.getForms(token);
    setForms(response.data || []);
  };

  const loadFormDetails = async (formId) => {
    if (!formId) return;
    try {
      const response = await api.getFormById(token, formId);
      const detail = response.data;
      setForms((current) =>
        current.map((form) =>
          Number(form.id) === Number(formId) ? detail : form,
        ),
      );
    } catch (error) {
      showNotice("error", error.response?.data?.message || "Cannot load form fields",);
    }
  };

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }
    if (!isAdmin) {
      navigate("/submit");
      return;
    }
    loadAdminForms().catch((error) =>
      showNotice("error", error.response?.data?.message || "Cannot load forms"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, isAdmin]);

  useEffect(() => {
    if (selectedFormId) loadFormDetails(selectedFormId);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormId]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      dispatch({ type: "LOGOUT" });
      navigate("/login");
    }
  };

  const handleSaveForm = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        display_order: Number(formData.display_order) || 0,
      };

      if (editingFormId) {
        await api.updateForm(token, editingFormId, payload);
        showNotice("success", "Form updated");
      } else {
        await api.createForm(token, payload);
        showNotice("success", "Form created");
      }

      setFormData(emptyForm);
      setEditingFormId(null);
      await loadAdminForms();
    } catch (error) {
      showNotice("error", error.response?.data?.message || "Cannot save form");
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = (form) => {
    setEditingFormId(form.id);
    setSelectedFormId(form.id);
    setFormData({
      title: form.title || "",
      form_description: form.form_description || "",
      display_order: form.display_order || 0,
      form_status: form.form_status || "draft",
    });
  };

  const handleDeleteForm = async (formId) => {
    setLoading(true);
    try {
      await api.deleteForm(token, formId);
      showNotice("success", "Form deleted");
      if (Number(selectedFormId) === Number(formId)) {
        setSelectedFormId("");
      }
      await loadAdminForms();
    } catch (error) {
      showNotice(
        "error",
        error.response?.data?.message || "Cannot delete form",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (event) => {
    event.preventDefault();
    if (!selectedFormId) {
      showNotice("error", "Select a form first");
      return;
    }

    setLoading(true);
    try {
      const payload = cleanFieldPayload(fieldData);
      if (editingFieldId) {
        await api.updateField(token, selectedFormId, editingFieldId, payload);
        showNotice("success", "Field updated");
      } else {
        await api.createField(token, selectedFormId, payload);
        showNotice("success", "Field created");
      }
      setFieldData(emptyField);
      setEditingFieldId(null);
      await loadFormDetails(selectedFormId);
    } catch (error) {
      showNotice("error", error.response?.data?.message || "Cannot save field");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    setLoading(true);
    try {
      await api.deleteField(token, selectedFormId, fieldId);
      showNotice("success", "Field deleted");
      await loadFormDetails(selectedFormId);
    } catch (error) {
      showNotice(
        "error",
        error.response?.data?.message || "Cannot delete field",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout user={user} role={role} isAdmin={isAdmin} onLogout={handleLogout}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
        <section className="p-5 bg-white border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Form
              </h2>
              <p className="text-sm text-slate-500">
                Create, update and delete forms.
              </p>
            </div>
            <IconButton label="Refresh" onClick={loadAdminForms}>
              <Refresh fontSize="small" />
            </IconButton>
          </div>

          <form onSubmit={handleSaveForm} className="grid gap-3 md:grid-cols-2">
            <TextField
              label="Title"
              size="small"
              required
              value={formData.title}
              onChange={(event) =>
                setFormData({ ...formData, title: event.target.value })
              }
            />
            <TextField
              label="Order"
              size="small"
              type="number"
              value={formData.display_order}
              onChange={(event) =>
                setFormData({ ...formData, display_order: event.target.value })
              }
            />
            <TextField
              label="Status"
              size="small"
              select
              value={formData.form_status}
              onChange={(event) =>
                setFormData({ ...formData, form_status: event.target.value })
              }
            >
              <MenuItem value="draft">draft</MenuItem>
              <MenuItem value="active">active</MenuItem>
            </TextField>
            <TextField
              label="Description"
              size="small"
              value={formData.form_description}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  form_description: event.target.value,
                })
              }
            />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center h-10 gap-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {editingFormId ? (
                  <Save fontSize="small" />
                ) : (
                  <Add fontSize="small" />
                )}
                {editingFormId ? "Update Form" : "Create Form"}
              </button>
              {editingFormId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFormId(null);
                    setFormData(emptyForm);
                  }}
                  className="h-10 px-4 text-sm font-medium border rounded-md border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 overflow-hidden border border-blue-100 rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="text-white bg-blue-600">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id} className="border-t border-blue-100">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFormId(form.id)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {form.title}
                      </button>
                    </td>
                    <td className="px-3 py-2">{form.form_status}</td>
                    <td className="px-3 py-2">{form.display_order}</td>
                    <td className="px-3 py-1">
                      <IconButton
                        label="Edit form"
                        onClick={() => handleEditForm(form)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        label="Delete form"
                        tone="danger"
                        onClick={() => handleDeleteForm(form.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
                {forms.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-5 text-center text-slate-500"
                      colSpan={4}
                    >
                      No forms yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="p-5 bg-white border border-blue-100 rounded-lg">
          <h2 className="text-lg font-semibold text-slate-900">Edit Fields</h2>
          <p className="mb-4 text-sm text-slate-500">
            Select a form, then configure its text, number, date, color or select fields.
          </p>
          <TextField
            label="Selected Form"
            size="small"
            select
            fullWidth
            value={selectedFormId}
            onChange={(event) => setSelectedFormId(event.target.value)}
          >
            {forms.map((form) => (
              <MenuItem key={form.id} value={form.id}>
                {form.title}
              </MenuItem>
            ))}
          </TextField>

          <form onSubmit={handleSaveField} className="grid gap-3 mt-4">
            <TextField
              label="Label"
              size="small"
              required
              value={fieldData.label}
              onChange={(event) =>
                setFieldData({ ...fieldData, label: event.target.value })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Type"
                size="small"
                select
                value={fieldData.field_type}
                onChange={(event) =>
                  setFieldData({ ...fieldData, field_type: event.target.value })
                }
              >
                {fieldTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Order"
                size="small"
                type="number"
                value={fieldData.display_order}
                onChange={(event) =>
                  setFieldData({
                    ...fieldData,
                    display_order: event.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="Max length"
                size="small"
                type="number"
                value={fieldData.max_length}
                onChange={(event) =>
                  setFieldData({ ...fieldData, max_length: event.target.value })
                }
              />
              <TextField
                label="Min value"
                size="small"
                type="number"
                value={fieldData.min_value}
                onChange={(event) =>
                  setFieldData({ ...fieldData, min_value: event.target.value })
                }
              />
              <TextField
                label="Max value"
                size="small"
                type="number"
                value={fieldData.max_value}
                onChange={(event) =>
                  setFieldData({ ...fieldData, max_value: event.target.value })
                }
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fieldData.is_required}
                    onChange={(event) =>
                      setFieldData({
                        ...fieldData,
                        is_required: event.target.checked,
                      })
                    }
                  />
                }
                label="Required"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fieldData.allow_past_date}
                    onChange={(event) =>
                      setFieldData({
                        ...fieldData,
                        allow_past_date: event.target.checked,
                      })
                    }
                  />
                }
                label="Allow past date"
              />
            </div>
            {fieldData.field_type === "select" && (
              <TextField
                label="Options"
                size="small"
                multiline
                minRows={3}
                value={fieldData.optionsText}
                onChange={(event) =>
                  setFieldData({
                    ...fieldData,
                    optionsText: event.target.value,
                  })
                }
                helperText="Label:value"
              />
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center h-10 gap-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {editingFieldId ? (
                  <Save fontSize="small" />
                ) : (
                  <Add fontSize="small" />
                )}
                {editingFieldId ? "Update Field" : "Add Field"}
              </button>
              {editingFieldId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFieldId(null);
                    setFieldData(emptyField);
                  }}
                  className="h-10 px-4 text-sm font-medium border rounded-md border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 space-y-2">
            {(selectedForm?.fields || []).map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between gap-3 px-3 py-2 border border-blue-100 rounded-md"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-slate-900">
                    {field.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {field.field_type} - order {field.display_order}
                    {field.is_required ? " - required" : ""}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <IconButton
                    label="Edit field"
                    onClick={() => {
                      setEditingFieldId(field.id);
                      setFieldData(fieldToFormState(field));
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    label="Delete field"
                    tone="danger"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))}
            {selectedFormId && !selectedForm?.fields?.length && (
              <p className="px-3 py-4 text-sm text-center rounded-md bg-blue-50 text-slate-500">
                This form has no fields.
              </p>
            )}
          </div>
        </section>
      </div>

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
    </FormPageLayout>
  );
}
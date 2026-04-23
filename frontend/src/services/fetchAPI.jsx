import axios from "axios";

const VITE_APP_BASE_URL = "http://localhost:3000/api";

const userURL = `${VITE_APP_BASE_URL}/users`;
const formsURL = `${VITE_APP_BASE_URL}/forms`;
const submissionsURL = `${VITE_APP_BASE_URL}/submissions`;

const authConfig = (token) => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

const login = async (email, password) => {
  const response = await axios.post(`${userURL}/login`, { email, password });
  return response.data;
};

const logout = async (token) => {
  const response = await axios.post(`${userURL}/logout`, {}, authConfig(token));
  return response.data;
};

const getForms = async (token) => {
  const response = await axios.get(`${formsURL}/`, authConfig(token));
  return response.data;
};

const createForm = async (token, data) => {
  const response = await axios.post(`${formsURL}/`, data, authConfig(token));
  return response.data;
};

const getFormById = async (token, id) => {
  const response = await axios.get(`${formsURL}/${id}`, authConfig(token));
  return response.data;
};

const updateForm = async (token, id, data) => {
  const response = await axios.put(`${formsURL}/${id}`, data, authConfig(token));
  return response.data;
};

const deleteForm = async (token, id) => {
  const response = await axios.delete(`${formsURL}/${id}`, authConfig(token));
  return response.data;
};

const createField = async (token, formId, data) => {
  const response = await axios.post(`${formsURL}/${formId}/fields`, data, authConfig(token));
  return response.data;
};

const updateField = async (token, formId, fieldId, data) => {
  const response = await axios.put(`${formsURL}/${formId}/fields/${fieldId}`, data, authConfig(token));
  return response.data;
};

const deleteField = async (token, formId, fieldId) => {
  const response = await axios.delete(`${formsURL}/${formId}/fields/${fieldId}`, authConfig(token));
  return response.data;
};

const getActiveForms = async (token) => {
  const response = await axios.get(`${formsURL}/active`, authConfig(token));
  return response.data;
};

const submitForm = async (token, formId, values) => {
  const response = await axios.post(`${formsURL}/${formId}/submit`, { values }, authConfig(token));
  return response.data;
};

const getSubmissions = async (token) => {
  const response = await axios.get(submissionsURL, authConfig(token));
  return response.data;
};

export {
  login, logout,
  getForms, getFormById, createForm, updateForm, deleteForm,
  createField, updateField, deleteField,
  getActiveForms, submitForm, getSubmissions,
};

export default {
  login,
  logout,
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  createField,
  updateField,
  deleteField,
  getActiveForms,
  submitForm,
  getSubmissions,
};

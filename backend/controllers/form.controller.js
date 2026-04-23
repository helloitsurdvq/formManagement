const db = require('../config');
const valid_stats = ['draft', 'active'];

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
};

const isPositiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const toBoolean = (value) => Boolean(Number(value));
const normalizeForm = (form) => ({
  id: form.id,
  title: form.title,
  form_description: form.form_description,
  display_order: form.display_order,
  form_status: form.form_status,
  created_by: form.created_by,
  created_at: form.created_at,
  updated_at: form.updated_at,
});

const getCreatedBy = (req) => {
  return req.user?.id || req.user?._id || req.body.created_by;
};

const getFormWithFields = async (formId) => {
  const forms = await query('select * from forms where id = ?', [formId]);
  if (forms.length === 0) return null;

  const rows = await query(
    `select
      ff.id as field_id,
      ff.form_id,
      ff.label,
      ff.field_type,
      ff.display_order as field_display_order,
      ff.is_required,
      ff.max_length,
      ff.min_value,
      ff.max_value,
      ff.allow_past_date,
      ff.created_at as field_created_at,
      ff.updated_at as field_updated_at,
      fo.id as option_id,
      fo.option_label,
      fo.option_value,
      fo.display_order as option_display_order,
      fo.created_at as option_created_at
    from form_fields ff
    left join field_options fo on fo.field_id = ff.id
    where ff.form_id = ?
    order by ff.display_order asc, ff.id asc, fo.display_order asc, fo.id asc`,
    [formId]
  );

  const fieldsById = new Map();
  rows.forEach((row) => {
    if (!fieldsById.has(row.field_id)) {
      fieldsById.set(row.field_id, {
        id: row.field_id,
        form_id: row.form_id,
        label: row.label,
        field_type: row.field_type,
        display_order: row.field_display_order,
        is_required: toBoolean(row.is_required),
        max_length: row.max_length,
        min_value: row.min_value,
        max_value: row.max_value,
        allow_past_date: toBoolean(row.allow_past_date),
        created_at: row.field_created_at,
        updated_at: row.field_updated_at,
        options: [],
      });
    }
    if (row.option_id) {
      fieldsById.get(row.field_id).options.push({
        id: row.option_id,
        field_id: row.field_id,
        option_label: row.option_label,
        option_value: row.option_value,
        display_order: row.option_display_order,
        created_at: row.option_created_at,
      });
    }
  });

  return {
    ...normalizeForm(forms[0]),
    fields: Array.from(fieldsById.values()),
  };
};

const getForms = async (req, res) => {
  try {
    const forms = await query(`select * from forms order by display_order asc, id DESC`);
    res.status(200).json({
      message: 'Get forms successfully',
      data: forms.map(normalizeForm),
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot get forms', error: error.message });
  }
};

const createForm = async (req, res) => {
  try {
    const {
      title,
      form_description = null,
      display_order = 0,
      form_status = 'draft',
    } = req.body;
    const created_by = getCreatedBy(req);
    if (!title || typeof title !== 'string' || title.trim() === '')
      return res.status(400).json({ message: 'title is required' });
    if (!isPositiveId(created_by))
      return res.status(400).json({ message: 'created_by is required' });
    if (!valid_stats.includes(form_status)) 
      return res.status(400).json({ message: 'form_status must be draft or active' });
    const result = await query(
      `insert into forms (title, form_description, display_order, form_status, created_by)
      values (?, ?, ?, ?, ?)`,
      [title.trim(), form_description, Number(display_order) || 0, form_status, created_by]
    );
    const form = await getFormWithFields(result.insertId);

    res.status(201).json({
      message: 'Create form successfully',
      data: form,
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot create form', error: error.message });
  }
};

const getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isPositiveId(id)) return res.status(400).json({ message: 'Invalid form id' });
    const form = await getFormWithFields(id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.status(200).json({
      message: 'Get form successfully',
      data: form,
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot get form', error: error.message });
  }
};

const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isPositiveId(id))
      return res.status(400).json({ message: 'Invalid form id' });

    const allowedFields = ['title', 'form_description', 'display_order', 'form_status'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });
    if (Object.keys(updates).length === 0) 
      return res.status(400).json({ message: 'No valid form fields to update' });
    if (updates.title !== undefined && (!updates.title || updates.title.trim() === ''))
      return res.status(400).json({ message: 'title cannot be empty' });
    if (updates.form_status !== undefined && !valid_stats.includes(updates.form_status))
      return res.status(400).json({ message: 'form_status must be draft or active' });
    if (updates.display_order !== undefined) updates.display_order = Number(updates.display_order) || 0;
    if (updates.title !== undefined) updates.title = updates.title.trim();

    const setClause = Object.keys(updates).map((field) => `${field} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const result = await query(`update forms SET ${setClause} where id = ?`, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }
    const form = await getFormWithFields(id);
    res.status(200).json({
      message: 'Update form successfully',
      data: form,
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot update form', error: error.message });
  }
};

const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isPositiveId(id)) {
      return res.status(400).json({ message: 'Invalid form id' });
    }
    const result = await query('delete from forms where id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.status(200).json({ message: 'Delete form successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Cannot delete form', error: error.message });
  }
};

module.exports = { getForms, createForm, getFormById, updateForm, deleteForm };
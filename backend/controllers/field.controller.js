const db = require('../config');
const validTypes = ['text', 'number', 'date', 'color', 'select'];

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

const beginTransaction = () => {
  return new Promise((resolve, reject) => {
    db.beginTransaction((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const commit = () => {
  return new Promise((resolve, reject) => {
    db.commit((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const rollback = () => {
  return new Promise((resolve) => {
    db.rollback(() => resolve());
  });
};

const isPositiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const toBoolean = (value) => Boolean(Number(value));
const toMysqlBoolean = (value) => (value ? 1 : 0);
const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return Number(value);
};

const normalizeField = (field, options = []) => ({
  id: field.id,
  form_id: field.form_id,
  label: field.label,
  field_type: field.field_type,
  display_order: field.display_order,
  is_required: toBoolean(field.is_required),
  max_length: field.max_length,
  min_value: field.min_value,
  max_value: field.max_value,
  allow_past_date: toBoolean(field.allow_past_date),
  created_at: field.created_at,
  updated_at: field.updated_at,
  options,
});

const checkFormExists = async (formId) => {
  const forms = await query('select id from forms where id = ?', [formId]);
  return forms.length > 0;
};

const getFieldById = async (formId, fieldId) => {
  const fields = await query('select * from form_fields where id = ? and form_id = ?', [fieldId, formId]);

  if (fields.length === 0) {
    return null;
  }

  const options = await query(
    `select id, field_id, option_label, option_value, display_order, created_at
    from field_options
    where field_id = ?
    order by display_order asc, id asc`,
    [fieldId]
  );

  return normalizeField(fields[0], options);
};

const validateFieldBody = (body, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || Object.prototype.hasOwnProperty.call(body, 'label')) {
    if (!body.label || typeof body.label !== 'string' || body.label.trim() === '') {
      errors.push('label is required');
    }
  }

  if (!isUpdate || Object.prototype.hasOwnProperty.call(body, 'field_type')) {
    if (!validTypes.includes(body.field_type)) {
      errors.push('field_type must be text, number, date, color, or select');
    }
  }

  if (body.max_length !== undefined && body.max_length !== null && Number(body.max_length) < 0) {
    errors.push('max_length must be greater than or equal to 0');
  }

  if (
    body.min_value !== undefined &&
    body.max_value !== undefined &&
    body.min_value !== null &&
    body.max_value !== null &&
    Number(body.min_value) > Number(body.max_value)
  ) {
    errors.push('min_value cannot be greater than max_value');
  }

  if (body.options !== undefined) {
    if (!Array.isArray(body.options)) {
      errors.push('options must be an array');
    } else {
      body.options.forEach((option, index) => {
        if (!option.option_label || !option.option_value) {
          errors.push(`options[${index}] must include option_label and option_value`);
        }
      });
    }
  }

  return errors;
};

const insertOptions = async (fieldId, options = []) => {
  for (const [index, option] of options.entries()) {
    await query(
      `insert into field_options (field_id, option_label, option_value, display_order)
      values (?, ?, ?, ?)`,
      [
        fieldId,
        option.option_label.trim(),
        option.option_value.trim(),
        Number(option.display_order) || index,
      ]
    );
  }
};

const createField = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveId(id)) {
    return res.status(400).json({ message: 'Invalid form id' });
  }

  const errors = validateFieldBody(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const {
    label,
    field_type,
    display_order = 0,
    is_required = false,
    max_length = null,
    min_value = null,
    max_value = null,
    allow_past_date = false,
    options = [],
  } = req.body;

  try {
    if (!(await checkFormExists(id))) {
      return res.status(404).json({ message: 'Form not found' });
    }

    await beginTransaction();

    const result = await query(
      `insert into form_fields
        (form_id, label, field_type, display_order, is_required, max_length, min_value, max_value, allow_past_date)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        label.trim(),
        field_type,
        Number(display_order) || 0,
        toMysqlBoolean(is_required),
        toNullableNumber(max_length),
        toNullableNumber(min_value),
        toNullableNumber(max_value),
        toMysqlBoolean(allow_past_date),
      ]
    );

    if (field_type === 'select') {
      await insertOptions(result.insertId, options);
    }

    await commit();

    const field = await getFieldById(id, result.insertId);

    res.status(201).json({
      message: 'Create field successfully',
      data: field,
    });
  } catch (error) {
    await rollback();
    res.status(500).json({ message: 'Cannot create field', error: error.message });
  }
};

const updateField = async (req, res) => {
  const { id, fid } = req.params;

  if (!isPositiveId(id)) {
    return res.status(400).json({ message: 'Invalid form id' });
  }

  if (!isPositiveId(fid)) {
    return res.status(400).json({ message: 'Invalid field id' });
  }

  const errors = validateFieldBody(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const allowedFields = [
    'label',
    'field_type',
    'display_order',
    'is_required',
    'max_length',
    'min_value',
    'max_value',
    'allow_past_date',
  ];
  const updates = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0 && req.body.options === undefined) {
    return res.status(400).json({ message: 'No valid field data to update' });
  }

  if (updates.label !== undefined) {
    updates.label = updates.label.trim();
  }
  if (updates.display_order !== undefined) {
    updates.display_order = Number(updates.display_order) || 0;
  }
  if (updates.is_required !== undefined) {
    updates.is_required = toMysqlBoolean(updates.is_required);
  }
  if (updates.allow_past_date !== undefined) {
    updates.allow_past_date = toMysqlBoolean(updates.allow_past_date);
  }
  ['max_length', 'min_value', 'max_value'].forEach((field) => {
    if (updates[field] !== undefined) {
      updates[field] = toNullableNumber(updates[field]);
    }
  });

  try {
    const currentField = await getFieldById(id, fid);
    if (!currentField) {
      return res.status(404).json({ message: 'Field not found' });
    }

    await beginTransaction();

    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map((field) => `${field} = ?`).join(', ');
      await query(`update form_fields set ${setClause} where id = ? and form_id = ?`, [
        ...Object.values(updates),
        fid,
        id,
      ]);
    }

    const nextType = updates.field_type || currentField.field_type;
    if (req.body.options !== undefined || nextType !== 'select') {
      await query('delete from field_options where field_id = ?', [fid]);

      if (nextType === 'select' && req.body.options !== undefined) {
        await insertOptions(fid, req.body.options);
      }
    }

    await commit();

    const field = await getFieldById(id, fid);

    res.status(200).json({
      message: 'Update field successfully',
      data: field,
    });
  } catch (error) {
    await rollback();
    res.status(500).json({ message: 'Cannot update field', error: error.message });
  }
};

const deleteField = async (req, res) => {
  const { id, fid } = req.params;

  if (!isPositiveId(id)) {
    return res.status(400).json({ message: 'Invalid form id' });
  }

  if (!isPositiveId(fid)) {
    return res.status(400).json({ message: 'Invalid field id' });
  }

  try {
    const result = await query('delete from form_fields where id = ? and form_id = ?', [fid, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Field not found' });
    }

    res.status(200).json({ message: 'Delete field successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Cannot delete field', error: error.message });
  }
};

module.exports = {
  createField,
  updateField,
  deleteField,
};
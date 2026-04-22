const db = require('../config');

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
const isEmptyValue = (value) => value === undefined || value === null || value === '';
const getSubmittedBy = (req) => req.user?.id || req.user?._id;

const getActiveForms = async (req, res) => {
  try {
    const forms = await query(
      `select id, title, form_description, display_order, form_status, created_by, created_at, updated_at
      from forms
      where form_status = 'active'
      order by display_order asc, id desc`
    );

    res.status(200).json({
      message: 'Get active forms successfully',
      data: forms,
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot get active forms', error: error.message });
  }
};

const getFormFields = async (formId) => {
  return query(
    `select ff.*, fo.id as option_id, fo.option_value
    from form_fields ff
    left join field_options fo on fo.field_id = ff.id
    where ff.form_id = ?
    order by ff.display_order asc, ff.id asc`,
    [formId]
  );
};

const groupFields = (rows) => {
  const fieldsById = new Map();

  rows.forEach((row) => {
    if (!fieldsById.has(row.id)) {
      fieldsById.set(row.id, {
        id: row.id,
        form_id: row.form_id,
        label: row.label,
        field_type: row.field_type,
        display_order: row.display_order,
        is_required: toBoolean(row.is_required),
        max_length: row.max_length,
        min_value: row.min_value,
        max_value: row.max_value,
        allow_past_date: toBoolean(row.allow_past_date),
        options: [],
      });
    }

    if (row.option_id) {
      fieldsById.get(row.id).options.push(row.option_value);
    }
  });

  return Array.from(fieldsById.values());
};

const getSubmittedValue = (values, fieldId) => {
  if (Array.isArray(values)) {
    const submitted = values.find((item) => Number(item.field_id) === Number(fieldId));
    return submitted ? submitted.value : undefined;
  }

  return values ? values[fieldId] : undefined;
};

const validateSubmission = (fields, values) => {
  const errors = [];

  fields.forEach((field) => {
    const value = getSubmittedValue(values, field.id);

    if (field.is_required && isEmptyValue(value)) {
      errors.push(`${field.label} is required`);
      return;
    }

    if (isEmptyValue(value)) {
      return;
    }

    if (field.field_type === 'text' && field.max_length && String(value).length > Number(field.max_length)) {
      errors.push(`${field.label} cannot be longer than ${field.max_length} characters`);
    }

    if (field.field_type === 'number') {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) {
        errors.push(`${field.label} must be a number`);
        return;
      }
      if (field.min_value !== null && numberValue < Number(field.min_value)) {
        errors.push(`${field.label} must be greater than or equal to ${field.min_value}`);
      }
      if (field.max_value !== null && numberValue > Number(field.max_value)) {
        errors.push(`${field.label} must be less than or equal to ${field.max_value}`);
      }
    }

    if (field.field_type === 'date') {
      const dateValue = new Date(value);
      if (Number.isNaN(dateValue.getTime())) {
        errors.push(`${field.label} must be a valid date`);
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateValue.setHours(0, 0, 0, 0);
      if (!field.allow_past_date && dateValue < today) {
        errors.push(`${field.label} cannot be in the past`);
      }
    }

    if (field.field_type === 'select' && !field.options.includes(String(value))) {
      errors.push(`${field.label} must be one of the available options`);
    }
  });

  return errors;
};

const buildSubmissionValue = (field, value) => {
  const submissionValue = {
    value_text: null,
    value_number: null,
    value_date: null,
  };

  if (isEmptyValue(value)) {
    return submissionValue;
  }

  if (field.field_type === 'number') {
    submissionValue.value_number = Number(value);
    return submissionValue;
  }

  if (field.field_type === 'date') {
    submissionValue.value_date = value;
    return submissionValue;
  }

  submissionValue.value_text = String(value);
  return submissionValue;
};

const submitForm = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveId(id)) {
    return res.status(400).json({ message: 'Invalid form id' });
  }

  const submittedBy = getSubmittedBy(req);
  if (!isPositiveId(submittedBy)) {
    return res.status(400).json({ message: 'submitted_by is required' });
  }

  const values = req.body.values || {};

  try {
    const forms = await query('select id, form_status from forms where id = ?', [id]);

    if (forms.length === 0) {
      return res.status(404).json({ message: 'Form not found' });
    }

    if (forms[0].form_status !== 'active') {
      return res.status(400).json({ message: 'Only active forms can be submitted' });
    }

    const fields = groupFields(await getFormFields(id));
    const errors = validateSubmission(fields, values);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    await beginTransaction();

    const submissionResult = await query(
      'insert into form_submissions (form_id, submitted_by) values (?, ?)',
      [id, submittedBy]
    );

    for (const field of fields) {
      const rawValue = getSubmittedValue(values, field.id);

      if (isEmptyValue(rawValue)) {
        continue;
      }

      const submissionValue = buildSubmissionValue(field, rawValue);

      await query(
        `insert into submission_values (submission_id, field_id, value_text, value_number, value_date)
        values (?, ?, ?, ?, ?)`,
        [
          submissionResult.insertId,
          field.id,
          submissionValue.value_text,
          submissionValue.value_number,
          submissionValue.value_date,
        ]
      );
    }

    await commit();

    res.status(201).json({
      message: 'Submit form successfully',
      data: {
        id: submissionResult.insertId,
        form_id: Number(id),
        submitted_by: Number(submittedBy),
      },
    });
  } catch (error) {
      await rollback();
      res.status(500).json({ message: 'Cannot submit form', error: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const role = req.user?.type_of_account || req.user?.role;
    const params = [];
    let whereClause = '';

    if (role !== 'admin') {
      whereClause = 'where fs.submitted_by = ?';
      params.push(req.user.id);
    }

    const rows = await query(
      `select
        fs.id as submission_id,
        fs.form_id,
        f.title as form_title,
        fs.submitted_by,
        a.email as submitted_by_email,
        fs.submitted_at,
        sv.id as value_id,
        sv.field_id,
        ff.label,
        ff.field_type,
        sv.value_text,
        sv.value_number,
        sv.value_date
      from form_submissions fs
      join forms f on f.id = fs.form_id
      join accounts a on a.id = fs.submitted_by
      left join submission_values sv on sv.submission_id = fs.id
      left join form_fields ff on ff.id = sv.field_id
      ${whereClause}
      order by fs.submitted_at desc, fs.id desc, ff.display_order asc, ff.id asc`
      ,
      params
    );

    const submissionsById = new Map();

    rows.forEach((row) => {
      if (!submissionsById.has(row.submission_id)) {
        submissionsById.set(row.submission_id, {
          id: row.submission_id,
          form_id: row.form_id,
          form_title: row.form_title,
          submitted_by: row.submitted_by,
          submitted_by_email: row.submitted_by_email,
          submitted_at: row.submitted_at,
          values: [],
        });
      }

      if (row.value_id) {
        submissionsById.get(row.submission_id).values.push({
          id: row.value_id,
          field_id: row.field_id,
          label: row.label,
          field_type: row.field_type,
          value: row.value_text ?? row.value_number ?? row.value_date,
        });
      }
    });

    res.status(200).json({
      message: 'Get submissions successfully',
      data: Array.from(submissionsById.values()),
    });
  } catch (error) {
    res.status(500).json({ message: 'Cannot get submissions', error: error.message });
  }
};

module.exports = {
  getActiveForms,
  submitForm,
  getSubmissions,
};

const express = require('express');
const {
  createField,
  updateField,
  deleteField,
} = require('../controllers/field.controller');

const router = express.Router({ mergeParams: true });

router.post('/', createField);
router.put('/:fid', updateField);
router.delete('/:fid', deleteField);

module.exports = router;

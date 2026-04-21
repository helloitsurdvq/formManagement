const express = require('express');
const {
  getForms,
  createForm,
  getFormById,
  updateForm,
  deleteForm,
} = require('../controllers/form.controller');

const router = express.Router();

router.get('/', getForms);
router.post('/', createForm);
router.get('/:id', getFormById);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);

module.exports = router;

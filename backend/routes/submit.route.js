const express = require('express');
const {
  getActiveForms,
  submitForm,
  getSubmissions,
} = require('../controllers/submit.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/forms/active', authMiddleware, getActiveForms);
router.post('/forms/:id/submit', authMiddleware, submitForm);
router.get('/submissions', authMiddleware, getSubmissions);

module.exports = router;

const express = require('express');
const {
  getForms,
  createForm,
  getFormById,
  updateForm,
  deleteForm,
} = require('../controllers/form.controller');
const fieldRoutes = require('./field.route');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware);

router.get('/', getForms);
router.post('/', createForm);
router.use('/:id/fields', fieldRoutes);
router.get('/:id', getFormById);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);

module.exports = router;

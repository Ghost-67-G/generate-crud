
const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validate');
const { validateAccessToken } = require('../../middlewares/auth0.middleware');
const notes2Controller = require('./controller');
const notes2Validation = require('./validation');

router
  .route('/')
  .post(validateAccessToken, validate(notes2Validation.createnotes2), notes2Controller.create)
  .get(validateAccessToken, validate(notes2Validation.getnotes2s), notes2Controller.getAll);

router
  .route('/:id')
  .get(validateAccessToken, validate(notes2Validation.getnotes2), notes2Controller.getOne)
  .patch(validateAccessToken, validate(notes2Validation.updatenotes2), notes2Controller.update)
  .delete(validateAccessToken, validate(notes2Validation.deletenotes2), notes2Controller.remove);

module.exports = router;

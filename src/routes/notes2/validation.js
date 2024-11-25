
const Joi = require('joi');

const createnotes2 = {
  body: Joi.object().keys({
    user_id: Joi.string(),
    family_id: Joi.number(),
    class_id: Joi.number(),
    title: Joi.string().required(),
    content: Joi.string().required(),
    organization_id: Joi.string(),
    _id: Joi.string(),
    updatedAt: Joi.date(),
    createdAt: Joi.date()
  }),
};

const getnotes2s = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const getnotes2 = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const updatenotes2 = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    user_id: Joi.string(),
    family_id: Joi.number(),
    class_id: Joi.number(),
    title: Joi.string().required(),
    content: Joi.string().required(),
    organization_id: Joi.string(),
    _id: Joi.string(),
    updatedAt: Joi.date(),
    createdAt: Joi.date()
  }).min(1),
};

const deletenotes2 = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  createnotes2,
  getnotes2s,
  getnotes2,
  updatenotes2,
  deletenotes2,
};
  
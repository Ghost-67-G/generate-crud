
const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { createnotes2, querynotes2s, getnotes2ById, updatenotes2ById, deletenotes2ById } = require('./service');

const create = catchAsync(async (req, res) => {
  const data = await createnotes2({
    user_id: req.body.user_id,
    family_id: req.body.family_id,
    class_id: req.body.class_id,
    title: req.body.title,
    content: req.body.content,
    organization_id: req.body.organization_id,
    _id: req.body._id,
    updatedAt: req.body.updatedAt,
    createdAt: req.body.createdAt,
    organization_id: req.auth.org_id,
  });
  res.status(httpStatus.CREATED).send(data);
});

const getAll = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['user_id', 'family_id', 'class_id', 'title', 'content', 'organization_id', '_id', 'updatedAt', 'createdAt']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  filter.organization_id = req.auth.org_id;
  const results = await querynotes2s(filter, options);
  res.send(results);
});

const getOne = catchAsync(async (req, res) => {
  const notes2 = await getnotes2ById(req.params.id);
  if (!notes2) return res.status(httpStatus.NOT_FOUND).send({ message: 'notes2 not found' });
  res.send(notes2);
});

const update = catchAsync(async (req, res) => {
  const notes2 = await updatenotes2ById(req.params.id, req.body);
  res.send(notes2);
});

const remove = catchAsync(async (req, res) => {
  await deletenotes2ById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
  
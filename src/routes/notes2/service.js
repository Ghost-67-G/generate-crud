
const httpStatus = require('http-status');
const notes2 = require('../../models/notes2');
const ApiError = require('../../utils/ApiError');

const createnotes2 = async (notes2Body) => {
  return notes2.create(notes2Body);
};

const querynotes2s = async (filter, options) => {
  const notes2s = await notes2.paginate(filter, options);
  return notes2s;
};

const getnotes2ById = async (id) => {
  return notes2.findById(id);
};

const updatenotes2ById = async (id, updateBody) => {
  const notes2 = await getnotes2ById(id);
  if (!notes2) {
    throw new ApiError(httpStatus.NOT_FOUND, 'notes2 not found');
  }
  Object.assign(notes2, updateBody);
  await notes2.save();
  return notes2;
};

const deletenotes2ById = async (id) => {
  const notes2 = await getnotes2ById(id);
  if (!notes2) {
    throw new ApiError(httpStatus.NOT_FOUND, 'notes2 not found');
  }
  await notes2.remove();
  return notes2;
};

module.exports = {
  createnotes2,
  querynotes2s,
  getnotes2ById,
  updatenotes2ById,
  deletenotes2ById,
};

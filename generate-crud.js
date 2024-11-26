#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');

const getModelFields = (modelPath) => {
  const resolvedPath = path.resolve(process.cwd(), modelPath);
  const model = require(resolvedPath);
  const schema = model.schema.paths;
  const fields = {};
  for (const key in schema) {
    if (schema.hasOwnProperty(key) && key !== '__v' && key !== '_id') {
      if(key.includes('.')){
        // Nested fields so we make it an object
        const nestedFields = key.split('.');
          fields[nestedFields[0]] = {
            ...(fields[nestedFields[0]]??{}),
            [nestedFields[1]]: schema[key].instance
        };
      }else{
        const fieldType = schema[key].instance; 
        fields[key] = fieldType;
      }
    }
  }
  return fields;
};

const generateRouteTemplate = (name) => `
const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const ${name.toLowerCase()}Controller = require('./controller');
const ${name.toLowerCase()}Validation = require('./validation');

router
  .route('/')
  .post(auth(), validate(${name.toLowerCase()}Validation.create${name}), ${name.toLowerCase()}Controller.create)
  .get(auth(), validate(${name.toLowerCase()}Validation.get${name}s), ${name.toLowerCase()}Controller.getAll);

router
  .route('/:id')
  .get(auth(), validate(${name.toLowerCase()}Validation.get${name}), ${name.toLowerCase()}Controller.getOne)
  .patch(auth(), validate(${name.toLowerCase()}Validation.update${name}), ${name.toLowerCase()}Controller.update)
  .delete(auth(), validate(${name.toLowerCase()}Validation.delete${name}), ${name.toLowerCase()}Controller.remove);

module.exports = router;
`;

const generateControllerTemplate = (name, fields) => {
  // fix this 
  const fieldAssignments = Object.keys(fields).map(field => {
    if (typeof fields[field] === 'object') {
      return `${field}: { ${Object.keys(fields[field]).map(subField => `${subField}: req.body.${field}.${subField}`).join(', ')} }`;
    }
    return `${field}: req.body.${field}`;
  }).join(',\n    ');
  
  return `
const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { create${name}, query${name}s, get${name}ById, update${name}ById, delete${name}ById } = require('./service');

const create = catchAsync(async (req, res) => {
  const data = await create${name}({
    ${fieldAssignments},
    organization_id: req.auth.org_id,
  });
  res.status(httpStatus.CREATED).send(data);
});

const getAll = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['${Object.keys(fields).join("', '")}']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  filter.organization_id = req.auth.org_id;
  const results = await query${name}s(filter, options);
  res.send(results);
});

const getOne = catchAsync(async (req, res) => {
  const ${name.toLowerCase()} = await get${name}ById(req.params.id);
  if (!${name.toLowerCase()}) return res.status(httpStatus.NOT_FOUND).send({ message: '${name} not found' });
  res.send(${name.toLowerCase()});
});

const update = catchAsync(async (req, res) => {
  const ${name.toLowerCase()} = await update${name}ById(req.params.id, req.body);
  res.send(${name.toLowerCase()});
});

const remove = catchAsync(async (req, res) => {
  await delete${name}ById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
  `;
};

const generateServiceTemplate = (name, fields) => `
const httpStatus = require('http-status');
const ${name} = require('../../models/${name.toLowerCase()}.model');
const ApiError = require('../../utils/ApiError');

const create${name} = async (${name.toLowerCase()}Body) => {
  return ${name}.create(${name.toLowerCase()}Body);
};

const query${name}s = async (filter, options) => {
  const ${name.toLowerCase()}s = await ${name}.paginate(filter, options);
  return ${name.toLowerCase()}s;
};

const get${name}ById = async (id) => {
  return ${name}.findById(id);
};

const update${name}ById = async (id, updateBody) => {
  const ${name.toLowerCase()} = await get${name}ById(id);
  if (!${name.toLowerCase()}) {
    throw new ApiError(httpStatus.NOT_FOUND, '${name} not found');
  }
  Object.assign(${name.toLowerCase()}, updateBody);
  await ${name.toLowerCase()}.save();
  return ${name.toLowerCase()};
};

const delete${name}ById = async (id) => {
  const ${name.toLowerCase()} = await get${name}ById(id);
  if (!${name.toLowerCase()}) {
    throw new ApiError(httpStatus.NOT_FOUND, '${name} not found');
  }
  await ${name.toLowerCase()}.remove();
  return ${name.toLowerCase()};
};

module.exports = {
  create${name},
  query${name}s,
  get${name}ById,
  update${name}ById,
  delete${name}ById,
};
`;

const generateValidationTemplate = (name, fields) => {
  const generateValidationFields = (fields) => {
    return Object.keys(fields).map(field => {
      if (typeof fields[field] === 'object') {
        return `${field}: Joi.object().keys({ ${generateValidationFields(fields[field])} })`;
      }
      let fieldType = 'Joi.string()';
      switch (fields[field]) {
        case 'Number':
          fieldType = 'Joi.number()';
          break;
        case 'Date':
          fieldType = 'Joi.date()';
          break;
      }
      return `${field}: ${fieldType}${field === 'title' || field === 'content' ? '.required()' : ''}`;
    }).join(',\n    ');
  };

  const validationFields = generateValidationFields(fields);

  return `
const Joi = require('joi');

const create${name} = {
  body: Joi.object().keys({
    ${validationFields}
  }),
};

const get${name}s = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const get${name} = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const update${name} = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    ${validationFields}
  }).min(1),
};

const delete${name} = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  create${name},
  get${name}s,
  get${name},
  update${name},
  delete${name},
};
  `;
};

const questions = [
  {
    type: 'input',
    name: 'modelPath',
    message: 'Enter the model.js file path:',
  },
  {
    type: 'input',
    name: 'folderName',
    message: 'Enter the folder name:',
  },
];

inquirer.prompt(questions).then((answers) => {
  const { modelPath, folderName } = answers;
  const modelName = path.basename(modelPath, path.extname(modelPath));
  const modelFields = getModelFields(modelPath);
  const folderDir = path.join(process.cwd(), `./src/routes/${folderName}`);

  console.log("🚀 ~ inquirer.prompt ~ __dirname:", __dirname)
  fs.ensureDirSync(folderDir); // Ensure that the directory and its parent directories exist
  const capitalizedName = folderName.charAt(0).toUpperCase() + folderName.slice(1)
  console.log("🚀 ~ inquirer.prompt ~ capitalizedName:", capitalizedName)
  fs.writeFileSync(path.join(folderDir, 'route.js'), generateRouteTemplate(capitalizedName));
  fs.writeFileSync(path.join(folderDir, 'controller.js'), generateControllerTemplate(capitalizedName, modelFields));
  fs.writeFileSync(path.join(folderDir, 'service.js'), generateServiceTemplate(capitalizedName, modelFields));
  fs.writeFileSync(path.join(folderDir, 'validation.js'), generateValidationTemplate(capitalizedName, modelFields));
  // const modelDestination = path.join(folderDir, `${modelName}.js`);
  // fs.moveSync(modelPath, modelDestination, { overwrite: true });

  console.log(`CRUD for ${folderName} created successfully in ${folderDir}`);
});

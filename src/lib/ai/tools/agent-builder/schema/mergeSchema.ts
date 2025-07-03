import { SchemaObject, Model, Field } from '@paljs/types';
import { existsSync, readFileSync } from 'fs';

export function parseSchema(path: string): any {
  return existsSync(path)
    ? JSON.parse(readFileSync(path, { encoding: 'utf-8' }))
    : {
      models: [],
      enums: [],
    };
}

export function mergeSchema(object: SchemaObject, schemaPath: string): any {
  const schema = parseSchema(schemaPath);
  const newSchema: any = {
    models: [],
    enums: object.enums,
  };
  object.models.forEach((item) => {
    const schemaItem = schema.models.find((model) => model.id === item.name);
    if (!schemaItem) {
      newSchema.models.push(handleNewModel(item));
    } else {
      const newItem: any = {
        ...schemaItem,
        fields: [],
      };
      item.fields.forEach((field) => {
        const schemaField = schemaItem.fields.find((item: any) => item.name === field.name);
        if (!schemaField) {
          newItem.fields.push(handleNewField(field, schemaItem.name));
        } else {
          const newFields = {};
          newItem.fields.push({
            ...newFields,
            ...schemaField,
            ...getOriginalField(field, schemaItem.id),
          });
        }
      });
      newItem.fields.sort((a, b) => a.order - b.order);
      newSchema.models.push(newItem);
    }
  });
  return newSchema;
}

function checkIdFieldExist(model: Model) {
  return !!model.fields.find((field) => field.isId);
}

function defaultDisplayFields(model: Model) {
  const firstDisplayField = ['email', 'name', 'title', 'total', 'price', 'id'];
  const secondDisplayField = ['price', 'description', 'chain', 'total', 'url', 'title', 'description', 'image'];
  const thirdDisplayField = ['description', 'price', 'url'];
  // const fourthDisplayField = ['status', 'state', 'condition', 'type'];

  const displayFields = [];

  // Find the first display field
  for (const fieldName of firstDisplayField) {
    const field = model.fields.find((f) => f.name === fieldName);
    if (field) {
      displayFields.push(field.name);
      break;
    }
  }

  // Find the second display field
  for (const fieldName of secondDisplayField) {
    const field = model.fields.find((f) => f.name === fieldName);
    if (field) {
      displayFields.push(field.name);
      break;
    }
  }

  // Find the third display field
  for (const fieldName of thirdDisplayField) {
    const field = model.fields.find((f) => f.name === fieldName);
    if (field) {
      displayFields.push(field.name);
      break;
    }
  }

  // If no display fields were found, use the id field as fallback
  if (displayFields.length === 0) {
    const idField = model.fields.find((field) => field.isId);
    if (idField) {
      displayFields.push(idField.name);
    }
  }

  return displayFields;
}

function handleNewModel(model: Model) {
  const newItem: any = {
    id: model.name,
    title: getTitle(model.name),
    name: model.name,
    idField: model.fields.find((field) => field.isId)?.name ?? '',
    displayFields: defaultDisplayFields(model),
    create: true,
    update: checkIdFieldExist(model),
    delete: checkIdFieldExist(model),
    fields: [],
  };
  model.fields.forEach((field) => {
    newItem.fields.push(handleNewField(field, model.name));
  });
  return newItem;
}

const defaultField = ['id', 'createdAt', 'updatedAt'];

function handleNewField(field: Field, modelName: string): any {
  return {
    ...getOriginalField(field, modelName),
    title: getTitle(field.name),
    create: !defaultField.includes(field.name) && !field.relationField && field.name !== 'id',
    update: !defaultField.includes(field.name) && !field.relationField,
    editor: false,
    upload: false,
    read: true,
    filter: field.kind === 'enum' || (field.kind === 'scalar' && field.type !== 'Json'),
    sort: true,
    order:
      field.name === 'image' ? 0
        : field.name === 'name' || field.name === 'title' || field.name === 'value' || field.name === 'id' ? 1
          : field.name === 'price' ? 2
            : field.name === 'amount' ? 3
              : field.name === 'applicationFee' ? 4
                : field.name === 'stripeFee' ? 5
                  : field.name === 'total' ? 6 : 7,
  };
}

function getTitle(id: string) {
  const split = id.split(/(?=[A-Z])/);
  split[0] = split[0].charAt(0).toUpperCase() + split[0].slice(1);
  return split.join(' ');
}

function getOriginalField(
  field: Field,
  modelName: string,
): Omit<Field, 'relation' | 'documentation' | 'map'> & { id: string } {
  delete field.relation;
  delete field.documentation;
  return {
    id: modelName + '.' + field.name,
    ...field,
  };
}

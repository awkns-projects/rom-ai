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
  // Generate appropriate emoji based on model name
  const generateModelEmoji = (modelName: string): string => {
    const name = modelName.toLowerCase();
    
    // Common business model emojis
    if (name.includes('user') || name.includes('person') || name.includes('member') || name.includes('customer') || name.includes('client')) return '👤';
    if (name.includes('product') || name.includes('item') || name.includes('inventory')) return '📦';
    if (name.includes('order') || name.includes('purchase') || name.includes('transaction')) return '🛒';
    if (name.includes('payment') || name.includes('invoice') || name.includes('billing')) return '💳';
    if (name.includes('email') || name.includes('message') || name.includes('notification')) return '📧';
    if (name.includes('report') || name.includes('analytics') || name.includes('metric')) return '📊';
    if (name.includes('task') || name.includes('todo') || name.includes('activity')) return '✅';
    if (name.includes('project') || name.includes('campaign') || name.includes('initiative')) return '🎯';
    if (name.includes('company') || name.includes('organization') || name.includes('business')) return '🏢';
    if (name.includes('category') || name.includes('tag') || name.includes('label')) return '🏷️';
    if (name.includes('file') || name.includes('document') || name.includes('attachment')) return '📄';
    if (name.includes('image') || name.includes('photo') || name.includes('picture')) return '🖼️';
    if (name.includes('video') || name.includes('media') || name.includes('content')) return '🎬';
    if (name.includes('event') || name.includes('meeting') || name.includes('appointment')) return '📅';
    if (name.includes('comment') || name.includes('review') || name.includes('feedback')) return '💬';
    if (name.includes('setting') || name.includes('config') || name.includes('preference')) return '⚙️';
    if (name.includes('role') || name.includes('permission') || name.includes('access')) return '🔐';
    if (name.includes('subscription') || name.includes('plan') || name.includes('package')) return '📋';
    if (name.includes('contact') || name.includes('lead') || name.includes('prospect')) return '📞';
    if (name.includes('location') || name.includes('address') || name.includes('place')) return '📍';
    if (name.includes('team') || name.includes('group') || name.includes('department')) return '👥';
    if (name.includes('ticket') || name.includes('support') || name.includes('issue')) return '🎫';
    if (name.includes('blog') || name.includes('post') || name.includes('article')) return '📝';
    if (name.includes('course') || name.includes('lesson') || name.includes('training')) return '🎓';
    if (name.includes('health') || name.includes('medical') || name.includes('wellness')) return '🏥';
    if (name.includes('fitness') || name.includes('workout') || name.includes('exercise')) return '💪';
    if (name.includes('food') || name.includes('meal') || name.includes('recipe')) return '🍽️';
    if (name.includes('travel') || name.includes('trip') || name.includes('journey')) return '✈️';
    if (name.includes('book') || name.includes('library') || name.includes('reading')) return '📚';
    if (name.includes('music') || name.includes('song') || name.includes('audio')) return '🎵';
    if (name.includes('game') || name.includes('play') || name.includes('entertainment')) return '🎮';
    if (name.includes('weather') || name.includes('climate') || name.includes('forecast')) return '🌤️';
    if (name.includes('car') || name.includes('vehicle') || name.includes('transport')) return '🚗';
    if (name.includes('house') || name.includes('home') || name.includes('property')) return '🏠';
    if (name.includes('money') || name.includes('finance') || name.includes('budget')) return '💰';
    if (name.includes('calendar') || name.includes('schedule') || name.includes('timeline')) return '📅';
    if (name.includes('note') || name.includes('memo') || name.includes('reminder')) return '📝';
    if (name.includes('chat') || name.includes('conversation') || name.includes('discussion')) return '💬';
    if (name.includes('alert') || name.includes('warning') || name.includes('notification')) return '🚨';
    if (name.includes('star') || name.includes('favorite') || name.includes('bookmark')) return '⭐';
    if (name.includes('cart') || name.includes('basket') || name.includes('shopping')) return '🛒';
    if (name.includes('delivery') || name.includes('shipping') || name.includes('logistics')) return '📦';
    
    // Default fallback
    return '🗃️';
  };

  const newItem: any = {
    id: model.name,
    title: getTitle(model.name),
    name: model.name,
    emoji: generateModelEmoji(model.name), // Add AI-generated emoji based on model name
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

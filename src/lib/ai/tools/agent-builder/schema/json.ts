import { SchemaObject, Model, Enums, Field } from '@paljs/types'
import { PrismaReader } from './PrismaReader'

export class ConvertSchemaToObject extends PrismaReader {
  schemaObject: SchemaObject = {
    models: [],
    enums: [],
  }

  constructor(protected schema: string) {
    super(schema)
  }

  run() {
    this.getModels()
    this.getEnums()
    return this.schemaObject
  }

  private getModels() {
    if (this.models) {
      for (const model of this.models) {
        const lines = this.blockLines(model)
        const modelObject: Model = {
          name: this.getClassName(lines),
          fields: [],
        }
        let documentation = ''
        for (let i = 1; i + 1 < lines.length; i++) {
          const line = this.lineArray(lines[i])
          if (line[0].includes('//')) {
            documentation = documentation ? documentation + '\n' + line.join(' ') : line.join(' ')
          } else if (line[0].includes('@@')) {
            modelObject.map = this.getMap(lines[i])
          } else {
            const type = this.getType(line)
            const field: Field = {
              name: line[0],
              type,
              isId: line.includes('@id'),
              unique: line.includes('@unique'),
              list: line[1].includes('[]'),
              required: !line[1].includes('[]') && !line[1].includes('?'),
              kind: this.getKind(type),
              documentation,
              map: this.getMap(lines[i]),
            }

            if (field.kind === 'object') {
              field.relation = this.getRelation(lines[i])
            }
            modelObject.fields.push(field)
            documentation = ''
          }
        }
        if (!modelObject.fields.find((field) => field.name === 'createdAt')) {
          modelObject.fields.push(
            {
              name: 'createdAt',
              type: 'DateTime',
              isId: false,
              unique: false,
              list: false,
              required: false,
              kind: 'scalar',
              relationField: false,
            }
          )
        }
        if (!modelObject.fields.find((field) => field.name === 'updatedAt')) {
          modelObject.fields.push(
            {
              name: 'updatedAt',
              type: 'DateTime',
              isId: false,
              unique: false,
              list: false,
              required: false,
              kind: 'scalar',
              relationField: false,
            }
          )
        }
        if (!modelObject.fields.find((field) => field.name === 'deletedAt')) {
          modelObject.fields.push(
            {
              name: 'deletedAt',
              type: 'DateTime',
              isId: false,
              unique: false,
              list: false,
              required: false,
              kind: 'scalar',
              relationField: false,
            }
          )
        }
        if (!modelObject.fields.find((field) => field.name === 'deleted')) {
          modelObject.fields.push(
            {
              name: 'deleted',
              type: 'Boolean',
              isId: false,
              unique: false,
              list: false,
              required: false,
              kind: 'scalar',
              relationField: false,
            }
          )
        }
        modelObject.documentation = documentation
        modelObject.fields
          .filter((item) => item.kind !== 'object')
          .forEach((item) => {
            let relationField = false
            modelObject.fields
              .filter((field) => field.kind === 'object')
              .forEach((field) => {
                if (!relationField) {
                  relationField = !!field.relation?.fields?.includes(item.name)
                }
              })
            item.relationField = relationField
          })
        this.schemaObject.models.push({ ...modelObject })
      }
    }
  }

  private getEnums() {
    if (this.enums) {
      for (const item of this.enums) {
        const lines = this.blockLines(item)
        const itemObject: Enums = {
          name: this.getClassName(lines),
          fields: [],
        }
        for (let i = 1; i + 1 < lines.length; i++) {
          const line = this.lineArray(lines[i])
          !line[0].includes('//') && itemObject.fields.push(line[0])
        }
        this.schemaObject.enums.push({ ...itemObject })
      }
    }
  }
}

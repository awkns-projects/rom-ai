import { Field } from '@paljs/types'


export class PrismaReader {
  protected data: string

  constructor(protected schema: string) {
    // this.checkIfSchemaExit();
    this.data = schema
  }

  protected get models() {
    // Updated regex to handle models that might appear at the beginning of the schema
    return this.data.match(/(^|\n)(model\s[\s\S]*?})/g)
  }

  protected get enums() {
    // Updated regex to handle enums that might appear at the beginning of the schema
    return this.data.match(/(^|\n)(enum\s[\s\S]*?})/g)
  }

  protected blockLines(block: string) {
    // Remove the leading newline if it exists from the regex capture group
    const cleanBlock = block.replace(/^(\n)/, '');
    return cleanBlock.split(/\n/).filter((v) => v)
  }

  // protected checkIfSchemaExit() {
  //   if (!existsSync(this.path)) {
  //     log.error(
  //       `Error: ${chalk.blue('schema.prisma')} file not found in ${chalk.blue(
  //         this.path,
  //       )}`,
  //     );
  //     process.exit();
  //   }
  // }

  protected getType(line: string[]) {
    return line[1].replace('?', '').replace('[]', '')
  }

  protected getKind(type: string) {
    return this.data.includes(`enum ${type} `) ? 'enum' : this.data.includes(`model ${type} `) ? 'object' : 'scalar'
  }

  protected getClassName(lines: string[]) {
    if (!lines || lines.length === 0) {
      console.warn('⚠️ No lines provided to getClassName');
      return 'UnknownModel';
    }
    
    const lineArray = this.lineArray(lines[0]);
    if (lineArray.length < 2) {
      console.warn('⚠️ First line does not contain model name:', lines[0]);
      // Try to extract from the line directly
      const match = lines[0].match(/(?:model|enum)\s+(\w+)/);
      if (match) {
        return match[1];
      }
      return 'UnknownModel';
    }
    
    return lineArray[1];
  }

  protected lineArray(line: string) {
    return line
      .replace(/[\n\r]/g, '')
      .split(' ')
      .filter((v) => v)
  }

  protected getMap(line: string) {
    const value = line.match(/@map\((.*?)\)/)
    if (value) {
      return value[1].replace(/name/, '').replace(':', '').replace(' ', '').replace(/"/g, '')
    }
    return undefined
  }

  protected getRelation(line: string) {
    const relationString = line.match(/@relation\((.*?)\)/)
    if (relationString) {
      const relation: Field['relation'] = {}
      const name = relationString[1].match(/"(\w+)"/)
      if (name) {
        relation.name = name[1]
      }
      ;['fields', 'references'].forEach((item) => {
        const pattern = new RegExp(`${item}:[\\s\\S]\\[(.*?)\\]`)
        const values = relationString[1].match(pattern)
        if (values) {
          const asArray = values[1]
            .replace(/ /g, '')
            .split(',')
            .filter((v) => v)
          if (asArray.length > 0) {
            relation[item as 'fields' | 'references'] = asArray
          }
        }
      })
      return relation
    }
    return undefined
  }
}

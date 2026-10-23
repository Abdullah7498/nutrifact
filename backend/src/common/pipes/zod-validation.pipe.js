import { BadRequestException } from '@nestjs/common';

export class ZodValidationPipe {
  constructor(schema) {
    this.schema = schema;
  }

  transform(value) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }
}

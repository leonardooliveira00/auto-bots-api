import { ClassSerializerInterceptor, PlainLiteralObject } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client'; // Ajuste o caminho do seu client

export class CustomSerializerInterceptor extends ClassSerializerInterceptor {
  serialize(
    response: PlainLiteralObject | PlainLiteralObject[],
    options: any,
  ): any {
    const cleanedResponse = this.transformDecimals(response);
    return super.serialize(cleanedResponse, options);
  }

  private transformDecimals(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Prisma.Decimal) {
      return data.toNumber();
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformDecimals(item));
    }

    if (typeof data === 'object') {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          data[key] = this.transformDecimals(data[key]);
        }
      }
      return data;
    }

    return data;
  }
}

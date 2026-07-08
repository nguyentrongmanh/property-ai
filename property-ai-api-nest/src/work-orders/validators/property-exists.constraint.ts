import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PropertiesRepository } from '../../properties/properties.repository';

@ValidatorConstraint({ name: 'PropertyExists', async: true })
@Injectable()
export class PropertyExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly properties: PropertiesRepository) {}

  async validate(propertyId: unknown): Promise<boolean> {
    if (typeof propertyId !== 'string' || propertyId === '') {
      return false;
    }

    return this.properties.exists(propertyId);
  }

  defaultMessage(): string {
    return 'The given building does not exist.';
  }
}

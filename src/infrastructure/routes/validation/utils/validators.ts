import { Recherche } from '../../../../domain/recherche'
import { GetOffresImmersionQueryParams } from '../offres-immersion.inputs'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions
} from 'class-validator'

export function isCriteresValid(
  property: string,
  validationOptions?: ValidationOptions
) {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/ban-types,@typescript-eslint/explicit-module-boundary-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCriteresValid',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(criteres: unknown, args: ValidationArguments) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const type: Recherche.Type = args.constraints
          const typeOffre = (args.object as never)[type]
          return (
            (typeOffre === Recherche.Type.OFFRES_IMMERSION &&
              criteres instanceof GetOffresImmersionQueryParams) ||
            typeOffre === Recherche.Type.OFFRES_ALTERNANCE ||
            typeOffre === Recherche.Type.OFFRES_EMPLOI
          )
        }
      }
    })
  }
}

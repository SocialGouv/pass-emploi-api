import {
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'

@ValidatorConstraint({ name: 'customOffresEmploiCriteres', async: false })
export class CustomOffresEmploiCriteres
  implements ValidatorConstraintInterface
{
  validate(criteres: { [key: string]: unknown }): boolean {
    const offresEmploiCriteresKeys = [
      'q',
      'departement',
      'alternance',
      'experience',
      'contrat',
      'duree',
      'commune',
      'rayon'
    ]
    return criteres
      ? Object.keys(criteres).every(key =>
          offresEmploiCriteresKeys.includes(key)
        )
      : true
  }
}

@ValidatorConstraint({ name: 'customOffresImmersionCriteres', async: false })
export class CustomOffresImmersionCriteres
  implements ValidatorConstraintInterface
{
  validate(criteres: { [key: string]: unknown }): boolean {
    const offresImmersionCriteresKeys = ['rome', 'lat', 'lon', 'distance']
    return criteres
      ? Object.keys(criteres).every(key =>
          offresImmersionCriteresKeys.includes(key)
        )
      : false
  }
}

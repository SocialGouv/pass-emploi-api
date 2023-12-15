import { ConfigService } from '@nestjs/config'
import { Op } from 'sequelize'
import { RendezVous } from '../domain/rendez-vous/rendez-vous'

export function generateSourceRendezVousCondition(
  configuration: ConfigService
): {
  source: {
    [Op.in]: RendezVous.Source[]
  }
} {
  const sourceCondition = {
    source: {
      [Op.in]: [RendezVous.Source.PASS_EMPLOI]
    }
  }
  if (configuration.get('features.rendezVousMilo') === true) {
    sourceCondition.source = {
      [Op.in]: [RendezVous.Source.PASS_EMPLOI, RendezVous.Source.MILO]
    }
  }
  return sourceCondition
}

export function sessionsMiloActives(configuration: ConfigService): boolean {
  return configuration.get('features.recupererSessionsMilo') ?? false
}

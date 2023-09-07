import { ConfigService } from '@nestjs/config'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'

// TODO(5 septembre 2023): supprimer ce fichier quand les sessions seront déployées à tout le monde
export function sessionsMiloSontActiveesPourLeJeune(
  configuration: ConfigService,
  jeuneSqlModel: JeuneSqlModel
): boolean {
  return sessionsMiloSontActivees(configuration, jeuneSqlModel.idStructureMilo)
}

export function sessionsMiloSontActiveesPourLeConseiller(
  configuration: ConfigService,
  conseillerMilo: ConseillerMilo
): boolean {
  return sessionsMiloSontActivees(configuration, conseillerMilo.structure.id)
}

export function estUnEarlyAdopter(
  configuration: ConfigService,
  idStructure: string | null | undefined
): boolean {
  const FT_IDS_STRUCTURES_EARLY_ADOPTERS: string[] =
    configuration.get('features.idsStructuresEarlyAdoptersSession') ?? []

  return idStructure
    ? FT_IDS_STRUCTURES_EARLY_ADOPTERS.includes(idStructure)
    : false
}

function sessionsMiloSontActivees(
  configuration: ConfigService,
  idStructure: string | null | undefined
): boolean {
  const FT_RECUPERER_SESSIONS_MILO = configuration.get(
    'features.recupererSessionsMilo'
  )

  return (
    FT_RECUPERER_SESSIONS_MILO || estUnEarlyAdopter(configuration, idStructure)
  )
}

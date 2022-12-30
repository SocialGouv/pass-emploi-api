import { SituationsMiloDto } from '../sequelize/models/situations-milo.sql-model'
import { AsSql } from '../sequelize/types'
import { MiloJeune } from '../../domain/partenaire/milo/milo.jeune'

export const uneSituationsMiloJdd = (
  args: Partial<SituationsMiloDto> = {}
): Omit<AsSql<SituationsMiloDto>, 'id'> => {
  const defaults = {
    idJeune: 'ABCDE',
    situationCourante: {
      etat: MiloJeune.EtatSituation.EN_COURS,
      categorie: MiloJeune.CategorieSituation.CONTRAT_DE_VOLONTARIAT_BENEVOLAT
    },
    situations: [
      {
        etat: MiloJeune.EtatSituation.PREVU,
        categorie:
          MiloJeune.CategorieSituation.CONTRAT_DE_VOLONTARIAT_BENEVOLAT,
        dateFin: ''
      }
    ]
  }
  return { ...defaults, ...args }
}

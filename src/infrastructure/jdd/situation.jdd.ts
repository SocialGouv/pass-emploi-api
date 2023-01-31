import { SituationsMiloDto } from '../sequelize/models/situations-milo.sql-model'
import { AsSql } from '../sequelize/types'
import { JeuneMilo } from '../../domain/jeune/jeune.milo'

export const uneSituationsMiloJdd = (
  args: Partial<SituationsMiloDto> = {}
): Omit<AsSql<SituationsMiloDto>, 'id'> => {
  const defaults = {
    idJeune: 'ABCDE',
    situationCourante: {
      etat: JeuneMilo.EtatSituation.EN_COURS,
      categorie: JeuneMilo.CategorieSituation.CONTRAT_DE_VOLONTARIAT_BENEVOLAT
    },
    situations: [
      {
        etat: JeuneMilo.EtatSituation.PREVU,
        categorie:
          JeuneMilo.CategorieSituation.CONTRAT_DE_VOLONTARIAT_BENEVOLAT,
        dateFin: ''
      }
    ]
  }
  return { ...defaults, ...args }
}

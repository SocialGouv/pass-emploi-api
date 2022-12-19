import { SituationsMiloDto } from '../sequelize/models/situations-milo.sql-model'
import { AsSql } from '../sequelize/types'
import { CategorieSituationMilo, EtatSituationMilo } from '../../domain/milo'

export const uneSituationsMiloJdd = (
  args: Partial<SituationsMiloDto> = {}
): Omit<AsSql<SituationsMiloDto>, 'id'> => {
  const defaults = {
    idJeune: 'ABCDE',
    situationCourante: {
      etat: EtatSituationMilo.EN_COURS,
      categorie: CategorieSituationMilo.CONTRAT_DE_VOLONTARIAT_BENEVOLAT
    },
    situations: [
      {
        etat: EtatSituationMilo.PREVU,
        categorie: CategorieSituationMilo.CONTRAT_DE_VOLONTARIAT_BENEVOLAT,
        dateFin: ''
      }
    ]
  }
  return { ...defaults, ...args }
}

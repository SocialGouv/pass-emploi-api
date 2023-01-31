import { SituationsMiloDto } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { JeuneMilo } from '../../src/domain/jeune/jeune.milo'

export const unDossierMilo = (
  args: Partial<JeuneMilo.Dossier> = {}
): JeuneMilo.Dossier => {
  const defaults = {
    id: '1',
    nom: 'Dawson',
    prenom: 'Jack',
    dateDeNaissance: '1888-09-01',
    codePostal: '91580',
    email: 'jack.dawson@milo.com',
    situations: []
  }
  return { ...defaults, ...args }
}

export const uneSituationsMilo = (
  args: Partial<JeuneMilo.Situations> = {}
): JeuneMilo.Situations => {
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

export const uneSituationsMiloDto = (
  args: Partial<SituationsMiloDto> = {}
): AsSql<SituationsMiloDto> => {
  const defaults = {
    id: 1,
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

import { SituationsMiloDto } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import {
  CategorieSituationMilo,
  EtatSituationMilo,
  Milo
} from '../../src/domain/milo'

export const unDossierMilo = (
  args: Partial<Milo.Dossier> = {}
): Milo.Dossier => {
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
  args: Partial<Milo.SituationsDuJeune> = {}
): Milo.SituationsDuJeune => {
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

export const uneSituationsMiloDto = (
  args: Partial<SituationsMiloDto> = {}
): AsSql<SituationsMiloDto> => {
  const defaults = {
    id: 1,
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

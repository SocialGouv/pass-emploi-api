import { SituationsMiloDto } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { MiloJeune } from '../../src/domain/partenaire/milo/milo.jeune'

export const unDossierMilo = (
  args: Partial<MiloJeune.Dossier> = {}
): MiloJeune.Dossier => {
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
  args: Partial<MiloJeune.Situations> = {}
): MiloJeune.Situations => {
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

export const uneSituationsMiloDto = (
  args: Partial<SituationsMiloDto> = {}
): AsSql<SituationsMiloDto> => {
  const defaults = {
    id: 1,
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

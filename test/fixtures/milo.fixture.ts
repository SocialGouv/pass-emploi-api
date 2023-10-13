import { SituationsMiloDto } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { JeuneMilo } from '../../src/domain/milo/jeune.milo'
import { EvenementMiloDto } from 'src/infrastructure/repositories/dto/milo.dto'
import { RendezVousMilo } from '../../src/domain/milo/rendez-vous.milo'
import { EvenementMilo } from '../../src/domain/milo/evenement.milo'
import { InstanceSessionMilo } from '../../src/domain/milo/session.milo'

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
    situations: [],
    codeStructure: '9222000'
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

export const unEvenementMilo = (
  args: Partial<EvenementMilo> = {}
): EvenementMilo => {
  const defaults = {
    id: '63569521bdd5161673153f9f',
    idPartenaireBeneficiaire: '1234567',
    type: EvenementMilo.TypeEvenement.CREATE,
    objet: EvenementMilo.ObjetEvenement.RENDEZ_VOUS,
    idObjet: '34',
    date: '2022-10-24T08:00:34Z'
  }
  return {
    ...defaults,
    ...args
  }
}

export const unEvenementMiloDto = (
  args: Partial<EvenementMiloDto> = {}
): EvenementMiloDto => {
  const defaults: EvenementMiloDto = {
    identifiant: '63569521bdd5161673153f9f',
    idDossier: 1234567,
    type: 'RDV',
    action: 'CREATE',
    idType: 34,
    date: '2022-10-24T08:00:34Z'
  }
  return { ...defaults, ...args }
}

export const unRendezVousMilo = (
  args: Partial<RendezVousMilo> = {}
): RendezVousMilo => {
  const defaults: RendezVousMilo = {
    id: '34',
    dateHeureDebut: '2020-10-06 10:00:00',
    dateHeureFin: '2020-10-06 12:00:00',
    titre: 'Test RDV',
    idPartenaireBeneficiaire: '5045180',
    commentaire: '',
    statut: 'Planifié'
  }
  return { ...defaults, ...args }
}

export const uneInstanceSessionMilo = (
  args: Partial<InstanceSessionMilo> = {}
): InstanceSessionMilo => {
  const defaults: InstanceSessionMilo = {
    id: '34',
    dateHeureDebut: '2020-10-06 10:00:00',
    idSession: '12345',
    idDossier: '5045180',
    statut: 'Prescrit'
  }
  return { ...defaults, ...args }
}

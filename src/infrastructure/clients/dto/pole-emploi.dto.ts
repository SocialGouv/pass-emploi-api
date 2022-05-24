import { Demarche } from '../../../domain/demarche'

export interface PrestationDto {
  annule?: boolean
  datefin?: string
  identifiantStable?: string
  session: {
    dateDebut: string
    dateFinPrevue?: string
    dateLimite?: string
    enAgence?: boolean
    infoCollective?: boolean
    natureAnimation?: 'INTERNE' | 'EXTERNE' | 'CO_ANIMEE'
    realiteVirtuelle?: boolean
    modalitePremierRendezVous?: 'WEBCAM' | 'PHYSIQUE'
    adresse?: {
      adresseLigne1?: string
      adresseLigne2?: string
      adresseLigne3?: string
      codeInsee?: string
      codePostal?: string
      telephone?: string
      typeLieu?: 'INTERNE' | 'EXTERNE' | 'AUTRE'
      ville?: string
      villePostale?: string
      coordonneesGPS?: {
        latitude?: number
        longitude?: number
      }
      identifiantAurore?: string
    }
    duree: {
      unite: 'JOUR' | 'HEURE'
      valeur: number
    }
    typePrestation?: {
      code?: string
      libelle?: string
      accroche?: string
      actif?: boolean
      descriptifTypePrestation?: string
    }
    themeAtelier?: {
      libelle?: string
      descriptif?: string
      accroche?: string
      code?: string
      codeTypePrestation?: string
    }
    sousThemeAtelier?: {
      codeSousThemeAtelier?: string
      libelleSousThemeAtelier?: string
      descriptifSousThemeAtelier?: string
    }
    dureeReunionInformationCollective?: {
      unite?: string
      valeur?: number
    }
    reunionInfoCommentaire?: string
    commentaire?: string
  }
}

export interface RendezVousPoleEmploiDto {
  theme?: string
  date: string
  heure: string
  duree: number
  modaliteContact?: 'VISIO' | 'TELEPHONIQUE' | 'TELEPHONE' | 'AGENCE'
  nomConseiller?: string
  prenomConseiller?: string
  agence?: string
  adresse?: {
    bureauDistributeur?: string
    ligne4?: string
    ligne5?: string
    ligne6?: string
  }
  commentaire?: string
  typeRDV?: 'RDVL' | 'CONVOCATION'
  lienVisio?: string
}

export interface DemarcheDto {
  idDemarche: string
  etat: DemarcheDtoEtat
  dateDebut?: string
  dateFin: string
  dateAnnulation?: string
  dateCreation: string
  dateModification?: string
  origineCreateur: 'INDIVIDU' | 'CONSEILLER' | 'PARTENAIRE' | 'ENTREPRISE'
  origineModificateur?: 'INDIVIDU' | 'CONSEILLER' | 'PARTENAIRE' | 'ENTREPRISE'
  origineDemarche:
    | 'ACTION'
    | 'ACTUALISATION'
    | 'CANDIDATURE'
    | 'JRE_CONSEILLER'
    | 'JRE_DE'
    | 'CV'
    | 'LM'
    | 'PUBLICATION_PROFIL'
    | 'ENTRETIEN'
    | 'RECHERCHE_ENREGISTREE'
    | 'SUGGESTION'
    | 'PASS_EMPLOI'
  pourquoi: string
  libellePourquoi: string
  quoi: string
  libelleQuoi: string
  comment?: string
  libelleComment?: string
  libelleLong?: string
  libelleCourt?: string
  ou?: string
  description?: string
  organisme?: string
  metier?: string
  nombre?: number
  contact?: string
  droitsDemarche?: {
    annulation?: boolean
    realisation?: boolean
    replanification?: boolean
    modificationDate?: boolean
  }
}

export enum DemarcheDtoEtat {
  AC = 'AC',
  RE = 'RE',
  AN = 'AN',
  EC = 'EC',
  AF = 'AF'
}

export function toEtat(statut: Demarche.Statut): DemarcheDtoEtat {
  switch (statut) {
    case Demarche.Statut.ANNULEE:
      return DemarcheDtoEtat.AN
    case Demarche.Statut.REALISEE:
      return DemarcheDtoEtat.RE
    case Demarche.Statut.EN_COURS:
    case Demarche.Statut.A_FAIRE:
      return DemarcheDtoEtat.AC
  }
}

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
  pourQuoi: string
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
  description2?: string
  droitsDemarche?: {
    annulation?: boolean
    realisation?: boolean
    replanification?: boolean
    modificationDate?: boolean
  }
  type?: string
}

export interface SuggestionDto {
  appellation?: {
    libelle: string
    code: string
  }
  contrats?: Array<{
    critereOre?: boolean
    priorite: number
    type: {
      code: string
      libelle: string
      libelleLong: string
    }
  }>
  dureeExperience?: {
    valeur: number
    unite: {
      code: string
      libelle: string
    }
  }
  dureesHebdo?: Array<{
    critereOre?: boolean
    tempsTravail: {
      code: string
      libelle: string
      max?: number
      min?: number
    }
  }>
  mobiliteHabitation?: {
    valeur: number
    unite: {
      code: string
    }
  }
  mobilites?: Array<{
    rayon?: number
    lieu: {
      code: string
      codeDepartement?: string
      codePostal?: string
      libelle: string
      type: {
        code: string
        libelle: string
      }
    }
    unite?: {
      code: string
      libelle: string
    }
  }>
  rome?: {
    libelle: string
    code: string
  }
  salaire?: {
    remuneration: number
    libelle: string
    code: string
  }
  typologieEmploi: {
    libelle: string
    code: string
  }
  typeCrefFranchise?: boolean
  typeCrefReprise?: boolean
  typeCrefCreation?: boolean
}

export enum DemarcheDtoEtat {
  AC = 'AC',
  RE = 'RE',
  AN = 'AN',
  EC = 'EC',
  AF = 'AF'
}

export interface ListeTypeDemarchesDto {
  listeDemarches?: TypeDemarcheDto[]
}

export interface DemarcheIADto {
  description: string
  codePourquoi: string
  codeQuoi: string
}
export interface TypeDemarcheDto {
  codeQuoiTypeDemarche: string
  libelleQuoiTypeDemarche: string
  codePourQuoiObjectifDemarche: string
  libellePourQuoiObjectifDemarche: string
  codeCommentDemarche?: string
  libelleCommentDemarche?: string
  estUneAction: boolean
}

export interface ThematiqueDto {
  code: string
  libelle: string
  typesDemarcheRetourEmploi: CatalogueDemarcheDto[]
}

interface CatalogueDemarcheDto {
  code: string
  libelle: string
  moyensRetourEmploi: CommentDto[]
}

interface CommentDto {
  type: string
  code: string
  libelle: string
  droitCreation: boolean
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

export interface DocumentPoleEmploiDto {
  titre: string
  nomFichier: string
  format: string
  url: string
  type: {
    libelle: string
    code: string
  }
}

export enum NonTraitableReason {
  TYPE_UTILISATEUR_NON_TRAITABLE = 'TYPE_UTILISATEUR_NON_TRAITABLE',
  STRUCTURE_UTILISATEUR_NON_TRAITABLE = 'STRUCTURE_UTILISATEUR_NON_TRAITABLE',
  EMAIL_BENEFICIAIRE_INTROUVABLE = 'EMAIL_BENEFICIAIRE_INTROUVABLE',
  UTILISATEUR_INEXISTANT = 'UTILISATEUR_INEXISTANT',
  UTILISATEUR_DEJA_MILO = 'UTILISATEUR_DEJA_MILO',
  UTILISATEUR_DEJA_PE = 'UTILISATEUR_DEJA_PE',
  UTILISATEUR_DEJA_PE_BRSA = 'UTILISATEUR_DEJA_PE_BRSA',
  UTILISATEUR_DEJA_PE_AIJ = 'UTILISATEUR_DEJA_PE_AIJ',
  UTILISATEUR_DEJA_CONSEIL_DEPT = 'UTILISATEUR_DEJA_CONSEIL_DEPT',
  UTILISATEUR_DEJA_AVENIR_PRO = 'UTILISATEUR_DEJA_AVENIR_PRO',
  UTILISATEUR_DEJA_ACCOMPAGNEMENT_INTENSIF = 'UTILISATEUR_DEJA_ACCOMPAGNEMENT_INTENSIF',
  UTILISATEUR_DEJA_ACCOMPAGNEMENT_GLOBAL = 'UTILISATEUR_DEJA_ACCOMPAGNEMENT_GLOBAL',
  UTILISATEUR_DEJA_EQUIP_EMPLOI_RECRUT = 'UTILISATEUR_DEJA_EQUIP_EMPLOI_RECRUT',
  BENEFICIAIRE_SANS_CONSEILLER = 'BENEFICIAIRE_SANS_CONSEILLER'
}
export interface DomainError {
  readonly code: string
  readonly message: string
}

export class NonTrouveError implements DomainError {
  static CODE = 'NON_TROUVE'
  readonly code: string = NonTrouveError.CODE
  readonly message: string

  constructor(entityType: string, critereRecherche = '') {
    this.message = `${entityType} ${critereRecherche} non trouvé(e)`
  }
}

export class ConseillerMiloSansStructure implements DomainError {
  static CODE = 'CONSEILLER_MILO_SANS_STRUCTURE'
  readonly code: string = ConseillerMiloSansStructure.CODE
  readonly message: string

  constructor(critereRecherche = '') {
    this.message = `Conseiller Milo ${critereRecherche} sans structure`
  }
}
export class JeuneMiloSansStructure implements DomainError {
  static CODE = 'JEUNE_MILO_SANS_STRUCTURE'
  readonly code: string = JeuneMiloSansStructure.CODE
  readonly message: string

  constructor(critereRecherche = '') {
    this.message = `Jeune Milo ${critereRecherche} sans structure`
  }
}

export class CampagneNonActive implements DomainError {
  static CODE = 'CAMPAGNE_NON_ACTIVE'
  readonly code: string = CampagneNonActive.CODE
  readonly message: string

  constructor(nom: string) {
    this.message = `La campagne ${nom} n'est pas en cours`
  }
}

export class ReponsesCampagneInvalide implements DomainError {
  static CODE = 'REPONSES_CAMPAGNE_INVALIDE'
  readonly code: string = ReponsesCampagneInvalide.CODE
  readonly message: string

  constructor() {
    this.message = `Il faut répondre au mois à la première question`
  }
}

export class NonTraitableError implements DomainError {
  static CODE = 'NON_TRAITABLE'
  readonly code: string
  readonly message: string
  readonly reason?: NonTraitableReason
  readonly email?: string

  constructor(
    entityType: string,
    id: string,
    reason?: NonTraitableReason,
    email?: string
  ) {
    this.code = NonTraitableError.CODE
    this.message = `${entityType} ${id} non traitable`
    this.reason = reason
    this.email = email
  }
}

export class MauvaiseCommandeError implements DomainError {
  static CODE = 'MAUVAISE_COMMANDE'
  readonly code: string = MauvaiseCommandeError.CODE
  readonly message: string

  constructor(message: string) {
    this.message = message
  }
}

export class RessourceIndisponibleError implements DomainError {
  static CODE = 'RESSOURCE_INDISPONIBLE'
  readonly code: string = RessourceIndisponibleError.CODE
  readonly message: string

  constructor(message: string) {
    this.message = message
  }
}

export class FavoriExisteDejaError implements DomainError {
  static CODE = 'EXISTE_DEJA'
  readonly code: string = FavoriExisteDejaError.CODE
  readonly message: string

  constructor(idJeune: string, idOffre: string) {
    this.message = `L'offre ${idOffre} est déjà dans les favoris de ${idJeune}`
  }
}

export class JeuneNonLieAuConseillerError implements DomainError {
  static CODE = 'JEUNE_NON_LIE_AU_CONSEILLE'
  readonly code: string = JeuneNonLieAuConseillerError.CODE
  readonly message: string

  constructor(idConseiller: string, idJeune: string) {
    this.message = `Le conseiller ${idConseiller} n'est pas lié au jeune ${idJeune}`
  }
}

export class JeuneMiloSansIdDossier implements DomainError {
  static CODE = 'JEUNE_MILO_SANS_ID_DOSSIER'
  readonly code: string = JeuneMiloSansIdDossier.CODE
  readonly message: string

  constructor(idJeune: string) {
    this.message = `Le jeune ${idJeune} n'a pas d'ID dossier`
  }
}

export class CompteDiagorienteInvalideError implements DomainError {
  static CODE = 'COMPTE_DIAGORIENTE_INVALIDE'
  readonly code: string = CompteDiagorienteInvalideError.CODE
  readonly message: string

  constructor(idJeune: string) {
    this.message = `Le compte du jeune ${idJeune} n'a pas pu être créé sur Diagoriente`
  }
}

export class JeuneNonLieALAgenceError implements DomainError {
  static CODE = 'JEUNE_NON_LIE_A_L_AGENCE'
  readonly code: string = JeuneNonLieALAgenceError.CODE
  readonly message: string

  constructor(idJeune: string, idAgence: string) {
    this.message = `Le jeune ${idJeune} n'est pas lié à l'agence ${idAgence}`
  }
}

export class ConseillerSansAgenceError implements DomainError {
  static CODE = 'CONSEILLER_SANS_AGENCE'
  readonly code: string = ConseillerSansAgenceError.CODE
  readonly message: string

  constructor(idConseiller: string) {
    this.message = `Le conseiller ${idConseiller} n'a pas renseigné son agence`
  }
}

export class JeunePasInactifError implements DomainError {
  static CODE = 'JEUNE_PAS_INACTIF'
  readonly code: string = JeunePasInactifError.CODE
  readonly message: string

  constructor(idJeune: string) {
    this.message = `Le jeune ${idJeune} a activé son compte`
  }
}

export class EmailExisteDejaError implements DomainError {
  static CODE = 'EMAIL_EXISTE_DEJA'
  readonly code: string = EmailExisteDejaError.CODE
  readonly message: string

  constructor(email: string) {
    this.message = `Un compte avec l'email ${email} existe déjà`
  }
}

export class DossierExisteDejaError implements DomainError {
  static CODE = 'DOSSIER_EXISTE_DEJA'
  readonly code: string = DossierExisteDejaError.CODE
  readonly message: string

  constructor(idDossier: string) {
    this.message = `Un compte avec l'id dossier ${idDossier} existe déjà`
  }
}

export class ConseillerNonValide implements DomainError {
  static CODE = 'CONSEILLER_NON_VALIDE'
  readonly code: string = ConseillerNonValide.CODE
  readonly message: string

  constructor() {
    this.message =
      'Il faut renseigner un nom et un prénom pour créer un conseiller'
  }
}

export class ConseillerInactifError implements DomainError {
  static CODE = 'CONSEILLER_INACTIF'
  readonly code: string = ConseillerInactifError.CODE
  readonly message: string

  constructor() {
    this.message = 'Le conseiller est inactif depuis trop longtemps'
  }
}

export class DroitsInsuffisants implements DomainError {
  static CODE = 'DROITS_INSUFFISANTS'
  readonly code: string = DroitsInsuffisants.CODE
  readonly message: string = "Vous n'avez pas le droit d'effectuer cette action"

  constructor(message?: string) {
    if (message) this.message = message
  }
}

export class ErreurHttp implements DomainError {
  static CODE = 'ERREUR_HTTP'
  readonly code: string = ErreurHttp.CODE
  readonly statusCode: number
  readonly message: string

  constructor(message: string, statusCode: number) {
    this.message = message
    this.statusCode = statusCode
  }
}

export class CampagneExisteDejaError implements DomainError {
  static CODE = 'CAMPAGNE_EXISTE_DEJA'
  readonly code: string = CampagneExisteDejaError.CODE
  readonly message: string

  constructor() {
    this.message = `Une campagne sur ces dates ou avec le même nom existe déjà`
  }
}

export class PasDeRappelError implements DomainError {
  static CODE = 'PAS_DE_RAPPEL'
  readonly code: string = PasDeRappelError.CODE
  readonly message: string

  constructor(idAction: string, raison: string) {
    this.message = `Pas de rappel à envoyer pour l'action ${idAction} car ${raison}`
  }
}

export class DateNonAutoriseeError implements DomainError {
  static CODE = 'DATE_NON_AUTORISEE'
  readonly code: string = DateNonAutoriseeError.CODE
  readonly message: string

  constructor() {
    this.message = `La date renseignée n’est pas valide.`
  }
}

export class NombrePlacesInsuffisantError implements DomainError {
  static CODE = 'NOMBRE_PLACE_INSUFFISANT'
  readonly code: string = NombrePlacesInsuffisantError.CODE
  readonly message: string

  constructor() {
    this.message = 'La session n’a pas suffisamment de places disponibles'
  }
}

export class BeneficiaireDejaInscritError implements DomainError {
  static CODE = 'BENEFICIAIRE_DEJA_INSCRIT'
  readonly code: string = BeneficiaireDejaInscritError.CODE
  readonly message: string

  constructor() {
    this.message = 'Le bénéficiaire est déjà inscrit'
  }
}

export class EmargementIncorrect implements DomainError {
  static CODE = 'EMARGEMENT_INCORRECT'
  readonly code: string = EmargementIncorrect.CODE
  readonly message: string

  constructor() {
    this.message =
      'Tous les jeunes inscrits, et uniquement eux, doivent être émargés'
  }
}

export class AnalyseAntivirusEchouee implements DomainError {
  static CODE = 'ANALYSE_ANTIVIRUS_ECHOUEE'
  readonly code: string = AnalyseAntivirusEchouee.CODE
  readonly message: string

  constructor(message: string) {
    this.message = "L'analyse du fichier par l’antivirus a échoué : " + message
  }
}

export class AnalyseAntivirusPasTerminee implements DomainError {
  static CODE = 'ANALYSE_ANTIVIRUS_EN_COURS'
  readonly code: string = AnalyseAntivirusPasTerminee.CODE
  readonly message: string

  constructor() {
    this.message = "L'analyse du fichier par l’antivirus n’est pas terminée"
  }
}

export class FichierMalveillant implements DomainError {
  static CODE = 'FICHIER_MALVEILLANT'
  readonly code: string = FichierMalveillant.CODE
  readonly message: string

  constructor() {
    this.message = 'Le fichier analysé est malveillant'
  }
}

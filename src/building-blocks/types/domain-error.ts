export interface DomainError {
  readonly code: string
  readonly message: string
}

export class NonTrouveError implements DomainError {
  static CODE = 'NON_TROUVE'
  readonly code: string = NonTrouveError.CODE
  readonly message: string

  constructor(entityType: string, id: string) {
    this.message = `${entityType} ${id} non trouvé(e)`
  }
}

export class FavoriNonTrouveError implements DomainError {
  static CODE = 'FAVORI_NON_TROUVE'
  readonly code: string = FavoriNonTrouveError.CODE
  readonly message: string

  constructor(idJeune: string, idOffre: string) {
    this.message = `Le Favori du jeune ${idJeune} correspondant à l'offre ${idOffre} n'existe pas`
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

export class UtilisateurMiloNonValide implements DomainError {
  static CODE = 'UTILISATEUR_MILO_NON_VALIDE'
  readonly code: string = UtilisateurMiloNonValide.CODE
  readonly message: string

  constructor() {
    this.message =
      'Il faut renseigner un nom, prenom et email pour créer un utilisateur Milo'
  }
}

export class RechercheOffreInvalide implements DomainError {
  static CODE = 'RECHERCHE_OFFRE_INVALIDE'
  readonly code: string = RechercheOffreInvalide.CODE
  readonly message: string

  constructor(message: string) {
    this.message = message
  }
}

export class RechercheDetailOffreInvalide implements DomainError {
  static CODE = 'RECHERCHE_DETAIL_OFFRE_INVALIDE'
  readonly code: string = RechercheDetailOffreInvalide.CODE
  readonly message: string

  constructor(message: string) {
    this.message = message
  }
}

export class ErreurHttpMilo implements DomainError {
  static CODE = 'ERREUR_HTTP_MILO'
  readonly code: string = ErreurHttpMilo.CODE
  readonly statusCode: number
  readonly message: string

  constructor(message: string, statusCode: number) {
    this.message = message
    this.statusCode = statusCode
  }
}

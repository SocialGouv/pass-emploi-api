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

export class EmailExisteDejaError implements DomainError {
  static CODE = 'EMAIL_EXISTE_DEJA'
  readonly code: string = EmailExisteDejaError.CODE
  readonly message: string

  constructor(email: string) {
    this.message = `Un compte avec l'${email} existe déjà`
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

export class RechercheOffreInvalide implements DomainError {
  static CODE = 'RECHERCHE_OFFRE_INVALIDE'
  readonly code: string = RechercheOffreInvalide.CODE
  readonly message: string

  constructor(message: string) {
    this.message = message
  }
}

export class RechercheDetailOffreNonTrouve implements DomainError {
  static CODE = 'RECHERCHE_DETAIL_OFFRE_NON_TROUVE'
  readonly code: string = RechercheDetailOffreNonTrouve.CODE
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

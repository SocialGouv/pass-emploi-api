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

export class UtilisateurNonValide implements DomainError {
  static CODE = 'UTILISATEUR_NON_VALIDE'
  readonly code: string = UtilisateurNonValide.CODE
  readonly message: string

  constructor() {
    this.message = `Impossible de créer un utilisateur avec `
  }
}

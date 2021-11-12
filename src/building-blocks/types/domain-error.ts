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

export class JeuneNonLieAuConseillerError implements DomainError {
  static CODE = 'JEUNE_NON_LIE_AU_CONSEILLE'
  readonly code: string = JeuneNonLieAuConseillerError.CODE
  readonly message: string

  constructor(idConseiller: string, idJeune: string) {
    this.message = `Le conseiller ${idConseiller} n'est pas lié au jeune ${idJeune}`
  }
}

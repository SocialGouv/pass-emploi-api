export const AuthentificationRepositoryToken = 'Authentification.Repository'

export namespace Authentification {
  export enum Type {
    JEUNE = 'JEUNE',
    CONSEILLER = 'CONSEILLER'
  }

  export enum Structure {
    PASS_EMPLOI = 'PASS_EMPLOI',
    MILO = 'MILO',
    POLE_EMPLOI = 'POLE_EMPLOI'
  }

  export interface Utilisateur {
    id: string
    prenom: string
    nom: string
    email?: string
    structure: Authentification.Structure
    type: Authentification.Type
  }
  export interface Repository {
    get(
      id: string,
      type: Authentification.Type
    ): Promise<Utilisateur | undefined>
  }
}

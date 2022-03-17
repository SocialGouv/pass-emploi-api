import { Injectable } from '@nestjs/common'
import { ConseillerNonValide } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { IdService } from '../utils/id-service'
import { Core } from './core'

export const AuthentificationRepositoryToken = 'Authentification.Repository'

export namespace Authentification {
  export enum Type {
    JEUNE = 'JEUNE',
    CONSEILLER = 'CONSEILLER',
    SUPPORT = 'SUPPORT'
  }

  export enum Role {
    SUPERVISEUR = 'SUPERVISEUR'
  }

  export const METADATA_IDENTIFIER_API_KEY_PARTENAIRE = 'partenaire'

  export enum Partenaire {
    KEYCLOAK = 'KEYCLOAK',
    IMMERSION = 'IMMERSION'
  }

  export const mappedRoles: { [roleKeycloak: string]: Role } = {
    conseiller_superviseur: Role.SUPERVISEUR
  }

  export interface Utilisateur {
    id: string
    idAuthentification?: string
    prenom: string
    nom: string
    structure: Core.Structure
    type: Authentification.Type
    roles: Authentification.Role[]
    email?: string
  }

  // TODO : à mettre plutôt dans une classe Utilisateur ?
  export function estSuperviseur(utilisateur: Utilisateur): boolean {
    return utilisateur.roles.includes(Authentification.Role.SUPERVISEUR)
  }

  export interface Repository {
    get(
      id: string,
      structure: Core.Structure,
      type: Authentification.Type
    ): Promise<Utilisateur | undefined>

    getJeuneByEmail(email: string): Promise<Utilisateur | undefined>

    update(utilisateur: Authentification.Utilisateur): Promise<void>

    updateJeune(idJeune: string, idUtilisateurAuth: string): Promise<void>

    save(utilisateur: Utilisateur, dateCreation?: Date): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(private readonly idService: IdService) {}

    buildConseiller(
      idAuthentification: string,
      nom: string | undefined,
      prenom: string | undefined,
      email: string | undefined,
      structure: Core.Structure
    ): Result<Utilisateur> {
      if (!nom || !prenom) {
        return failure(new ConseillerNonValide())
      }

      const utilisateur: Utilisateur = {
        id: this.idService.uuid(),
        idAuthentification,
        prenom: prenom,
        nom: nom,
        email: email,
        type: Type.CONSEILLER,
        structure: structure,
        roles: []
      }
      return success(utilisateur)
    }
  }
}

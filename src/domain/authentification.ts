import { Injectable } from '@nestjs/common'
import { ConseillerNonValide } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { IdService } from '../utils/id-service'
import { Core } from './core'

export const AuthentificationRepositoryToken = 'Authentification.Repository'

export namespace Authentification {
  export enum Type {
    JEUNE = 'JEUNE',
    CONSEILLER = 'CONSEILLER'
  }

  export enum Role {
    SUPERVISEUR = 'SUPERVISEUR'
  }

  export const mappedRoles: { [roleKeycloak: string]: Role } = {
    conseiller_superviseur: Role.SUPERVISEUR
  }

  export interface Utilisateur {
    id: string
    prenom: string
    nom: string
    structure: Core.Structure
    type: Authentification.Type
    roles: Authentification.Role[]
    email?: string
  }

  export interface Repository {
    get(
      id: string,
      structure: Core.Structure,
      type: Authentification.Type
    ): Promise<Utilisateur | undefined>
    getJeuneByEmail(email: string): Promise<Utilisateur | undefined>
    updateJeune(idJeune: string, idUtilisateurAuth: string): Promise<void>
    save(utilisateur: Utilisateur, idUtilisateurAuth: string): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(private readonly idService: IdService) {}

    buildConseiller(
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

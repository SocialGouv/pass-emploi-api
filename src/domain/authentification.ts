import { Injectable } from '@nestjs/common'
import { UtilisateurMiloNonValide } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { IdService } from '../utils/id-service'
import { Core } from './core'

export const AuthentificationRepositoryToken = 'Authentification.Repository'

export namespace Authentification {
  export enum Type {
    JEUNE = 'JEUNE',
    CONSEILLER = 'CONSEILLER'
  }

  export interface Utilisateur {
    id: string
    prenom: string
    nom: string
    email?: string
    structure: Core.Structure
    type: Authentification.Type
  }

  export interface Repository {
    get(
      id: string,
      structure: Core.Structure,
      type: Authentification.Type
    ): Promise<Utilisateur | undefined>
    getJeuneMiloByEmail(email: string): Promise<Utilisateur | undefined>
    updateJeuneMilo(idJeune: string, idUtilisateurAuth: string): Promise<void>
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
      if (!nom || !prenom || !email) {
        return failure(new UtilisateurMiloNonValide())
      }

      const utilisateur = {
        id: this.idService.uuid(),
        prenom: prenom,
        nom: nom,
        email: email,
        type: Type.CONSEILLER,
        structure: structure
      }
      return success(utilisateur)
    }
  }
}

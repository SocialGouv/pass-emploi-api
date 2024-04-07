import { Injectable } from '@nestjs/common'
import { ConseillerNonValide } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { IdService } from '../utils/id-service'
import { Core, estMilo } from './core'

export const AuthentificationRepositoryToken = 'Authentification.Repository'

export namespace Authentification {
  export enum Type {
    JEUNE = 'JEUNE',
    CONSEILLER = 'CONSEILLER',
    SUPPORT = 'SUPPORT'
  }

  export enum Role {
    SUPERVISEUR = 'SUPERVISEUR',
    SUPERVISEUR_PE_BRSA = 'SUPERVISEUR_PE_BRSA'
  }

  export const METADATA_IDENTIFIER_API_KEY_PARTENAIRE = 'partenaire'

  export enum Partenaire {
    KEYCLOAK = 'KEYCLOAK',
    IMMERSION = 'IMMERSION',
    POLE_EMPLOI = 'POLE_EMPLOI'
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
    datePremiereConnexion?: Date
    dateDerniereConnexion?: Date
    appVersion?: string
    installationId?: string
    username?: string
  }

  export function estSuperviseur(utilisateur: Utilisateur): boolean {
    return utilisateur.roles.includes(Authentification.Role.SUPERVISEUR)
  }

  export function estSuperviseurPEBRSA(utilisateur: Utilisateur): boolean {
    return utilisateur.roles.includes(Authentification.Role.SUPERVISEUR_PE_BRSA)
  }

  export function estJeune(type: Authentification.Type): boolean {
    return type === Authentification.Type.JEUNE
  }

  export function estConseiller(type: Authentification.Type): boolean {
    return type === Authentification.Type.CONSEILLER
  }

  export interface Repository {
    getConseillerByStructure(
      id: string,
      structure: Core.Structure
    ): Promise<Utilisateur | undefined>

    getJeuneByStructure(
      id: string,
      structure: Core.Structure
    ): Promise<Utilisateur | undefined>

    getJeune(id: string): Promise<Utilisateur | undefined>

    getJeuneByEmail(email: string): Promise<Utilisateur | undefined>

    update(utilisateur: Authentification.Utilisateur): Promise<void>

    save(utilisateur: Utilisateur, dateCreation?: Date): Promise<void>

    updateJeune(
      utilisateur: Partial<Authentification.Utilisateur>
    ): Promise<void>

    deleteUtilisateurIdp(idJeune: string): Promise<void>
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
        roles: estMilo(structure) ? [Authentification.Role.SUPERVISEUR] : []
      }
      return success(utilisateur)
    }
  }
}

import { Injectable } from '@nestjs/common'
import { ConseillerNonValide } from '../building-blocks/types/domain-error'
import { failure, Result, success } from '../building-blocks/types/result'
import { IdService } from '../utils/id-service'
import { Core, getStructureDeReference } from './core'

export const AuthentificationRepositoryToken = 'Authentification.Repository'

export namespace Authentification {
  export enum Type {
    JEUNE = 'JEUNE',
    CONSEILLER = 'CONSEILLER',
    SUPPORT = 'SUPPORT'
  }

  export enum Role {
    SUPERVISEUR = 'SUPERVISEUR',
    SUPERVISEUR_RESPONSABLE = 'SUPERVISEUR_RESPONSABLE'
  }

  export const METADATA_IDENTIFIER_API_KEY_PARTENAIRE = 'partenaire'

  export enum Partenaire {
    KEYCLOAK = 'KEYCLOAK',
    IMMERSION = 'IMMERSION',
    POLE_EMPLOI = 'POLE_EMPLOI',
    SUPPORT = 'SUPPORT'
  }

  export function unUtilisateurSupport(): Utilisateur {
    return {
      id: 'SUPPORT',
      prenom: 'support',
      nom: 'cej',
      structure: Core.Structure.SUPPORT,
      type: Authentification.Type.SUPPORT,
      roles: []
    }
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

  export function estSuperviseurResponsable(
    utilisateur: Utilisateur,
    structure: Core.Structure
  ): boolean {
    const dansLaBonneStructureDeReference = (): boolean =>
      getStructureDeReference(utilisateur.structure) ===
      getStructureDeReference(structure)

    return (
      utilisateur.roles.includes(
        Authentification.Role.SUPERVISEUR_RESPONSABLE
      ) && dansLaBonneStructureDeReference()
    )
  }

  export function estJeune(type: Authentification.Type): boolean {
    return type === Authentification.Type.JEUNE
  }

  export function estConseiller(type: Authentification.Type): boolean {
    return type === Authentification.Type.CONSEILLER
  }

  export interface Repository {
    getConseiller(idAuthentification: string): Promise<Utilisateur | undefined>

    getJeuneByStructure(
      idAuthentification: string,
      structure: Core.Structure
    ): Promise<Utilisateur | undefined>

    getJeuneByIdAuthentification(
      idAuthentification: string
    ): Promise<Utilisateur | undefined>

    getJeuneById(id: string): Promise<Utilisateur | undefined>

    getJeuneByEmail(email: string): Promise<Utilisateur | undefined>

    update(utilisateur: Authentification.Utilisateur): Promise<void>

    save(utilisateur: Utilisateur, dateCreation?: Date): Promise<void>

    updateJeune(
      utilisateur: Partial<Authentification.Utilisateur>
    ): Promise<void>

    deleteUtilisateurIdp(idUserCEJ: string): Promise<void>

    estConseillerSuperviseur(
      structure: Core.Structure,
      email?: string | null
    ): Promise<{ dansSaStructure: boolean; crossStructures: boolean }>

    recupererAccesPartenaire(
      bearer: string,
      structure: Core.Structure
    ): Promise<string>

    seFairePasserPourUnConseiller(
      idConseiller: string,
      bearer: string,
      structure: Core.Structure
    ): Promise<Result<string>>
  }

  @Injectable()
  export class Factory {
    constructor(private readonly idService: IdService) {}

    buildConseiller(
      idAuthentification: string,
      nom: string | undefined,
      prenom: string | undefined,
      email: string | undefined,
      username: string | undefined,
      structure: Core.Structure,
      superviseur: { dansSaStructure: boolean; crossStructures: boolean }
    ): Result<Utilisateur> {
      if (!nom || !prenom) {
        return failure(new ConseillerNonValide())
      }

      const roles = []
      if (superviseur.dansSaStructure)
        roles.push(Authentification.Role.SUPERVISEUR)
      if (superviseur.crossStructures)
        roles.push(Authentification.Role.SUPERVISEUR_RESPONSABLE)

      const utilisateur: Utilisateur = {
        id: this.idService.uuid(),
        idAuthentification,
        prenom: prenom,
        nom: nom,
        email: email,
        username,
        type: Type.CONSEILLER,
        structure: structure,
        roles
      }
      return success(utilisateur)
    }
  }
}

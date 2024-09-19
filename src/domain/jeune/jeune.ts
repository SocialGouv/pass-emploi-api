import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { JeuneHomeQueryModel } from '../../application/queries/query-models/home-jeune.query-model'
import { Brand } from '../../building-blocks/types/brand'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Core } from '../core'
import * as _ConfigurationApplication from './configuration-application'
import * as _PoleEmploi from './jeune.pole-emploi'

export const JeuneRepositoryToken = 'JeuneRepositoryToken'
export const JeuneConfigurationApplicationRepositoryToken =
  'JeuneConfigurationApplicationRepositoryToken'
export const JeunePoleEmploiRepositoryToken = 'JeunePoleEmploiRepositoryToken'

export interface Jeune {
  id: string
  firstName: string
  lastName: string
  creationDate: DateTime
  datePremiereConnexion?: DateTime
  dateFinCEJ?: DateTime
  structure: Core.Structure
  isActivated: boolean
  conseiller?: Jeune.Conseiller
  conseillerInitial?: Jeune.ConseillerInitial
  email?: string
  idPartenaire?: string
  configuration: Jeune.ConfigurationApplication
  preferences: Jeune.Preferences
  dateSignatureCGU?: DateTime
}

export namespace Jeune {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import ConfigurationApplication = _ConfigurationApplication.ConfigurationApplication
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Preferences = _ConfigurationApplication.ConfigurationApplication.Preferences
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import PoleEmploi = _PoleEmploi.JeunePoleEmploi

  export interface Conseiller {
    id: string
    firstName: string
    lastName: string
    email?: string
    idAgence?: string
  }

  export interface ConseillerInitial {
    id: string
  }

  export enum TypeTransfert {
    DEFINITIF = 'DEFINITIF',
    TEMPORAIRE = 'TEMPORAIRE',
    DEFINITIF_SUPPORT = 'DEFINITIF_SUPPORT',
    TEMPORAIRE_SUPPORT = 'TEMPORAIRE_SUPPORT',
    RECUPERATION = 'RECUPERATION'
  }

  export type Id = Brand<string, 'JeuneId'>

  export function mettreAJourIdPartenaire(
    jeune: Jeune,
    idPartenaire: string
  ): Jeune {
    return {
      ...jeune,
      idPartenaire
    }
  }

  export interface Repository {
    get(id: string): Promise<Jeune | undefined>

    findAll(ids: string[]): Promise<Jeune[]>

    existe(id: string): Promise<boolean>

    getByEmail(email: string): Promise<Jeune | undefined>

    save(jeune: Jeune): Promise<void>

    findAllJeunesByConseiller(idConseiller: string): Promise<Jeune[]>

    findAllJeunesByIdsAndConseiller(
      idsJeunes: string[],
      idConseiller: string
    ): Promise<Jeune[]>

    findAllJeunesByIdsAuthentificationAndStructures(
      idsAuthentificationJeunes: string[],
      structures: Core.Structure[]
    ): Promise<Array<Jeune & { idAuthentification: string }>>

    findAllJeunesByConseillerInitial(idConseiller: string): Promise<Jeune[]>

    supprimer(idJeune: Jeune.Id): Promise<void>

    getHomeQueryModel(idJeune: string): Promise<JeuneHomeQueryModel>

    transferAndSaveAll(
      jeunes: Jeune[],
      idConseillerCible: string,
      idConseillerSource: string,
      idConseillerQuiTransfert: string,
      typeTransfert: Jeune.TypeTransfert
    ): Promise<void>

    saveAllJeuneTransferes(jeunes: Jeune[]): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(
      private dateService: DateService,
      private idService: IdService
    ) {}

    creer(jeuneACreer: Factory.ACreer): Jeune {
      const id = this.idService.uuid()
      return {
        id: id,
        firstName: jeuneACreer.prenom,
        lastName: jeuneACreer.nom,
        email: jeuneACreer.email,
        isActivated: false,
        creationDate: this.dateService.now(),
        conseiller: {
          id: jeuneACreer.conseiller.id,
          lastName: jeuneACreer.conseiller.lastName,
          firstName: jeuneACreer.conseiller.firstName,
          email: jeuneACreer.conseiller.email
        },
        structure: jeuneACreer.structure,
        preferences: {
          partageFavoris: true,
          alertesOffres: true,
          messages: true,
          creationActionConseiller: true,
          rendezVousSessions: true,
          rappelActions: true
        },
        idPartenaire: jeuneACreer.idPartenaire,
        configuration: {
          idJeune: id
        }
      }
    }
  }

  export namespace Factory {
    export interface ACreer {
      prenom: string
      nom: string
      email: string
      conseiller: Conseiller
      structure: Core.Structure
      idPartenaire?: string
    }
  }

  export function changerDeConseiller(
    jeunes: Jeune[],
    conseillerCible: Conseiller,
    idConseillerSource: string,
    estTemporaire: boolean
  ): Jeune[] {
    return jeunes.map(jeune => ({
      ...jeune,
      conseiller: {
        id: conseillerCible.id,
        firstName: conseillerCible.firstName,
        lastName: conseillerCible.lastName,
        email: conseillerCible.email
      },
      conseillerInitial: mapConseillerInitial(
        jeune,
        idConseillerSource,
        conseillerCible.id,
        estTemporaire
      )
    }))
  }

  export function recupererLesJeunes(
    jeunes: Jeune[],
    conseillerCible: Conseiller
  ): Jeune[] {
    return jeunes.map(jeune => ({
      ...jeune,
      conseiller: {
        id: conseillerCible.id,
        firstName: conseillerCible.firstName,
        lastName: conseillerCible.lastName,
        email: conseillerCible.email
      },
      conseillerInitial: undefined
    }))
  }

  export function separerLesJeunesParConseillerActuel(
    jeunes: Jeune[]
  ): Record<string, Jeune[]> {
    return jeunes.reduce((res, jeuneActuel) => {
      if (res[jeuneActuel.conseiller!.id]) {
        res[jeuneActuel.conseiller!.id].push(jeuneActuel)
      } else {
        res[jeuneActuel.conseiller!.id] = [jeuneActuel]
      }
      return res
    }, {} as Record<string, Jeune[]>)
  }

  export function estSuiviTemporairement(jeune: Jeune): boolean {
    return Boolean(jeune.conseillerInitial)
  }
}

function mapConseillerInitial(
  jeune: Jeune,
  idConseillerSource: string,
  idConseillerCible: string,
  estTemporaire: boolean
): Jeune.ConseillerInitial | undefined {
  if (idConseillerCible === jeune.conseillerInitial?.id) {
    return undefined
  }
  if (estTemporaire) {
    return jeune.conseillerInitial ?? { id: idConseillerSource }
  }
  return undefined
}

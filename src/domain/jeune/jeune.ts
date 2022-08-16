import { DateTime } from 'luxon'
import { JeuneHomeQueryModel } from 'src/application/queries/query-models/home-jeune.query-model'
import { Brand } from '../../building-blocks/types/brand'
import { DateService } from '../../utils/date-service'
import { Core } from '../core'
import { Injectable } from '@nestjs/common'
import { IdService } from '../../utils/id-service'
import * as _ConfigurationApplication from './configuration-application'

export const JeunesRepositoryToken = 'Jeune.Repository'
export const JeuneConfigurationApplicationRepositoryToken =
  'Jeune.ConfigurationApplication.Repository'

export interface Jeune {
  id: string
  firstName: string
  lastName: string
  creationDate: DateTime
  structure: Core.Structure
  isActivated: boolean
  conseiller?: Jeune.Conseiller
  conseillerInitial?: Jeune.ConseillerInitial
  email?: string
  idPartenaire?: string
  configuration?: Jeune.ConfigurationApplication
  preferences: Jeune.Preferences
}

export namespace Jeune {
  // FIXME: le linter ne comprend pas cette technique 🤷‍️
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import ConfigurationApplication = _ConfigurationApplication.ConfigurationApplication

  export interface Conseiller {
    id: string
    firstName: string
    lastName: string
    email?: string
  }

  export interface ConseillerInitial {
    id: string
  }

  export interface Preferences {
    partageFavoris: boolean
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
    get(
      id: string,
      attributs?: { avecConfiguration: boolean }
    ): Promise<Jeune | undefined>

    getJeunesMiloAvecIdDossier(offset: number, limit: number): Promise<Jeune[]>

    existe(id: string): Promise<boolean>

    getByEmail(email: string): Promise<Jeune | undefined>

    getByIdDossier(idPartenaire: string): Promise<Jeune | undefined>

    save(jeune: Jeune): Promise<void>

    findAllJeunesByConseiller(
      idsJeunes: string[],
      idConseiller: string
    ): Promise<Jeune[]>

    findAllJeunesByConseillerInitial(idConseiller: string): Promise<Jeune[]>

    supprimer(idJeune: Jeune.Id): Promise<void>

    getHomeQueryModel(idJeune: string): Promise<JeuneHomeQueryModel>

    transferAndSaveAll(
      jeunes: Jeune[],
      idConseillerCible: string,
      idConseillerSource: string,
      estTemporaire?: boolean
    ): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(
      private dateService: DateService,
      private idService: IdService
    ) {}

    creer(jeuneACreer: Factory.ACreer): Jeune {
      return {
        id: this.idService.uuid(),
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
          partageFavoris: true
        },
        idPartenaire: jeuneACreer.idPartenaire
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

  export function transfererLesJeunes(
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

import { Injectable } from '@nestjs/common'
import { Brand } from '../building-blocks/types/brand'
import { DomainError } from '../building-blocks/types/domain-error'
import { Result, success } from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { IdService } from '../utils/id-service'
import { Jeune } from './jeune'

export const ActionsRepositoryToken = 'ActionsRepositoryToken'

export interface Action {
  id: Action.Id
  statut: Action.Statut
  contenu: string
  commentaire: string
  dateCreation: Date
  dateDerniereActualisation: Date
  idJeune: Jeune.Id
  createur: Action.Createur
}

export namespace ActionPoleEmploi {
  export enum Statut {
    EN_COURS = 'EN_COURS',
    A_FAIRE = 'A_FAIRE',
    REALISEE = 'REALISEE',
    ANNULEE = 'ANNULEE'
  }

  export interface Code {
    quoi: string
    pourquoi: string
    comment?: string
  }

  export function toBase64(code: Code): string {
    return Buffer.from(JSON.stringify(code)).toString('base64')
  }
}

export namespace Action {
  export type Id = Brand<string, 'IdAction'>
  export type IdCreateur = string | Jeune.Id

  export interface Repository {
    save(action: Action): Promise<void>
    get(id: Action.Id): Promise<Action | undefined>
    getConseillerEtJeune(
      id: Action.Id
    ): Promise<{ idConseiller: string; idJeune: string } | undefined>
    delete(id: Action.Id): Promise<void>
  }

  export interface Createur {
    prenom: string
    nom: string
    id: string
    type: Action.TypeCreateur
  }

  export enum Statut {
    EN_COURS = 'in_progress',
    PAS_COMMENCEE = 'not_started',
    TERMINEE = 'done',
    ANNULEE = 'canceled'
  }

  export enum TypeCreateur {
    CONSEILLER = 'conseiller',
    JEUNE = 'jeune'
  }

  export class StatutInvalide implements DomainError {
    static CODE = 'StatutActionInvalide'
    readonly code: string = StatutInvalide.CODE
    readonly message: string

    constructor(statutInvalide: string) {
      this.message = `Statut '${statutInvalide}' invalide`
    }
  }

  @Injectable()
  export class Factory {
    constructor(
      private readonly idService: IdService,
      private readonly dateService: DateService
    ) {}

    buildAction(
      data: {
        contenu: string
        idJeune: string
        statut?: Action.Statut
        commentaire?: string
        typeCreateur: Action.TypeCreateur
      },
      jeune: Jeune
    ): Result<Action> {
      const statut = data.statut ?? Action.Statut.PAS_COMMENCEE

      const now = this.dateService.nowJs()
      let createur: Action.Createur
      if (data.typeCreateur === Action.TypeCreateur.JEUNE) {
        createur = {
          id: jeune.id,
          type: Action.TypeCreateur.JEUNE,
          nom: jeune.lastName,
          prenom: jeune.firstName
        }
      } else {
        createur = {
          id: jeune.conseiller!.id,
          type: Action.TypeCreateur.CONSEILLER,
          nom: jeune.conseiller!.lastName,
          prenom: jeune.conseiller!.firstName
        }
      }

      const action: Action = {
        id: this.idService.uuid(),
        contenu: data.contenu,
        commentaire: data.commentaire ?? '',
        idJeune: data.idJeune,
        statut: statut,
        createur,
        dateCreation: now,
        dateDerniereActualisation: now
      }
      return success(action)
    }

    updateStatut(action: Action, statut: Action.Statut): Result<Action> {
      const now = this.dateService.nowJs()
      return success({
        ...action,
        statut,
        dateDerniereActualisation: now
      })
    }
  }
}

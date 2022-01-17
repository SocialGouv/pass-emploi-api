import { Injectable } from '@nestjs/common'
import { ActionQueryModel } from '../application/queries/query-models/actions.query-model'
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
  idCreateur: Action.IdCreateur
  typeCreateur: Action.TypeCreateur
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

    getQueryModelById(id: string): Promise<ActionQueryModel | undefined>
    getQueryModelByJeuneId(id: string): Promise<ActionQueryModel[]>
  }

  export enum Statut {
    EN_COURS = 'in_progress',
    PAS_COMMENCEE = 'not_started',
    TERMINEE = 'done'
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
      },
      createur: { id: Action.IdCreateur; type: Action.TypeCreateur }
    ): Result<Action> {
      const statut = data.statut ?? Action.Statut.PAS_COMMENCEE

      const now = this.dateService.nowJs()
      const action: Action = {
        id: this.idService.uuid(),
        contenu: data.contenu,
        commentaire: data.commentaire ?? '',
        idJeune: data.idJeune,
        statut: statut,
        idCreateur: createur.id,
        typeCreateur: createur.type,
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

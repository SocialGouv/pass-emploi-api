import { Injectable } from '@nestjs/common'
import { ActionQueryModel } from '../application/queries/query-models/actions.query-model'
import { Brand } from '../building-blocks/types/brand'
import { DomainError } from '../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../building-blocks/types/result'
import { DateService } from '../utils/date-service'
import { IdService } from '../utils/id-service'
import { Conseiller } from './conseiller'
import { Jeune } from './jeune'

export const ActionsRepositoryToken = 'ActionsRepositoryToken'

export interface ActionData {
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

interface UpdateStatut {
  statut?: Action.Statut
  estTerminee?: boolean
}

export class Action implements ActionData {
  readonly id: Action.Id
  readonly contenu: string
  readonly commentaire: string
  readonly dateCreation: Date
  readonly dateDerniereActualisation: Date
  readonly idJeune: Jeune.Id
  readonly idCreateur: Action.IdCreateur
  readonly typeCreateur: Action.TypeCreateur
  private _statut: Action.Statut

  constructor(args: ActionData) {
    this.id = args.id
    this._statut = args.statut
    this.contenu = args.contenu
    this.commentaire = args.commentaire
    this.dateCreation = args.dateCreation
    this.dateDerniereActualisation = args.dateDerniereActualisation
    this.idJeune = args.idJeune
    this.idCreateur = args.idCreateur
    this.typeCreateur = args.typeCreateur
  }

  get statut(): Action.Statut {
    return this._statut
  }

  updateStatut(update: UpdateStatut): Result {
    if (update.statut === undefined && update.estTerminee === undefined) {
      return emptySuccess()
    }

    if (update.statut) {
      if (!Action.statutsPossibles.includes(update.statut)) {
        return failure(new Action.StatutInvalide(update.statut))
      }
      this._statut = update.statut
    } else if (update.estTerminee) {
      this._statut = Action.Statut.TERMINEE
    } else if (this._statut === Action.Statut.TERMINEE) {
      this._statut = Action.Statut.EN_COURS
    }

    return emptySuccess()
  }
}

export namespace Action {
  export type Id = Brand<string, 'IdAction'>
  export type IdCreateur = Conseiller.Id | Jeune.Id

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

  export const statutsPossibles: string[] = Object.values(Action.Statut)

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
      if (!Action.statutsPossibles.includes(statut)) {
        return failure(new Action.StatutInvalide(statut))
      }

      const now = this.dateService.nowJs()
      const action: Action = new Action({
        id: this.idService.uuid(),
        contenu: data.contenu,
        commentaire: data.commentaire ?? '',
        idJeune: data.idJeune,
        statut: statut,
        idCreateur: createur.id,
        typeCreateur: createur.type,
        dateCreation: now,
        dateDerniereActualisation: now
      })
      return success(action)
    }
  }
}

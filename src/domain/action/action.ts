import { Injectable } from '@nestjs/common'
import { Brand } from '../../building-blocks/types/brand'
import {
  DomainError,
  PasDeRappelError
} from '../../building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  Result,
  success
} from '../../building-blocks/types/result'
import { DateService } from '../../utils/date-service'
import { IdService } from '../../utils/id-service'
import { Jeune } from '../jeune/jeune'
import { DateTime } from 'luxon'
import * as _Commentaire from './commentaire'

export const ActionsRepositoryToken = 'ActionsRepositoryToken'
export const CommentaireActionRepositoryToken =
  'CommentaireActionRepositoryToken'

export interface Action {
  id: Action.Id
  statut: Action.Statut
  contenu: string
  description: string
  dateCreation: Date
  dateDerniereActualisation: Date
  idJeune: Jeune.Id
  createur: Action.Createur
  dateEcheance: Date
  dateFinReelle?: Date
  rappel: boolean
}

export namespace Action {
  // FIXME: le linter ne comprend pas cette technique 🤷‍️
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Commentaire = _Commentaire.Commentaire

  export type Id = Brand<string, 'IdAction'>
  export type IdCreateur = string | Jeune.Id

  export enum CodeQualification {
    SANTE = 'SANTE',
    PROJET_PROFESSIONNEL = 'PROJET_PROFESSIONNEL',
    LOGEMENT = 'LOGEMENT',
    CITOYENNETE = 'CITOYENNETE',
    EMPLOI = 'EMPLOI',
    CULTURE_SPORT_LOISIRS = 'CULTURE_SPORT_LOISIRS',
    FORMATION = 'FORMATION',
    NON_QUALIFIABLE = 'NON_QUALIFIABLE'
  }

  export const mapCodeTypeQualification: Record<
    CodeQualification,
    TypeQualification
  > = {
    SANTE: {
      code: CodeQualification.SANTE,
      label: 'CEJ - Démarches personnelles santé',
      heures: 2
    },
    PROJET_PROFESSIONNEL: {
      code: CodeQualification.PROJET_PROFESSIONNEL,
      label: 'CEJ - Démarches personnelles projet professionnel',
      heures: 2
    },
    LOGEMENT: {
      code: CodeQualification.LOGEMENT,
      label: 'CEJ - Démarches personnelles logement',
      heures: 2
    },
    CITOYENNETE: {
      code: CodeQualification.CITOYENNETE,
      label: 'CEJ - Démarches personnelles citoyenneté',
      heures: 2
    },
    EMPLOI: {
      code: CodeQualification.EMPLOI,
      label: 'CEJ - Démarches personnelles emploi',
      heures: 3
    },
    CULTURE_SPORT_LOISIRS: {
      code: CodeQualification.CULTURE_SPORT_LOISIRS,
      label: 'CEJ - Démarches personnelles loisir, sport, culture',
      heures: 2
    },
    FORMATION: {
      code: CodeQualification.FORMATION,
      label: 'CEJ - Démarches personnelles formation',
      heures: 3
    },
    NON_QUALIFIABLE: {
      code: CodeQualification.NON_QUALIFIABLE,
      label: 'Non qualifiable',
      heures: 0
    }
  }

  export interface TypeQualification {
    code: CodeQualification
    label: string
    heures: number
  }

  export interface Repository {
    save(action: Action): Promise<void>

    get(id: Action.Id): Promise<Action | undefined>

    getConseillerEtJeune(
      id: Action.Id
    ): Promise<{ idConseiller: string; idJeune: string } | undefined>

    delete(id: Action.Id): Promise<void>

    findAllActionsARappeler(): Promise<Action[]>
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

  export enum Tri {
    DATE_CROISSANTE = 'date_croissante',
    DATE_DECROISSANTE = 'date_decroissante',
    DATE_ECHEANCE_CROISSANTE = 'date_echeance_croissante',
    DATE_ECHEANCE_DECROISSANTE = 'date_echeance_decroissante',
    STATUT = 'statut'
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
        dateEcheance: Date
        rappel?: boolean
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

      const dateEcheanceA9Heures30 = DateTime.fromJSDate(data.dateEcheance)
        .plus({ hour: 9, minute: 30 })
        .toJSDate()

      const action: Action = {
        id: this.idService.uuid(),
        contenu: data.contenu,
        description: data.commentaire ?? '',
        idJeune: data.idJeune,
        statut,
        createur,
        dateCreation: now,
        dateDerniereActualisation: now,
        rappel: data.rappel === undefined ? true : data.rappel,
        dateEcheance: dateEcheanceA9Heures30,
        dateFinReelle: statut === Action.Statut.TERMINEE ? now : undefined
      }
      return success(action)
    }

    updateStatut(action: Action, statut: Action.Statut): Result<Action> {
      const now = this.dateService.nowJs()

      let dateFinReelle = action.dateFinReelle
      if (statut === Action.Statut.TERMINEE) {
        dateFinReelle = now
      } else if (action.statut === Action.Statut.TERMINEE) {
        dateFinReelle = undefined
      }

      return success({
        ...action,
        statut,
        dateFinReelle,
        dateDerniereActualisation: now
      })
    }

    doitPlanifierUneNotificationDeRappel(action: Action): boolean {
      const dateEcheanceDansStrictementPlusDe3Jours =
        this.dateService.now().plus({ days: 3 }).startOf('day') <
        DateTime.fromJSDate(action.dateEcheance).startOf('day')
      return (
        action.rappel &&
        action?.statut !== Action.Statut.ANNULEE &&
        action?.statut !== Action.Statut.TERMINEE &&
        dateEcheanceDansStrictementPlusDe3Jours
      )
    }

    doitEnvoyerUneNotificationDeRappel(action: Action): Result {
      const dateEcheanceDans3Jours = DateService.isSameDateDay(
        this.dateService.now().plus({ days: 3 }),
        DateTime.fromJSDate(action.dateEcheance)
      )
      const actionPasTerminee =
        action.statut !== Action.Statut.ANNULEE &&
        action.statut !== Action.Statut.TERMINEE
      const doitEnvoyerUnRappel =
        action.rappel && actionPasTerminee && dateEcheanceDans3Jours

      if (doitEnvoyerUnRappel) {
        return emptySuccess()
      } else {
        let raison: string
        if (!dateEcheanceDans3Jours) {
          raison = `l'action n'arrive pas à échéance dans 3 jours`
        } else if (!action.rappel) {
          raison = `le rappel est désactivé`
        } else {
          raison = `le statut est ${action.statut}`
        }
        return failure(new PasDeRappelError(action.id, raison))
      }
    }
  }
}

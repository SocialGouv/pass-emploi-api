import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { Brand } from '../../building-blocks/types/brand'
import {
  DomainError,
  MauvaiseCommandeError,
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
import * as _Commentaire from './commentaire'
import * as _Qualification from './qualification'
import _ACTIONS_PREDEFINIES from './actions-predefinies'

export const ActionRepositoryToken = 'ActionRepositoryToken'
export const CommentaireActionRepositoryToken =
  'CommentaireActionRepositoryToken'

export interface Action {
  id: Action.Id
  statut: Action.Statut
  contenu: string
  description: string
  dateCreation: DateTime
  dateDerniereActualisation: DateTime
  idJeune: Jeune.Id
  createur: Action.Createur
  dateEcheance: DateTime
  dateDebut?: DateTime
  dateFinReelle?: DateTime
  rappel: boolean
  qualification?: Action.Qualification
  commentaires?: Action.Commentaire[]
}

export interface InfosActionAMettreAJour {
  idAction: Action.Id
  statut?: Action.Statut
  contenu?: string
  description?: string
  dateEcheance?: DateTime
  codeQualification?: Action.Qualification.Code
}

export namespace Action {
  export const ACTIONS_PREDEFINIES: Action.ActionPredefinie[] =
    _ACTIONS_PREDEFINIES
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Commentaire = _Commentaire.Commentaire
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Qualification = _Qualification.Qualification

  export type Id = Brand<string, 'IdAction'>
  export type IdCreateur = string | Jeune.Id

  export interface Terminee extends Action {
    dateFinReelle: DateTime
  }

  export interface Qualifiee extends Terminee {
    dateDebut: DateTime
    qualification: Qualification
  }

  export interface Repository {
    save(action: Action): Promise<void>

    get(
      id: Action.Id,
      options?: { avecCommentaires: boolean }
    ): Promise<Action | undefined>

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

  export interface ActionPredefinie {
    id: string
    titre: string
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

  export function estQualifiee(action: Action): boolean {
    return Boolean(action.qualification?.heures)
  }

  export function estTerminee(action: Action): boolean {
    return (
      action.statut === Statut.TERMINEE && action.dateFinReelle !== undefined
    )
  }

  export function qualifier(
    action: Action,
    codeQualification: Qualification.Code,
    commentaireQualification?: string,
    dateDebut?: DateTime,
    dateFinReelle?: DateTime
  ): Result<Action.Qualifiee> {
    if (!estTerminee(action)) {
      return failure(new MauvaiseCommandeError("L'action n'est pas terminée"))
    }
    if (estQualifiee(action)) {
      return failure(new MauvaiseCommandeError('Action déjà qualifiée'))
    }

    const dateDebutReelle = dateDebut ?? action.dateCreation
    const dateFinReelleMiseAJour = dateFinReelle ?? action.dateFinReelle!

    if (DateService.isGreater(dateDebutReelle, dateFinReelleMiseAJour)) {
      return failure(
        new MauvaiseCommandeError(
          'La date de fin doit être postérieure à la date de création'
        )
      )
    }

    const { heures } = Qualification.mapCodeTypeQualification[codeQualification]

    return success({
      ...action,
      dateDebut: dateDebutReelle,
      dateFinReelle: dateFinReelleMiseAJour,
      qualification: {
        code: codeQualification,
        heures,
        commentaire: Qualification.buildCommentaire(
          action,
          codeQualification,
          commentaireQualification
        )
      }
    })
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
        dateEcheance: DateTime
        rappel?: boolean
        codeQualification?: Action.Qualification.Code
      },
      jeune: Jeune
    ): Result<Action> {
      const statut = data.statut ?? Action.Statut.PAS_COMMENCEE

      const now = this.dateService.now()
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

      const dateEcheanceA9Heures30 = data.dateEcheance.set({
        hour: 9,
        minute: 30
      })

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
        dateFinReelle:
          statut === Action.Statut.TERMINEE
            ? dateEcheanceA9Heures30
            : undefined,
        dateDebut: undefined,
        qualification: data.codeQualification
          ? { code: data.codeQualification }
          : undefined
      }
      return success(action)
    }

    updateStatut(action: Action, statut: Action.Statut): Result<Action> {
      if (Action.estQualifiee(action)) {
        return failure(
          new MauvaiseCommandeError(
            "Vous ne pouvez pas changer le statut d'une action qualifée"
          )
        )
      }

      const maintenant = this.dateService.now()
      return success({
        ...action,
        statut,
        dateFinReelle: this.mettreAJourLaDateDeFinReelle(
          action,
          statut,
          maintenant
        ),
        dateDerniereActualisation: maintenant
      })
    }

    updateAction(
      action: Action,
      infosActionAMettreAJour: InfosActionAMettreAJour
    ): Result<Action> {
      if (Action.estQualifiee(action)) {
        return failure(
          new MauvaiseCommandeError(
            'Vous ne pouvez pas modifier une action qualifée'
          )
        )
      }

      const maintenant = this.dateService.now()
      const statut = infosActionAMettreAJour.statut ?? action.statut

      return success({
        ...action,
        statut,
        contenu: infosActionAMettreAJour.contenu ?? action.contenu,
        description: infosActionAMettreAJour.description ?? action.description,
        dateEcheance:
          infosActionAMettreAJour.dateEcheance ?? action.dateEcheance,
        dateFinReelle: this.mettreAJourLaDateDeFinReelle(
          action,
          statut,
          maintenant
        ),
        dateDerniereActualisation: maintenant,
        qualification: infosActionAMettreAJour.codeQualification
          ? { code: infosActionAMettreAJour.codeQualification }
          : undefined
      })
    }

    doitPlanifierUneNotificationDeRappel(action: Action): boolean {
      const dateEcheanceDansStrictementPlusDe3Jours =
        this.dateService.now().plus({ days: 3 }).startOf('day') <
        action.dateEcheance.startOf('day')
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
        action.dateEcheance
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

    private mettreAJourLaDateDeFinReelle(
      action: Action,
      statut: Action.Statut,
      maintenant: DateTime
    ): DateTime | undefined {
      let dateFinReelle = action.dateFinReelle
      const nouveauStatutTermine = statut === Action.Statut.TERMINEE
      const ancienStatutTermine =
        !nouveauStatutTermine && action.statut === Action.Statut.TERMINEE
      if (nouveauStatutTermine) {
        dateFinReelle = maintenant
      }
      if (ancienStatutTermine) {
        dateFinReelle = undefined
      }
      return dateFinReelle
    }
  }
}

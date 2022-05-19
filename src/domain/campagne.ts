import { DateTime } from 'luxon'
import { Injectable } from '@nestjs/common'
import { IdService } from '../utils/id-service'
import { failure, Result, success } from '../building-blocks/types/result'
import {
  CampagneNonActive,
  NonTrouveError,
  ReponsesCampagneInvalide
} from '../building-blocks/types/domain-error'
import { Jeune } from './jeune'
import { DateService } from '../utils/date-service'

export const CampagneRepositoryToken = 'Campagne.Repository'

export interface Campagne {
  id: string
  nom: string
  dateDebut: DateTime
  dateFin: DateTime
}

export namespace Campagne {
  export interface ACreer {
    nom: string
    dateDebut: DateTime
    dateFin: DateTime
  }

  export interface Evaluation {
    idCampagne: string
    date: DateTime
    jeune: {
      id: string
      structure: string
      dateCreation: DateTime
    }
    reponses: Reponse[]
  }

  export interface Reponse {
    idQuestion: number
    idReponse: number
    pourquoi?: string
  }

  export interface Repository {
    save(campagne: Campagne): Promise<void>

    get(id: string): Promise<Campagne | undefined>

    getByIntervalOrName(
      dateDebut: DateTime,
      dateFin: DateTime,
      nom: string
    ): Promise<Campagne | undefined>

    saveEvaluation(evaluation: Evaluation): Promise<void>
  }

  @Injectable()
  export class Factory {
    constructor(
      private readonly idService: IdService,
      private readonly dateService: DateService
    ) {}

    creer(campagneACreer: Campagne.ACreer): Campagne {
      return {
        ...campagneACreer,
        id: this.idService.uuid()
      }
    }

    construireEvaluation(
      campagne: Campagne | undefined,
      jeune: Jeune,
      reponses: Reponse[]
    ): Result<Evaluation> {
      if (!campagne) {
        return failure(new NonTrouveError('Campagne'))
      }
      const maintenant = this.dateService.now()

      const laCampagneEstActive =
        maintenant.startOf('day') > campagne.dateDebut.startOf('day') &&
        maintenant.startOf('day') < campagne.dateFin.startOf('day')

      if (!laCampagneEstActive) {
        return failure(new CampagneNonActive(campagne.nom))
      }

      const ilYAUneReponseALaPremiereQuestion = Boolean(
        reponses.find(reponse => reponse.idQuestion == 1)
      )

      if (!ilYAUneReponseALaPremiereQuestion) {
        return failure(new ReponsesCampagneInvalide())
      }

      return success({
        idCampagne: campagne.id,
        date: maintenant,
        jeune: {
          id: jeune.id,
          dateCreation: jeune.creationDate,
          structure: jeune.structure
        },
        reponses: reponses
      })
    }
  }
}

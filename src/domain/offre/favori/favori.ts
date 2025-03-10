import { DateTime } from 'luxon'
import * as _Emploi from './offre-emploi'
import * as _Immersion from './offre-immersion'
import * as _ServiceCivique from './offre-service-civique'

export interface Favori<O> {
  idBeneficiaire: string
  dateCreation: DateTime
  dateCandidature?: DateTime
  offre: O
}

export namespace Favori {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Emploi = _Emploi.Emploi
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import Immersion = _Immersion.Immersion
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import ServiceCivique = _ServiceCivique.ServiceCivique
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars

  export enum Type {
    EMPLOI = 'OFFRE_EMPLOI',
    ALTERNANCE = 'OFFRE_ALTERNANCE',
    IMMERSION = 'OFFRE_IMMERSION',
    SERVICE_CIVIQUE = 'OFFRE_SERVICE_CIVIQUE'
  }

  export function build<O>(
    idBeneficiaire: string,
    offre: O,
    aPostule: boolean,
    date: DateTime
  ): Favori<O> {
    return {
      idBeneficiaire,
      offre,
      dateCreation: date,
      dateCandidature: aPostule ? date : undefined
    }
  }

  export function postuler<O>(favori: Favori<O>, date: DateTime): Favori<O> {
    return {
      ...favori,
      dateCandidature: date
    }
  }
}

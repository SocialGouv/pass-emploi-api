import * as _PoleEmploi from './pole-emploi'
import { Recherche } from '../recherche'
import { Injectable } from '@nestjs/common'
import { IdService } from '../../../../utils/id-service'
import { DateService } from '../../../../utils/date-service'
import { DateTime } from 'luxon'

export interface Suggestion {
  id: string
  idFonctionnel: string
  idJeune: string
  type: Recherche.Type
  informations: {
    titre: string
    metier: string
    localisation: string
  }
  criteres: Recherche.Emploi
  dateCreation: DateTime
  dateMiseAJour: DateTime
  dateSuppression?: DateTime
  source: Suggestion.Source
}

export const SuggestionsRepositoryToken = 'SuggestionsRepositoryToken'
export const SuggestionsPoleEmploiRepositoryToken =
  'SuggestionsPoleEmploiRepositoryToken'

export namespace Suggestion {
  // FIXME: le linter ne comprend pas cette technique 🤷‍️
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import PoleEmploi = _PoleEmploi.PoleEmploi

  export enum TypeLocalisation {
    DEPARTEMENT = 'DEPARTEMENT',
    COMMUNE = 'COMMUNE'
  }

  export enum Source {
    POLE_EMPLOI = 'POLE_EMPLOI',
    CONSEILLER = 'CONSEILLER'
  }

  export interface Repository {
    findAll(jeuneId: string): Promise<Suggestion[]>

    save(suggestion: Suggestion): Promise<void>

    delete(id: string): Promise<void>
  }

  function construireIdFonctionnel(
    suggestionPoleEmploi: PoleEmploi,
    type: Recherche.Type
  ): string {
    return `${type}-${suggestionPoleEmploi.rome}-${suggestionPoleEmploi.localisation.type}-${suggestionPoleEmploi.localisation.code}-${suggestionPoleEmploi.localisation.rayon}`
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}

    fromPoleEmploi(
      suggestionPoleEmploi: PoleEmploi,
      idJeune: string
    ): Suggestion {
      const maintenant = this.dateService.now()
      return {
        id: this.idService.uuid(),
        idJeune,
        dateCreation: maintenant,
        dateMiseAJour: maintenant,
        idFonctionnel: construireIdFonctionnel(
          suggestionPoleEmploi,
          Recherche.Type.OFFRES_EMPLOI
        ),
        type: Recherche.Type.OFFRES_EMPLOI,
        source: Suggestion.Source.POLE_EMPLOI,
        informations: suggestionPoleEmploi.informations,
        criteres: {
          q: suggestionPoleEmploi.texteRecherche,
          commune:
            suggestionPoleEmploi.localisation.type === TypeLocalisation.COMMUNE
              ? suggestionPoleEmploi.localisation.code
              : undefined,
          departement:
            suggestionPoleEmploi.localisation.type ===
            TypeLocalisation.DEPARTEMENT
              ? suggestionPoleEmploi.localisation.code
              : undefined,
          rayon: suggestionPoleEmploi.localisation.rayon
        }
      }
    }
  }
}

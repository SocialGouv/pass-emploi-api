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
  criteres?: Recherche.Emploi | Recherche.Immersion | Recherche.ServiceCivique
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
    const rayon =
      suggestionPoleEmploi.localisation.rayon ?? Recherche.DISTANCE_PAR_DEFAUT
    // TODO: faire une clé en objet et la mettre en B64
    if (type === Recherche.Type.OFFRES_SERVICES_CIVIQUE) {
      return `${type}-${suggestionPoleEmploi.localisation.type}-${suggestionPoleEmploi.localisation.code}-${rayon}`
    } else {
      return `${type}-${suggestionPoleEmploi.codeRome}-${suggestionPoleEmploi.localisation.type}-${suggestionPoleEmploi.localisation.code}-${rayon}`
    }
  }

  function construireTitreEtMetierSuggestion(
    suggestionPoleEmploi: Suggestion.PoleEmploi,
    type: Recherche.Type
  ): { titre: string; metier: string } {
    switch (type) {
      case Recherche.Type.OFFRES_EMPLOI:
      case Recherche.Type.OFFRES_ALTERNANCE:
      case Recherche.Type.OFFRES_IMMERSION:
        return {
          titre: suggestionPoleEmploi.titreMetier!,
          metier: suggestionPoleEmploi.categorieMetier!
        }
      case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
        return {
          titre:
            suggestionPoleEmploi.titreMetier ??
            `Recherche de service civique à ${suggestionPoleEmploi.localisation.libelle}`,
          metier:
            suggestionPoleEmploi.categorieMetier ??
            `Service civique à ${suggestionPoleEmploi.localisation.libelle}`
        }
    }
  }

  function construireLesCriteres(
    suggestionPoleEmploi: Suggestion.PoleEmploi,
    type: Recherche.Type
  ): Recherche.Emploi | Recherche.Immersion | Recherche.ServiceCivique {
    switch (type) {
      case Recherche.Type.OFFRES_EMPLOI:
      case Recherche.Type.OFFRES_ALTERNANCE:
        return {
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
          rayon:
            suggestionPoleEmploi.localisation.rayon ??
            Recherche.DISTANCE_PAR_DEFAUT
        }
      case Recherche.Type.OFFRES_IMMERSION:
        return {
          rome: suggestionPoleEmploi.codeRome,
          lat: suggestionPoleEmploi.localisation.lat,
          lon: suggestionPoleEmploi.localisation.lon,
          distance:
            suggestionPoleEmploi.localisation.rayon ??
            Recherche.DISTANCE_PAR_DEFAUT
        }
      case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
        return {
          lat: suggestionPoleEmploi.localisation.lat,
          lon: suggestionPoleEmploi.localisation.lon,
          domaine: suggestionPoleEmploi.categorieMetier,
          distance:
            suggestionPoleEmploi.localisation.rayon ??
            Recherche.DISTANCE_PAR_DEFAUT
        }
    }
  }

  function suggestionAvecCommuneLatLon(
    suggestionPoleEmploi: Suggestion.PoleEmploi
  ): boolean {
    return Boolean(
      suggestionPoleEmploi.localisation.type === 'COMMUNE' &&
        suggestionPoleEmploi.localisation.lat &&
        suggestionPoleEmploi.localisation.lon
    )
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}

    buildListeSuggestionsOffresFromPoleEmploi(
      suggestionsPoleEmploi: PoleEmploi[],
      idJeune: string
    ): Suggestion[] {
      const maintenant = this.dateService.now()
      const suggestionsEmploi = []
      const suggestionsImmersion = []
      const suggestionsServiceCivique = []

      for (const suggestionPoleEmploi of suggestionsPoleEmploi) {
        if (suggestionPoleEmploi.codeRome) {
          suggestionsEmploi.push(
            this.creerSuggestion(
              suggestionPoleEmploi,
              Recherche.Type.OFFRES_EMPLOI,
              idJeune,
              maintenant
            )
          )
          if (suggestionAvecCommuneLatLon(suggestionPoleEmploi)) {
            suggestionsImmersion.push(
              this.creerSuggestion(
                suggestionPoleEmploi,
                Recherche.Type.OFFRES_IMMERSION,
                idJeune,
                maintenant
              )
            )
          }
        }

        if (suggestionAvecCommuneLatLon(suggestionPoleEmploi)) {
          suggestionsServiceCivique.push(
            this.creerSuggestion(
              suggestionPoleEmploi,
              Recherche.Type.OFFRES_SERVICES_CIVIQUE,
              idJeune,
              maintenant
            )
          )
        }
      }

      return [
        ...suggestionsEmploi,
        ...suggestionsImmersion,
        ...suggestionsServiceCivique
      ]
    }

    private creerSuggestion(
      suggestionPoleEmploi: PoleEmploi,
      type: Recherche.Type,
      idJeune: string,
      maintenant: DateTime
    ): Suggestion {
      return {
        id: this.idService.uuid(),
        idJeune,
        dateCreation: maintenant,
        dateMiseAJour: maintenant,
        idFonctionnel: construireIdFonctionnel(suggestionPoleEmploi, type),
        type: type,
        source: Suggestion.Source.POLE_EMPLOI,
        informations: {
          ...construireTitreEtMetierSuggestion(suggestionPoleEmploi, type),
          localisation: suggestionPoleEmploi.localisation.libelle
        },
        criteres: construireLesCriteres(suggestionPoleEmploi, type)
      }
    }
  }
}

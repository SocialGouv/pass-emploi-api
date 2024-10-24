import { Injectable } from '@nestjs/common'
import { DateTime } from 'luxon'
import { DateService } from '../../../../utils/date-service'
import { IdService } from '../../../../utils/id-service'
import { Recherche } from '../recherche'
import * as _PoleEmploi from './pole-emploi'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as isEqual from 'lodash.isequal'
import { MauvaiseCommandeError } from '../../../../building-blocks/types/domain-error'
import {
  failure,
  Result,
  success
} from '../../../../building-blocks/types/result'
import { aAccesAuxAlternancesEtServicesCiviques, Core } from '../../../core'
import { Diagoriente } from './diagoriente'
import { DiagorienteInformationsPayload } from 'src/infrastructure/routes/validation/suggestions-inputs'

type CriteresSuggestion =
  | Recherche.Emploi
  | Recherche.Immersion
  | Recherche.ServiceCivique

export interface Suggestion {
  id: string
  idFonctionnel?: Suggestion.IdFonctionnel
  idJeune: string
  type: Recherche.Type
  informations: {
    titre: string
    metier?: string
    localisation?: string
  }
  criteres?: CriteresSuggestion
  dateCreation: DateTime
  dateRafraichissement: DateTime
  source: Suggestion.Source
  dateCreationRecherche?: DateTime
  idRecherche?: string
  dateRefus?: DateTime
}

export const SuggestionsRepositoryToken = 'SuggestionsRepositoryToken'
export const SuggestionsPoleEmploiRepositoryToken =
  'SuggestionsPoleEmploiRepositoryToken'

export namespace Suggestion {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  export import PoleEmploi = _PoleEmploi.PoleEmploi

  export interface Acceptee extends Suggestion {
    dateCreationRecherche: DateTime
    idRecherche: string
  }

  export interface Refusee extends Suggestion {
    dateRefus: DateTime
  }

  export enum TypeLocalisation {
    DEPARTEMENT = 'DEPARTEMENT',
    COMMUNE = 'COMMUNE'
  }

  export enum Source {
    POLE_EMPLOI = 'POLE_EMPLOI',
    CONSEILLER = 'CONSEILLER',
    DIAGORIENTE = 'DIAGORIENTE'
  }

  export interface IdFonctionnel {
    typeRecherche: Recherche.Type
    libelle?: string | null
    codeRome: string | null
    typeLocalisation?: Suggestion.TypeLocalisation
    codeLocalisation?: string
    rayon: number
  }

  export interface Repository {
    findAll(jeuneId: string): Promise<Suggestion[]>

    get(idSuggestion: string): Promise<Suggestion | undefined>

    save(suggestion: Suggestion): Promise<void>

    delete(id: string): Promise<void>
  }

  export function sontEquivalentes(
    suggestion1: Suggestion,
    suggestion2: Suggestion
  ): boolean {
    return isEqual(suggestion1.idFonctionnel, suggestion2.idFonctionnel)
  }

  export function estTraitee(suggestion: Suggestion): boolean {
    return Boolean(suggestion.dateCreationRecherche || suggestion.dateRefus)
  }

  export function estAcceptee(suggestion: Suggestion): boolean {
    return Boolean(suggestion.dateCreationRecherche)
  }

  export function estRefusee(suggestion: Suggestion): boolean {
    return Boolean(suggestion.dateRefus)
  }

  @Injectable()
  export class Factory {
    constructor(
      private idService: IdService,
      private dateService: DateService
    ) {}

    buildListeSuggestionsOffresFromDiagoriente(
      suggestionsDiagoriente: Diagoriente[],
      idJeune: string
    ): Suggestion[] {
      const maintenant = this.dateService.now()
      const suggestions = suggestionsDiagoriente.map(suggestion => {
        return [
          this.creerSuggestionDiagoriente(
            suggestion,
            Recherche.Type.OFFRES_EMPLOI,
            idJeune,
            maintenant
          ),
          this.creerSuggestionDiagoriente(
            suggestion,
            Recherche.Type.OFFRES_IMMERSION,
            idJeune,
            maintenant
          )
        ]
      })
      return suggestions.flat()
    }

    private creerSuggestionDiagoriente(
      suggestionDiagoriente: Diagoriente,
      type: Recherche.Type,
      idJeune: string,
      maintenant: DateTime
    ): Suggestion {
      return {
        id: this.idService.uuid(),
        idJeune,
        dateCreation: maintenant,
        dateRafraichissement: maintenant,
        idFonctionnel: this.construireIdFonctionnelDiagoriente(
          suggestionDiagoriente,
          type
        ),
        type: type,
        source: Suggestion.Source.DIAGORIENTE,
        informations: {
          titre: suggestionDiagoriente.tag.title,
          metier: suggestionDiagoriente.tag.title
        },
        criteres: undefined
      }
    }

    private construireIdFonctionnelDiagoriente(
      suggestion: Diagoriente,
      type: Recherche.Type
    ): Suggestion.IdFonctionnel {
      return {
        typeRecherche: type,
        codeRome: suggestion.tag.code,
        rayon: Recherche.DISTANCE_PAR_DEFAUT,
        libelle: suggestion.tag.title
      }
    }

    buildListeSuggestionsOffresFromPoleEmploi(
      suggestionsPoleEmploi: PoleEmploi[],
      idJeune: string,
      structureDuJeune: Core.Structure
    ): Suggestion[] {
      const maintenant = this.dateService.now()
      const suggestionsEmploi = suggestionsPoleEmploi
        .filter(this.estUneSuggestionEmploi)
        .map(suggestionPoleEmploi =>
          this.creerSuggestionPoleEmploi(
            suggestionPoleEmploi,
            Recherche.Type.OFFRES_EMPLOI,
            idJeune,
            maintenant
          )
        )
      const suggestionsImmersion = suggestionsPoleEmploi
        .filter(this.estUneSuggestionImmersion.bind(this))
        .map(suggestionPoleEmploi =>
          this.creerSuggestionPoleEmploi(
            suggestionPoleEmploi,
            Recherche.Type.OFFRES_IMMERSION,
            idJeune,
            maintenant
          )
        )
      const suggestionsServiceCivique = aAccesAuxAlternancesEtServicesCiviques(
        structureDuJeune
      )
        ? suggestionsPoleEmploi
            .filter(this.estUneSuggestionServiceCivique.bind(this))
            .map(suggestionPoleEmploi =>
              this.creerSuggestionPoleEmploi(
                suggestionPoleEmploi,
                Recherche.Type.OFFRES_SERVICES_CIVIQUE,
                idJeune,
                maintenant
              )
            )
        : []

      return [
        ...suggestionsEmploi,
        ...suggestionsImmersion,
        ...suggestionsServiceCivique
      ]
    }

    accepter(suggestion: Suggestion): Result<Acceptee> {
      if (estTraitee(suggestion)) {
        return failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
      }
      return success({
        ...suggestion,
        dateCreationRecherche: this.dateService.now(),
        idRecherche: this.idService.uuid()
      })
    }

    refuser(suggestion: Suggestion): Result<Refusee> {
      if (estTraitee(suggestion)) {
        return failure(new MauvaiseCommandeError('Suggestion déjà traitée'))
      }
      return success({
        ...suggestion,
        dateRefus: this.dateService.now()
      })
    }

    creerSuggestionConseiller(
      type: Recherche.Type,
      idJeune: string,
      criteres:
        | Recherche.Emploi
        | Recherche.Immersion
        | Recherche.ServiceCivique,
      localisation: string,
      titre?: string,
      metier?: string
    ): Suggestion {
      const metierConstruit =
        metier ??
        (criteres as Recherche.Emploi).q ??
        this.construireMetierSuggestionConseiller(type)

      return {
        id: this.idService.uuid(),
        idJeune,
        idFonctionnel: undefined,
        dateCreation: this.dateService.now(),
        dateRafraichissement: this.dateService.now(),
        type: type,
        source: Suggestion.Source.CONSEILLER,
        informations: {
          titre: titre ?? `${metierConstruit} à ${localisation}`,
          metier: metierConstruit,
          localisation
        },
        criteres
      }
    }

    private creerSuggestionPoleEmploi(
      suggestion: PoleEmploi,
      type: Recherche.Type,
      idJeune: string,
      maintenant: DateTime
    ): Suggestion {
      return {
        id: this.idService.uuid(),
        idJeune,
        dateCreation: maintenant,
        dateRafraichissement: maintenant,
        idFonctionnel: this.construireIdFonctionnelPoleEmploi(suggestion, type),
        type: type,
        source: Suggestion.Source.POLE_EMPLOI,
        informations: {
          ...this.construireTitreEtMetierSuggestionPoleEmploi(suggestion, type),
          localisation: suggestion.localisation.libelle
        },
        criteres: this.construireCriteresSuggestionsPoleEmploi(suggestion, type)
      }
    }

    private construireIdFonctionnelPoleEmploi(
      suggestionPoleEmploi: PoleEmploi,
      type: Recherche.Type
    ): Suggestion.IdFonctionnel {
      const codeRome = suggestionPoleEmploi.codeRome ?? null
      return {
        typeRecherche: type,
        typeLocalisation: suggestionPoleEmploi.localisation.type,
        codeLocalisation: suggestionPoleEmploi.localisation.code,
        codeRome:
          type !== Recherche.Type.OFFRES_SERVICES_CIVIQUE ? codeRome : null,
        rayon:
          suggestionPoleEmploi.localisation.rayon ??
          Recherche.DISTANCE_PAR_DEFAUT
      }
    }

    private construireTitreEtMetierSuggestionPoleEmploi(
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

    private construireMetierSuggestionConseiller(type: Recherche.Type): string {
      switch (type) {
        case Recherche.Type.OFFRES_EMPLOI:
        case Recherche.Type.OFFRES_ALTERNANCE:
          return "Recherche d'offre d'emploi"
        case Recherche.Type.OFFRES_IMMERSION:
          return "Recherche d'immersion"
        case Recherche.Type.OFFRES_SERVICES_CIVIQUE:
          return 'Recherche de service civique'
      }
    }

    construireCriteresSuggestionsDiagoriente(
      suggestionDiagoriente: Suggestion,
      locationDiagoriente: DiagorienteInformationsPayload
    ): Recherche.Emploi | Recherche.Immersion {
      if (suggestionDiagoriente.type === Recherche.Type.OFFRES_EMPLOI) {
        return {
          q: suggestionDiagoriente.informations.titre,
          commune:
            locationDiagoriente.location.type === TypeLocalisation.COMMUNE
              ? locationDiagoriente.location.code
              : undefined,
          departement:
            locationDiagoriente.location.type === TypeLocalisation.DEPARTEMENT
              ? locationDiagoriente.location.code
              : undefined,
          rayon: locationDiagoriente.rayon ?? Recherche.DISTANCE_PAR_DEFAUT
        }
      } else if (
        suggestionDiagoriente.type === Recherche.Type.OFFRES_IMMERSION
      ) {
        return {
          rome: suggestionDiagoriente.idFonctionnel!.codeRome!,
          lat: locationDiagoriente.location.latitude!,
          lon: locationDiagoriente.location.longitude!,
          distance: locationDiagoriente.rayon ?? Recherche.DISTANCE_PAR_DEFAUT
        }
      }
      throw new Error('Type de recherche non traité')
    }

    private construireCriteresSuggestionsPoleEmploi(
      suggestionPoleEmploi: Suggestion.PoleEmploi,
      type: Recherche.Type
    ): CriteresSuggestion {
      switch (type) {
        case Recherche.Type.OFFRES_EMPLOI:
        case Recherche.Type.OFFRES_ALTERNANCE:
          return {
            q: suggestionPoleEmploi.texteRecherche,
            commune:
              suggestionPoleEmploi.localisation.type ===
              TypeLocalisation.COMMUNE
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

    private estUneSuggestionEmploi(suggestionPoleEmploi: PoleEmploi): boolean {
      return Boolean(suggestionPoleEmploi.codeRome)
    }

    private estUneSuggestionImmersion(
      suggestionPoleEmploi: PoleEmploi
    ): boolean {
      return Boolean(
        suggestionPoleEmploi.codeRome &&
          this.suggestionAvecCommuneLatLon(suggestionPoleEmploi)
      )
    }

    private estUneSuggestionServiceCivique(
      suggestionPoleEmploi: PoleEmploi
    ): boolean {
      return Boolean(this.suggestionAvecCommuneLatLon(suggestionPoleEmploi))
    }

    private suggestionAvecCommuneLatLon(
      suggestionPoleEmploi: Suggestion.PoleEmploi
    ): boolean {
      return Boolean(
        suggestionPoleEmploi.localisation.type === 'COMMUNE' &&
          suggestionPoleEmploi.localisation.lat &&
          suggestionPoleEmploi.localisation.lon
      )
    }
  }
}

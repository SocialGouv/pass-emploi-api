import { Inject, Injectable } from '@nestjs/common'
import {
  Result,
  isFailure,
  success
} from '../../../../../building-blocks/types/result'
import { Suggestion } from '../../../../../domain/offre/recherche/suggestion/suggestion'
import { CommuneSqlModel } from '../../../../../infrastructure/sequelize/models/commune.sql-model'
import { SuggestionDto } from '../../../../clients/dto/pole-emploi.dto'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from '../../../../clients/pole-emploi-partenaire-client.db'

const CODE_TYPE_LIEU_DEPARTEMENT = '4'
const CODE_TYPE_LIEU_COMMUNE = '5'
const CODE_UNITE_RAYON_KM = 'KM'

@Injectable()
export class SuggestionPeHttpRepository
  implements Suggestion.PoleEmploi.Repository
{
  constructor(
    @Inject(PoleEmploiPartenaireClientToken)
    private client: PoleEmploiPartenaireClient
  ) {}

  async findAll(token: string): Promise<Result<Suggestion.PoleEmploi[]>> {
    const suggestionsDtoResult = await this.client.getSuggestionsRecherches(
      token
    )

    if (isFailure(suggestionsDtoResult)) {
      return suggestionsDtoResult
    }

    const suggestions: Suggestion.PoleEmploi[] = []

    for (const suggestionDto of suggestionsDtoResult.data) {
      if (laSuggestionAUneLocalisation(suggestionDto))
        if (laSuggestionAUneCommune(suggestionDto)) {
          const suggestion = toSuggestionPoleEmploi(suggestionDto)

          const codeCommune = suggestionDto.mobilites![0].lieu.code
          const commune = await CommuneSqlModel.findOne({
            where: {
              code: codeCommune
            }
          })
          suggestion.localisation.lat = Number(commune?.latitude)
          suggestion.localisation.lon = Number(commune?.longitude)
          suggestions.push(suggestion)
        } else if (laSuggestionAUnDepartement(suggestionDto)) {
          suggestions.push(toSuggestionPoleEmploi(suggestionDto))
        }
    }

    return success(suggestions)
  }
}

function laSuggestionAUneLocalisation(suggestion: SuggestionDto): boolean {
  return Boolean(
    suggestion.mobilites?.length && suggestion.mobilites[0]?.lieu?.libelle
  )
}
function laSuggestionAUneCommune(suggestion: SuggestionDto): boolean {
  return Boolean(
    suggestion.mobilites?.length &&
      suggestion.mobilites[0].lieu.type.code === CODE_TYPE_LIEU_COMMUNE
  )
}
function laSuggestionAUnDepartement(suggestion: SuggestionDto): boolean {
  return Boolean(
    suggestion.mobilites?.length &&
      suggestion.mobilites[0].lieu.type.code === CODE_TYPE_LIEU_DEPARTEMENT
  )
}

function toSuggestionPoleEmploi(
  suggestion: SuggestionDto
): Suggestion.PoleEmploi {
  return {
    titreMetier: suggestion.appellation?.libelle,
    categorieMetier: suggestion.rome?.libelle,
    codeRome: suggestion.rome?.code,
    texteRecherche: suggestion.appellation?.libelle || suggestion.rome?.libelle,
    localisation: {
      libelle: suggestion.mobilites![0].lieu.libelle,
      code: suggestion.mobilites![0].lieu.code,
      type:
        suggestion.mobilites![0].lieu.type.code === CODE_TYPE_LIEU_COMMUNE
          ? Suggestion.TypeLocalisation.COMMUNE
          : Suggestion.TypeLocalisation.DEPARTEMENT,
      rayon:
        suggestion.mobilites![0].unite?.code == CODE_UNITE_RAYON_KM
          ? suggestion.mobilites![0].rayon
          : undefined
    }
  }
}

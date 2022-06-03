import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { TypesDemarcheQueryModel } from './query-models/types-demarche.query-model'
import { Authentification } from '../../domain/authentification'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { Core } from '../../domain/core'
import { ForbiddenException, Injectable } from '@nestjs/common'

export interface RechercherDemarcheQuery extends Query {
  recherche: string
}

@Injectable()
export class RechercherTypesDemarcheQueryHandler extends QueryHandler<
  RechercherDemarcheQuery,
  TypesDemarcheQueryModel[]
> {
  constructor(private poleEmploiClient: PoleEmploiClient) {
    super('RechercherTypesDemarcheQueryHandler')
  }

  async authorize(
    _query: RechercherDemarcheQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<void> {
    if (
      utilisateur.type === Authentification.Type.JEUNE &&
      utilisateur.structure === Core.Structure.POLE_EMPLOI
    ) {
      return
    }
    throw new ForbiddenException()
  }

  async handle(
    query: RechercherDemarcheQuery
  ): Promise<TypesDemarcheQueryModel[]> {
    const demarchesDto = await this.poleEmploiClient.rechercherTypesDemarches(
      query.recherche
    )

    const typesDemarcheQueryModels: TypesDemarcheQueryModel[] = []

    for (const demarcheDto of demarchesDto) {
      const quoiPourquoi = typesDemarcheQueryModels.find(
        typeDemarche =>
          typeDemarche.codeQuoi === demarcheDto.codeQuoiTypeDemarche &&
          typeDemarche.codePourquoi === demarcheDto.codePourQuoiObjectifDemarche
      )
      if (quoiPourquoi) {
        if (
          demarcheDto.codeCommentDemarche &&
          demarcheDto.libelleCommentDemarche
        ) {
          quoiPourquoi.comment.push({
            code: demarcheDto.codeCommentDemarche,
            label: demarcheDto.libelleCommentDemarche
          })
        } else {
          quoiPourquoi.commentObligatoire = false
        }
      } else {
        const typesDemarcheQueryModel: TypesDemarcheQueryModel = {
          codeQuoi: demarcheDto.codeQuoiTypeDemarche,
          codePourquoi: demarcheDto.codePourQuoiObjectifDemarche,
          libelleQuoi: demarcheDto.libelleQuoiTypeDemarche,
          libellePourquoi: demarcheDto.libellePourQuoiObjectifDemarche,
          commentObligatoire: true,
          comment: []
        }
        if (
          demarcheDto.codeCommentDemarche &&
          demarcheDto.libelleCommentDemarche
        ) {
          typesDemarcheQueryModel.comment.push({
            code: demarcheDto.codeCommentDemarche,
            label: demarcheDto.libelleCommentDemarche
          })
        } else {
          typesDemarcheQueryModel.commentObligatoire = false
        }
        typesDemarcheQueryModels.push(typesDemarcheQueryModel)
      }
    }
    return typesDemarcheQueryModels
  }

  async monitor(): Promise<void> {
    return
  }
}

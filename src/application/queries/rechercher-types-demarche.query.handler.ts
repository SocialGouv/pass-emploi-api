import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { TypesDemarcheQueryModel } from './query-models/types-demarche.query-model'
import { Authentification } from '../../domain/authentification'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { Core } from '../../domain/core'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { TypeDemarcheDto } from '../../infrastructure/clients/dto/pole-emploi.dto'

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
      const quoiPourquoi = this.trouverLAggregationQuoiPourquoi(
        typesDemarcheQueryModels,
        demarcheDto
      )
      if (quoiPourquoi) {
        this.ajouterUnCommentAuQuoiPourquoi(demarcheDto, quoiPourquoi)
      } else {
        this.ajouterUnQuoiPourquoi(demarcheDto, typesDemarcheQueryModels)
      }
    }
    return typesDemarcheQueryModels
  }

  private trouverLAggregationQuoiPourquoi(
    typesDemarcheQueryModels: TypesDemarcheQueryModel[],
    demarcheDto: TypeDemarcheDto
  ): TypesDemarcheQueryModel | undefined {
    return typesDemarcheQueryModels.find(
      typeDemarche =>
        typeDemarche.codeQuoi === demarcheDto.codeQuoiTypeDemarche &&
        typeDemarche.codePourquoi === demarcheDto.codePourQuoiObjectifDemarche
    )
  }

  private ajouterUnQuoiPourquoi(
    demarcheDto: TypeDemarcheDto,
    typesDemarcheQueryModels: TypesDemarcheQueryModel[]
  ): void {
    const typesDemarcheQueryModel: TypesDemarcheQueryModel = {
      codeQuoi: demarcheDto.codeQuoiTypeDemarche,
      codePourquoi: demarcheDto.codePourQuoiObjectifDemarche,
      libelleQuoi: demarcheDto.libelleQuoiTypeDemarche,
      libellePourquoi: demarcheDto.libellePourQuoiObjectifDemarche,
      commentObligatoire: true,
      comment: []
    }
    if (demarcheDto.codeCommentDemarche && demarcheDto.libelleCommentDemarche) {
      typesDemarcheQueryModel.comment.push({
        code: demarcheDto.codeCommentDemarche,
        label: demarcheDto.libelleCommentDemarche
      })
    } else {
      typesDemarcheQueryModel.commentObligatoire = false
    }
    typesDemarcheQueryModels.push(typesDemarcheQueryModel)
  }

  private ajouterUnCommentAuQuoiPourquoi(
    demarcheDto: TypeDemarcheDto,
    quoiPourquoi: TypesDemarcheQueryModel
  ): void {
    if (demarcheDto.codeCommentDemarche && demarcheDto.libelleCommentDemarche) {
      quoiPourquoi.comment.push({
        code: demarcheDto.codeCommentDemarche,
        label: demarcheDto.libelleCommentDemarche
      })
    } else {
      quoiPourquoi.commentObligatoire = false
    }
  }

  async monitor(): Promise<void> {
    return
  }
}

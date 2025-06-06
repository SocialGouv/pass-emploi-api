import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { beneficiaireEstFTConnect } from '../../domain/core'
import { TypeDemarcheDto } from '../../infrastructure/clients/dto/pole-emploi.dto'
import { PoleEmploiClient } from '../../infrastructure/clients/pole-emploi-client'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { TypesDemarcheQueryModel } from './query-models/types-demarche.query-model'

export interface RechercherDemarcheQuery extends Query {
  recherche: string
}

@Injectable()
export class RechercherTypesDemarcheQueryHandler extends QueryHandler<
  RechercherDemarcheQuery,
  TypesDemarcheQueryModel[]
> {
  constructor(
    private poleEmploiClient: PoleEmploiClient,
    private readonly jeuneAuthorizer: JeuneAuthorizer
  ) {
    super('RechercherTypesDemarcheQueryHandler')
  }

  async authorize(
    _query: RechercherDemarcheQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      utilisateur.id,
      utilisateur,
      beneficiaireEstFTConnect(utilisateur.structure)
    )
  }

  async handle(
    query: RechercherDemarcheQuery
  ): Promise<TypesDemarcheQueryModel[]> {
    const demarchesDto = await this.poleEmploiClient.rechercherTypesDemarches(
      query.recherche
    )
    this.logger.log(
      'nombre de démarches envoyées par PE : ' +
        demarchesDto.length +
        '-' +
        'nombre de démarches visibles : ' +
        demarchesDto.length
    )

    const typesDemarcheQueryModels: TypesDemarcheQueryModel[] = []
    for (const demarcheDtoVisible of demarchesDto) {
      const quoiPourquoi = this.trouverLAggregationQuoiPourquoi(
        typesDemarcheQueryModels,
        demarcheDtoVisible
      )
      if (quoiPourquoi) {
        this.ajouterUnCommentAuQuoiPourquoi(demarcheDtoVisible, quoiPourquoi)
      } else {
        this.ajouterUnQuoiPourquoi(demarcheDtoVisible, typesDemarcheQueryModels)
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

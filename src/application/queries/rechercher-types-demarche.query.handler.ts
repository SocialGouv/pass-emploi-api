import { Injectable } from '@nestjs/common'
import { Query } from '../../building-blocks/types/query'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core } from '../../domain/core'
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
      Core.structuresPoleEmploiBRSA
    )
  }

  async handle(
    query: RechercherDemarcheQuery
  ): Promise<TypesDemarcheQueryModel[]> {
    const demarchesDto = await this.poleEmploiClient.rechercherTypesDemarches(
      query.recherche
    )
    const demarchesDtoVisibles = demarchesDto.filter(this.laDemarcheEstVisible)
    this.logger.log(
      'nombre de démarches envoyées par PE : ' +
        demarchesDto.length +
        '-' +
        'nombre de démarches visibles : ' +
        demarchesDtoVisibles.length
    )

    const typesDemarcheQueryModels: TypesDemarcheQueryModel[] = []
    for (const demarcheDtoVisible of demarchesDtoVisibles) {
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

  private laDemarcheEstVisible(demarcheDto: TypeDemarcheDto): boolean {
    const codeCommentDemarchesCachees = new Set([
      'C01.01',
      'C01.02',
      'C02.01',
      'C02.02',
      'C03.02',
      'C06.01',
      'C06.02',
      'C37.01',
      'C37.02',
      'C40.01',
      'C11.01',
      'C11.04',
      'C12.01',
      'C12.05',
      'C17.01',
      'C17.02',
      'C18.05',
      'C19.02',
      'C22.01',
      'C22.02',
      'C35.04',
      'C39.01',
      'C39.02',
      'C39.03'
    ])
    const codeQuoiDemarchesCachees = new Set(['Q36', 'Q41'])

    return (
      !codeQuoiDemarchesCachees.has(demarcheDto.codeQuoiTypeDemarche) &&
      (demarcheDto.codeCommentDemarche
        ? !codeCommentDemarchesCachees.has(demarcheDto.codeCommentDemarche)
        : true)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

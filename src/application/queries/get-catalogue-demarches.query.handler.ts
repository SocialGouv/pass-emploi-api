import { Inject, Injectable } from '@nestjs/common'
import { Query } from 'src/building-blocks/types/query'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from 'src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { buildError } from 'src/utils/logger.module'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core, beneficiaireEstFTConnect } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { ThematiqueQueryModel } from './query-models/catalogue.query-model'

import {
  codeCommentDemarchesCachees,
  codeQuoiDemarchesCachees
} from 'src/infrastructure/clients/utils/demarche-liste-visible'
import { TypesDemarcheQueryModel } from './query-models/types-demarche.query-model'

export interface GetCatalogueDemarchesQuery extends Query {
  accessToken: string
  structure: Core.Structure
}

@Injectable()
export class GetCatalogueDemarchesQueryHandler extends QueryHandler<
  GetCatalogueDemarchesQuery,
  ThematiqueQueryModel[]
> {
  constructor(
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private oidcClient: OidcClient
  ) {
    super('GetCatalogueQueryHandler')
  }

  async handle(
    query: GetCatalogueDemarchesQuery
  ): Promise<ThematiqueQueryModel[]> {
    const idpToken = await this.oidcClient.exchangeTokenJeune(
      query.accessToken,
      query.structure
    )
    const catalogueResult = await this.poleEmploiPartenaireClient.getCatalogue(
      idpToken
    )

    if (isFailure(catalogueResult)) {
      this.logger.error(
        buildError(
          `Impossible de récupérer le catalogue de démarches depuis PE`,
          Error(catalogueResult.error.message)
        )
      )
      return []
    }

    return catalogueResult.data.map(pourquoi => {
      const codePourquoi = pourquoi.code
      const libellePourquoi = pourquoi.libelle
      const listeDemarches: TypesDemarcheQueryModel[] = []
      pourquoi.typesDemarcheRetourEmploi.forEach(quoi => {
        if (!codeQuoiDemarchesCachees.has(quoi.code)) {
          const listeDemarchesVisible = quoi.moyensRetourEmploi.filter(
            comment =>
              !codeCommentDemarchesCachees.has(comment.code) &&
              comment.droitCreation
          )
          if (listeDemarchesVisible.length > 0) {
            listeDemarches.push({
              codePourquoi,
              libellePourquoi,
              codeQuoi: quoi.code,
              libelleQuoi: quoi.libelle,
              commentObligatoire: quoi.moyensRetourEmploi.length > 0,
              comment: listeDemarchesVisible.map(comment => {
                return {
                  code: comment.code,
                  label: comment.libelle
                }
              })
            })
          }
        }
      })

      return {
        code: codePourquoi,
        libelle: libellePourquoi,
        demarches: listeDemarches
      }
    })
  }

  async authorize(
    _query: GetCatalogueDemarchesQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      utilisateur.id,
      utilisateur,
      beneficiaireEstFTConnect(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

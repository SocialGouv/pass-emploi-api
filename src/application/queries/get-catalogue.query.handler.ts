import { Inject, Injectable } from '@nestjs/common'
import { QueryHandler } from '../../building-blocks/types/query-handler'
import { Result, isFailure } from '../../building-blocks/types/result'
import { Authentification } from '../../domain/authentification'
import { Core, estPoleEmploiBRSA } from '../../domain/core'
import { JeuneAuthorizer } from '../authorizers/jeune-authorizer'
import { ThematiqueQueryModel } from './query-models/catalogue.query-model'
import { Query } from 'src/building-blocks/types/query'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import {
  PoleEmploiPartenaireClient,
  PoleEmploiPartenaireClientToken
} from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { buildError } from 'src/utils/logger.module'

export interface GetCatalogueQuery extends Query {
  accessToken: string
  structure: Core.Structure
}

@Injectable()
export class GetCatalogueQueryHandler extends QueryHandler<
  GetCatalogueQuery,
  ThematiqueQueryModel[]
> {
  constructor(
    @Inject(PoleEmploiPartenaireClientToken)
    private poleEmploiPartenaireClient: PoleEmploiPartenaireClient,
    private readonly jeuneAuthorizer: JeuneAuthorizer,
    private keycloakClient: KeycloakClient
  ) {
    super('GetCatalogueQueryHandler')
  }

  async handle(query: GetCatalogueQuery): Promise<ThematiqueQueryModel[]> {
    const idpToken = await this.keycloakClient.exchangeTokenJeune(
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
      return {
        code: codePourquoi,
        libelle: libellePourquoi,
        demarches: pourquoi.typesDemarcheRetourEmploi.map(quoi => {
          return {
            codePourquoi,
            libellePourquoi,
            codeQuoi: quoi.code,
            libelleQuoi: quoi.libelle,
            commentObligatoire: true,
            comment: quoi.moyensRetourEmploi.map(comment => {
              return {
                code: comment.code,
                label: comment.libelle
              }
            })
          }
        })
      }
    })
  }

  async authorize(
    _query: GetCatalogueQuery,
    utilisateur: Authentification.Utilisateur
  ): Promise<Result> {
    return this.jeuneAuthorizer.autoriserLeJeune(
      utilisateur.id,
      utilisateur,
      estPoleEmploiBRSA(utilisateur.structure)
    )
  }

  async monitor(): Promise<void> {
    return
  }
}

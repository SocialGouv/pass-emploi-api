import {
  GetCVPoleEmploiQuery,
  GetCVPoleEmploiQueryHandler
} from '../../../src/application/queries/get-cv-pole-emploi.query.handler'
import { expect, StubbedClass, stubClass } from '../../utils'
import { CVPoleEmploiQueryModel } from '../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { DocumentPoleEmploiDto } from '../../../src/infrastructure/clients/dto/pole-emploi.dto'
import { PoleEmploiPartenaireClient } from '../../../src/infrastructure/clients/pole-emploi-partenaire-client'
import { success } from '../../../src/building-blocks/types/result'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { failureApi } from '../../../src/building-blocks/types/result-api'

describe('GetCVPoleEmploiQueryHandler', () => {
  let getCVPoleEmploiQueryHandler: GetCVPoleEmploiQueryHandler
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let keycloakClient: StubbedClass<KeycloakClient>

  let query: GetCVPoleEmploiQuery

  beforeEach(async () => {
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    keycloakClient = stubClass(KeycloakClient)

    getCVPoleEmploiQueryHandler = new GetCVPoleEmploiQueryHandler(
      poleEmploiPartenaireClient,
      keycloakClient
    )

    query = {
      idJeune: 'un-id-jeune',
      accessToken: 'bearer coucou'
    }
  })

  describe('handle', () => {
    describe('quand le client répond avec succès', () => {
      it('récupère le token et retourne la liste des CV du jeune', async () => {
        // Given
        const unCVPoleEmploiDto: DocumentPoleEmploiDto = {
          titre: 'un-titre-cv',
          nomFichier: 'un-nom-cv.pdf',
          format: 'DOCUMENT',
          url: 'un-url-cv',
          type: {
            libelle: 'CV',
            code: 'CV'
          }
        }
        const uneLMPoleEmploiDto: DocumentPoleEmploiDto = {
          titre: 'un-titre-lm',
          nomFichier: 'un-nom-fichier.pdf',
          format: 'DOCUMENT',
          url: 'un-url-lm',
          type: {
            libelle: 'Lettre de motivation',
            code: 'LM'
          }
        }
        const unCVQueryModel: CVPoleEmploiQueryModel = {
          titre: unCVPoleEmploiDto.titre,
          url: unCVPoleEmploiDto.url
        }

        keycloakClient.exchangeTokenPoleEmploiJeune
          .withArgs(query.accessToken)
          .resolves('un-idp-token')
        poleEmploiPartenaireClient.getDocuments
          .withArgs('un-idp-token')
          .resolves(success([unCVPoleEmploiDto, uneLMPoleEmploiDto]))

        // When
        const result = await getCVPoleEmploiQueryHandler.handle(query)

        // Then
        expect(result._isSuccess && result.data).to.deep.equal([unCVQueryModel])
      })
    })
    describe('quand une erreur client se produit', () => {
      it('renvoie une Failure', async () => {
        // Given
        keycloakClient.exchangeTokenPoleEmploiJeune.resolves('un-idp-token')
        poleEmploiPartenaireClient.getDocuments.resolves(
          failureApi(new ErreurHttp('erreur', 400))
        )

        // When
        const result = await getCVPoleEmploiQueryHandler.handle(query)

        // Then
        expect(!result._isSuccess && result.error).to.be.an.instanceOf(
          ErreurHttp
        )
      })
    })
  })
})

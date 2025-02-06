import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'

import { Core, estPoleEmploi } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import { GetCatalogueDemarchesQueryHandler } from 'src/application/queries/get-catalogue-demarches.query.handler'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { success } from 'src/building-blocks/types/result'

describe('GetCatalogueQueryHandler', () => {
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let oidcClient: StubbedClass<OidcClient>
  let handler: GetCatalogueDemarchesQueryHandler

  beforeEach(() => {
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    oidcClient = stubClass(OidcClient)
    handler = new GetCatalogueDemarchesQueryHandler(
      poleEmploiPartenaireClient,
      jeuneAuthorizer,
      oidcClient
    )
  })

  describe('handle', () => {
    beforeEach(() => {
      oidcClient.exchangeTokenJeune
        .withArgs('token', Core.Structure.POLE_EMPLOI)
        .resolves('idpToken')
    })
    it('renvoie le catalogue au bon format', async () => {
      // Given
      const P3 = {
        code: 'P03',
        libelle: 'Mes candidatures',
        typesDemarcheRetourEmploi: [
          {
            type: 'TypeDemarcheRetourEmploiReferentielPartenaire',
            code: 'Q11',
            libelle:
              'Préparation de ses candidatures (CV, lettre de motivation, book)',
            moyensRetourEmploi: [
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C11.01',
                libelle:
                  "En participant à un atelier, une prestation, une réunion d'information",
                droitCreation: true
              },
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C11.05',
                libelle: "Avec l'aide d'une personne ou d'une structure",
                droitCreation: true
              },
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C11.07',
                libelle: 'Moyen à définir',
                droitCreation: true
              },
              {
                type: 'LoyenRetourEmploiReferentielPartenaire',
                code: 'C11.09',
                libelle: "Avec l'aide d'une personne ou d'une structure",
                droitCreation: false
              }
            ]
          },
          {
            type: 'TypeDemarcheRetourEmploiReferentielPartenaire',
            code: 'Q36',
            libelle: "Recherche d'offres d'emploi ou d'entreprises",
            moyensRetourEmploi: [
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C11.04',
                libelle: "Avec l'aide d'une personne ou d'une structure",
                droitCreation: false
              }
            ]
          }
        ]
      }

      const P2 = {
        code: 'P02',
        libelle: 'Ma formation professionnelle',
        typesDemarcheRetourEmploi: [
          {
            type: 'TypeDemarcheRetourEmploiReferentielPartenaire',
            code: 'Q06',
            libelle:
              "Information sur un projet de formation ou de Validation des acquis de l'expérience",
            moyensRetourEmploi: [
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C06.01',
                libelle:
                  "En participant à un atelier, une prestation, une réunion d'information",
                droitCreation: false
              },
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C06.02',
                libelle: "Avec l'aide d'une personne ou d'une structure",
                droitCreation: false
              }
            ]
          }
        ]
      }

      poleEmploiPartenaireClient.getCatalogue.resolves(success([P3, P2]))

      // When
      const result = await handler.handle({
        accessToken: 'un token',
        structure: Core.Structure.POLE_EMPLOI_BRSA
      })

      // Then
      expect(result).to.deep.equal([
        {
          code: 'P03',
          libelle: 'Mes candidatures',
          demarches: [
            {
              codePourquoi: 'P03',
              codeQuoi: 'Q11',
              comment: [
                {
                  code: 'C11.05',
                  label: "Avec l'aide d'une personne ou d'une structure"
                }
              ],
              commentObligatoire: true,
              libellePourquoi: 'Mes candidatures',
              libelleQuoi:
                'Préparation de ses candidatures (CV, lettre de motivation, book)'
            }
          ]
        },
        {
          code: 'P02',
          libelle: 'Ma formation professionnelle',
          demarches: []
        }
      ])
    })
  })

  describe('authorize', () => {
    it('autorise un jeune pôle emploi', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await handler.authorize(
        { accessToken: 'un token', structure: utilisateur.structure },
        utilisateur
      )

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly(
        utilisateur.id,
        utilisateur,
        estPoleEmploi(utilisateur.structure)
      )
    })
  })
})

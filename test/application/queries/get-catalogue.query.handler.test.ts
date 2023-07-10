import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'

import { Core, estPoleEmploiBRSA } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import { GetCatalogueQueryHandler } from 'src/application/queries/get-catalogue.query.handler'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { success } from 'src/building-blocks/types/result'

describe('GetCatalogueQueryHandler', () => {
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let keycloakClient: StubbedClass<KeycloakClient>
  let handler: GetCatalogueQueryHandler

  beforeEach(() => {
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    keycloakClient = stubClass(KeycloakClient)
    handler = new GetCatalogueQueryHandler(
      poleEmploiPartenaireClient,
      jeuneAuthorizer,
      keycloakClient
    )
  })

  describe('handle', () => {
    beforeEach(() => {
      keycloakClient.exchangeTokenJeune
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
                droitCreation: false
              },
              {
                type: 'MoyenRetourEmploiReferentielPartenaire',
                code: 'C11.04',
                libelle: "Avec l'aide d'une personne ou d'une structure",
                droitCreation: false
              }
            ]
          },
          {
            type: 'TypeDemarcheRetourEmploiReferentielPartenaire',
            code: 'Q12',
            libelle: "Recherche d'offres d'emploi ou d'entreprises",
            moyensRetourEmploi: []
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
                  code: 'C11.01',
                  label:
                    "En participant à un atelier, une prestation, une réunion d'information"
                },
                {
                  code: 'C11.04',
                  label: "Avec l'aide d'une personne ou d'une structure"
                }
              ],
              commentObligatoire: true,
              libellePourquoi: 'Mes candidatures',
              libelleQuoi:
                'Préparation de ses candidatures (CV, lettre de motivation, book)'
            },
            {
              codePourquoi: 'P03',
              codeQuoi: 'Q12',
              comment: [],
              commentObligatoire: false,
              libellePourquoi: 'Mes candidatures',
              libelleQuoi: "Recherche d'offres d'emploi ou d'entreprises"
            }
          ]
        },
        {
          code: 'P02',
          libelle: 'Ma formation professionnelle',
          demarches: [
            {
              codePourquoi: 'P02',
              codeQuoi: 'Q06',
              comment: [
                {
                  code: 'C06.01',
                  label:
                    "En participant à un atelier, une prestation, une réunion d'information"
                },
                {
                  code: 'C06.02',
                  label: "Avec l'aide d'une personne ou d'une structure"
                }
              ],
              commentObligatoire: true,
              libellePourquoi: 'Ma formation professionnelle',
              libelleQuoi:
                "Information sur un projet de formation ou de Validation des acquis de l'expérience"
            }
          ]
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
        estPoleEmploiBRSA(utilisateur.structure)
      )
    })
  })
})

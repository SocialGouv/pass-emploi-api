import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'

import { Core, estPoleEmploiBRSA } from '../../../src/domain/core'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { StubbedClass, expect, stubClass } from '../../utils'
import { GetCatalogueDemarchesQueryHandler } from 'src/application/queries/get-catalogue-demarches.query.handler'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { success } from 'src/building-blocks/types/result'

describe('GetCatalogueQueryHandler', () => {
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let keycloakClient: StubbedClass<KeycloakClient>
  let handler: GetCatalogueDemarchesQueryHandler

  beforeEach(() => {
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    keycloakClient = stubClass(KeycloakClient)
    handler = new GetCatalogueDemarchesQueryHandler(
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
                code: 'C11.05',
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
        estPoleEmploiBRSA(utilisateur.structure)
      )
    })
  })
})

import { expect, StubbedClass, stubClass } from '../../utils'
import { PoleEmploiClient } from '../../../src/infrastructure/clients/pole-emploi-client'
import { RechercherTypesDemarcheQueryHandler } from '../../../src/application/queries/rechercher-types-demarche.query.handler'
import { TypesDemarcheQueryModel } from '../../../src/application/queries/query-models/types-demarche.query-model'
import { TypeDemarcheDto } from '../../../src/infrastructure/clients/dto/pole-emploi.dto'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { Core } from '../../../src/domain/core'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { DroitsInsuffisants } from 'src/building-blocks/types/domain-error'

describe('RechercherTypesDemarcheQueryHandler', () => {
  let poleEmploiClient: StubbedClass<PoleEmploiClient>
  let rechercherTypesDemarcheQueryHandler: RechercherTypesDemarcheQueryHandler

  beforeEach(() => {
    poleEmploiClient = stubClass(PoleEmploiClient)
    rechercherTypesDemarcheQueryHandler =
      new RechercherTypesDemarcheQueryHandler(poleEmploiClient)
  })

  describe('handle', () => {
    context('quand il y a une seule démarche', () => {
      describe('le codeComment est filtré', () => {
        it('retourne un tableau vide', async () => {
          // Given
          const uneDemarcheDto: TypeDemarcheDto = {
            codePourQuoiObjectifDemarche: 'plop',
            codeQuoiTypeDemarche: 'Q14',
            codeCommentDemarche: 'C01.01',
            estUneAction: false,
            libellePourQuoiObjectifDemarche: 'plop',
            libelleQuoiTypeDemarche: 'plop'
          }
          poleEmploiClient.rechercherTypesDemarches
            .withArgs('salon')
            .resolves([uneDemarcheDto])

          // When
          const demarches = await rechercherTypesDemarcheQueryHandler.handle({
            recherche: 'salon'
          })

          // Then
          expect(demarches).to.be.deep.equal([])
        })
      })
      describe('le codeQuoi est filtré', () => {
        it('retourne un tableau vide', async () => {
          // Given
          const uneDemarcheDto: TypeDemarcheDto = {
            codePourQuoiObjectifDemarche: 'plop',
            codeQuoiTypeDemarche: 'Q41',
            estUneAction: false,
            libellePourQuoiObjectifDemarche: 'plop',
            libelleQuoiTypeDemarche: 'plop'
          }
          poleEmploiClient.rechercherTypesDemarches
            .withArgs('salon')
            .resolves([uneDemarcheDto])

          // When
          const demarches = await rechercherTypesDemarcheQueryHandler.handle({
            recherche: 'salon'
          })

          // Then
          expect(demarches).to.be.deep.equal([])
        })
      })
      describe('sans comment', () => {
        it('retourne une démarche simple', async () => {
          // Given
          const uneDemarcheDto: TypeDemarcheDto = {
            codePourQuoiObjectifDemarche: 'P03',
            codeQuoiTypeDemarche: 'Q14',
            estUneAction: false,
            libellePourQuoiObjectifDemarche: 'Mes candidatures',
            libelleQuoiTypeDemarche: "Réponse à des offres d'emploi"
          }
          poleEmploiClient.rechercherTypesDemarches
            .withArgs('salon')
            .resolves([uneDemarcheDto])

          // When
          const demarches = await rechercherTypesDemarcheQueryHandler.handle({
            recherche: 'salon'
          })

          // Then
          const expected: TypesDemarcheQueryModel[] = [
            {
              codeQuoi: uneDemarcheDto.codeQuoiTypeDemarche,
              libelleQuoi: uneDemarcheDto.libelleQuoiTypeDemarche,
              codePourquoi: uneDemarcheDto.codePourQuoiObjectifDemarche,
              libellePourquoi: uneDemarcheDto.libellePourQuoiObjectifDemarche,
              commentObligatoire: false,
              comment: []
            }
          ]
          expect(demarches).to.be.deep.equal(expected)
        })
      })
      describe('avec un comment', () => {
        it('retourne une démarche avec un comment', async () => {
          // Given
          const uneDemarcheDto: TypeDemarcheDto = {
            codePourQuoiObjectifDemarche: 'P03',
            codeQuoiTypeDemarche: 'Q14',
            estUneAction: false,
            libellePourQuoiObjectifDemarche: 'Mes candidatures',
            libelleQuoiTypeDemarche: "Réponse à des offres d'emploi",
            libelleCommentDemarche: 'En présentiel',
            codeCommentDemarche: 'C13.02'
          }
          poleEmploiClient.rechercherTypesDemarches
            .withArgs('salon')
            .resolves([uneDemarcheDto])

          // When
          const demarches = await rechercherTypesDemarcheQueryHandler.handle({
            recherche: 'salon'
          })

          // Then
          const expected: TypesDemarcheQueryModel[] = [
            {
              codeQuoi: uneDemarcheDto.codeQuoiTypeDemarche,
              libelleQuoi: uneDemarcheDto.libelleQuoiTypeDemarche,
              codePourquoi: uneDemarcheDto.codePourQuoiObjectifDemarche,
              libellePourquoi: uneDemarcheDto.libellePourQuoiObjectifDemarche,
              commentObligatoire: true,
              comment: [
                {
                  code: uneDemarcheDto.codeCommentDemarche!,
                  label: uneDemarcheDto.libelleCommentDemarche!
                }
              ]
            }
          ]
          expect(demarches).to.be.deep.equal(expected)
        })
      })
    })
    context('quand il y a deux démarches avec les memes quoi pourquoi', () => {
      describe('avec deux comment', () => {
        it('retourne une démarche avec les deux comment', async () => {
          // Given
          const typeDemarcheDto: TypeDemarcheDto = {
            codePourQuoiObjectifDemarche: 'P03',
            codeQuoiTypeDemarche: 'Q14',
            estUneAction: false,
            libellePourQuoiObjectifDemarche: 'Mes candidatures',
            libelleQuoiTypeDemarche: "Réponse à des offres d'emploi",
            libelleCommentDemarche: 'En présentiel',
            codeCommentDemarche: 'C13.02'
          }
          const typeDemarcheDtoAvecUnAutreComment: TypeDemarcheDto = {
            ...typeDemarcheDto,
            libelleCommentDemarche: 'En visio',
            codeCommentDemarche: 'C13.03'
          }
          poleEmploiClient.rechercherTypesDemarches
            .withArgs('salon')
            .resolves([typeDemarcheDto, typeDemarcheDtoAvecUnAutreComment])

          // When
          const demarches = await rechercherTypesDemarcheQueryHandler.handle({
            recherche: 'salon'
          })

          // Then
          const expected: TypesDemarcheQueryModel[] = [
            {
              codeQuoi: typeDemarcheDto.codeQuoiTypeDemarche,
              libelleQuoi: typeDemarcheDto.libelleQuoiTypeDemarche,
              codePourquoi: typeDemarcheDto.codePourQuoiObjectifDemarche,
              libellePourquoi: typeDemarcheDto.libellePourQuoiObjectifDemarche,
              commentObligatoire: true,
              comment: [
                {
                  code: typeDemarcheDto.codeCommentDemarche!,
                  label: typeDemarcheDto.libelleCommentDemarche!
                },
                {
                  code: typeDemarcheDtoAvecUnAutreComment.codeCommentDemarche!,
                  label:
                    typeDemarcheDtoAvecUnAutreComment.libelleCommentDemarche!
                }
              ]
            }
          ]
          expect(demarches).to.be.deep.equal(expected)
        })
      })
      describe('avec un comment et un sans comment', () => {
        it('retourne une démarche avec le comment et le commentObligatoire à faux', async () => {
          // Given
          const typeDemarcheDto: TypeDemarcheDto = {
            codePourQuoiObjectifDemarche: 'P03',
            codeQuoiTypeDemarche: 'Q14',
            estUneAction: false,
            libellePourQuoiObjectifDemarche: 'Mes candidatures',
            libelleQuoiTypeDemarche: "Réponse à des offres d'emploi",
            libelleCommentDemarche: 'En présentiel',
            codeCommentDemarche: 'C13.02'
          }
          const typeDemarcheDtoAvecUnAutreComment: TypeDemarcheDto = {
            ...typeDemarcheDto,
            libelleCommentDemarche: undefined,
            codeCommentDemarche: undefined
          }
          poleEmploiClient.rechercherTypesDemarches
            .withArgs('salon')
            .resolves([typeDemarcheDto, typeDemarcheDtoAvecUnAutreComment])

          // When
          const demarches = await rechercherTypesDemarcheQueryHandler.handle({
            recherche: 'salon'
          })

          // Then
          const expected: TypesDemarcheQueryModel[] = [
            {
              codeQuoi: typeDemarcheDto.codeQuoiTypeDemarche,
              libelleQuoi: typeDemarcheDto.libelleQuoiTypeDemarche,
              codePourquoi: typeDemarcheDto.codePourQuoiObjectifDemarche,
              libellePourquoi: typeDemarcheDto.libellePourQuoiObjectifDemarche,
              commentObligatoire: false,
              comment: [
                {
                  code: typeDemarcheDto.codeCommentDemarche!,
                  label: typeDemarcheDto.libelleCommentDemarche!
                }
              ]
            }
          ]
          expect(demarches).to.be.deep.equal(expected)
        })
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune pôle emploi', async () => {
      // When
      const result = await rechercherTypesDemarcheQueryHandler.authorize(
        { recherche: '' },
        unUtilisateurJeune({ structure: Core.Structure.POLE_EMPLOI })
      )

      // Then
      expect(result).to.deep.equal(emptySuccess())
    })
    it('rejette un jeune milo', async () => {
      // When
      const result = await rechercherTypesDemarcheQueryHandler.authorize(
        { recherche: '' },
        unUtilisateurJeune({ structure: Core.Structure.MILO })
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
    it('rejette un conseiller', async () => {
      // When
      const result = await rechercherTypesDemarcheQueryHandler.authorize(
        { recherche: '' },
        unUtilisateurConseiller()
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})

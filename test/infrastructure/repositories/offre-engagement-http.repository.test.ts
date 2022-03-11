import {
  JeuneDto,
  JeuneSqlModel
} from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { uneOffreEngagement } from '../../fixtures/offre-engagement.fixture'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import {
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { OffreEngagement } from '../../../src/domain/offre-engagement'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import { DateTime } from 'luxon'
import { failure, success } from '../../../src/building-blocks/types/result'
import { EngagementHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-engagement-http.repository'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'

describe('OffreEngagementRepository', () => {
  DatabaseForTesting.prepare()
  let engagementHttpSqlRepository: EngagementHttpSqlRepository
  let serviceCiviqueClient: StubbedClass<EngagementClient>

  beforeEach(async () => {
    serviceCiviqueClient = stubClass(EngagementClient)

    engagementHttpSqlRepository = new EngagementHttpSqlRepository(
      serviceCiviqueClient
    )
  })

  describe('.findAll', () => {
    describe('Quand tout va bien', () => {
      it('quand tous les query params sont fournis', async () => {
        // Given
        const criteres: OffreEngagement.Criteres = {
          page: 1,
          limit: 50,
          dateDeDebutMaximum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          domaine: 'environnement',
          editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE
        }
        const params = new URLSearchParams()
        params.append('size', '50')
        params.append('from', '0')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10km')
        params.append('domain', 'environnement')
        params.append('publisher', OffreEngagement.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            hits: [
              {
                id: 'unId',
                title: 'unTitre',
                startAt: '2022-02-17T10:00:00.000Z',
                domain: 'Informatique',
                city: 'paris',
                organizationName: 'orga de ouf'
              }
            ]
          }
        })

        // When
        const result = await engagementHttpSqlRepository.findAll(criteres)

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/search',
          params
        )
        expect(result).to.be.deep.equal(success([uneOffreEngagement()]))
      })
      it('avec la deuxième page', async () => {
        // Given
        const criteres: OffreEngagement.Criteres = {
          page: 2,
          limit: 63,
          dateDeDebutMinimum: DateTime.fromISO('2022-02-17T10:00:00Z'),
          lat: 48.86899229710103,
          lon: 2.3342718577284205,
          distance: 10,
          editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE
        }
        const params = new URLSearchParams()
        params.append('size', '63')
        params.append('from', '63')
        params.append('lat', '48.86899229710103')
        params.append('lon', '2.3342718577284205')
        params.append('startAt', 'lt:2022-02-17T10:00:00.000Z')
        params.append('distance', '10')
        params.append('publisher', OffreEngagement.Editeur.SERVICE_CIVIQUE)
        params.append('sortBy', 'createdAt')

        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            hits: [
              {
                id: 'unId',
                title: 'unTitre',
                startAt: '2022-02-17T10:00:00.000Z',
                domain: 'Informatique',
                city: 'paris',
                organizationName: 'orga de ouf'
              }
            ]
          }
        })

        // When
        const result = await engagementHttpSqlRepository.findAll(criteres)

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/search',
          params
        )
        expect(result).to.be.deep.equal(
          success([
            {
              dateDeDebut: '2022-02-17T10:00:00.000Z',
              domaine: 'Informatique',
              id: 'unId',
              titre: 'unTitre',
              ville: 'paris',
              organisation: 'orga de ouf'
            }
          ])
        )
      })
    })
    describe('Quand il y a une erreur', () => {
      it('renvoie une failure http', async () => {
        // Given
        const criteres: OffreEngagement.Criteres = {
          page: 1,
          limit: 50,
          editeur: OffreEngagement.Editeur.SERVICE_CIVIQUE
        }

        serviceCiviqueClient.get.rejects({
          response: {
            status: 400,
            data: {
              message: 'Bad request'
            }
          }
        })

        // When
        const result = await engagementHttpSqlRepository.findAll(criteres)

        // Then
        expect(result).to.be.deep.equal(
          failure(new ErreurHttp('Bad request', 400))
        )
      })
    })
  })
  describe('.getOffreEngagementQueryModelById', () => {
    describe('Quand tout va bien', () => {
      it('quand l"offre existe', async () => {
        // Given
        const idOffreEngagement = 'unId'
        serviceCiviqueClient.get.resolves({
          status: 200,
          statusText: 'OK',
          headers: '',
          config: '',
          data: {
            ok: true,
            data: {
              id: 'unId',
              title: 'unTitre',
              startAt: '2022-02-17T10:00:00.000Z',
              endAt: '2022-07-17T10:00:00.000Z',
              domain: 'Informatique',
              city: 'paris',
              organizationName: 'orga de ouf',
              applicationUrl: 'lienoffre.com',
              organizationUrl: 'lienorganisation.com',
              adresse: 'adresse mission',
              organizationFullAddress: 'adresse organistation',
              postalCode: '75018',
              description: 'offre très intéressante',
              departmentCode: '75',
              organizationDescription: 'description'
            }
          }
        })

        // When
        const result =
          await engagementHttpSqlRepository.getOffreEngagementQueryModelById(
            idOffreEngagement
          )

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/unId'
        )
        expect(result).to.be.deep.equal(
          success({
            titre: 'unTitre',
            dateDeDebut: '2022-02-17T10:00:00.000Z',
            dateDeFin: '2022-07-17T10:00:00.000Z',
            domaine: 'Informatique',
            ville: 'paris',
            organisation: 'orga de ouf',
            lienAnnonce: 'lienoffre.com',
            urlOrganisation: 'lienorganisation.com',
            adresseMission: 'adresse mission',
            adresseOrganisation: 'adresse organistation',
            codeDepartement: '75',
            description: 'offre très intéressante',
            codePostal: '75018',
            descriptionOrganisation: 'description'
          })
        )
      })
      it('quand l"offre n"existe pas', async () => {
        // Given
        const idOffreEngagement = 'unFauxId'
        serviceCiviqueClient.get.rejects({
          response: {
            status: 404,
            data: {
              message: 'Not Found'
            }
          }
        })

        // When
        const result =
          await engagementHttpSqlRepository.getOffreEngagementQueryModelById(
            idOffreEngagement
          )

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/unFauxId'
        )
        expect(result).to.be.deep.equal(
          failure(new ErreurHttp('Not Found', 404))
        )
      })
    })
    describe('Quand il y a une erreur', () => {
      it('renvoie une failure http', async () => {
        // Given
        const idOffreEngagement = 'unId'
        serviceCiviqueClient.get.rejects({
          response: {
            status: 400,
            data: {
              message: 'Bad request'
            }
          }
        })

        // When
        const result =
          await engagementHttpSqlRepository.getOffreEngagementQueryModelById(
            idOffreEngagement
          )

        // Then
        expect(result).to.be.deep.equal(
          failure(new ErreurHttp('Bad request', 400))
        )
      })
    })
  })

  describe('getFavorisIdsQueryModelsByJeune', () => {
    it('renvoie les id des favoris', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre = uneOffreEngagement()
      await engagementHttpSqlRepository.saveAsFavori(jeuneDto.id, offre)

      // When
      const ids =
        await engagementHttpSqlRepository.getFavorisIdsQueryModelsByJeune(
          jeuneDto.id
        )

      // Then
      expect(ids).to.deep.equal([{ id: offre.id }])
    })
  })

  describe('getFavorisQueryModelsByJeune', () => {
    it('renvoie les favoris query models', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre = uneOffreEngagement()
      await engagementHttpSqlRepository.saveAsFavori(jeuneDto.id, offre)

      // When
      const queryModels =
        await engagementHttpSqlRepository.getFavorisQueryModelsByJeune(
          jeuneDto.id
        )

      // Then
      expect(queryModels).to.deep.equal([uneOffreEngagement()])
    })
  })

  describe('getFavori', () => {
    describe('quand il existe', () => {
      it('renvoie le favori', async () => {
        // Given
        const jeuneDto: AsSql<JeuneDto> = {
          ...unJeuneDto(),
          idConseiller: undefined
        }
        await JeuneSqlModel.creer(jeuneDto)
        const offre = uneOffreEngagement()
        await engagementHttpSqlRepository.saveAsFavori(jeuneDto.id, offre)

        // When
        const favori = await engagementHttpSqlRepository.getFavori(
          jeuneDto.id,
          offre.id
        )

        // Then
        expect(favori).to.deep.equal(uneOffreEngagement())
      })
    })

    describe('quand il existe pas', () => {
      it('renvoie undefined', async () => {
        // Given
        const jeuneDto: AsSql<JeuneDto> = {
          ...unJeuneDto(),
          idConseiller: undefined
        }
        await JeuneSqlModel.creer(jeuneDto)
        const offre = uneOffreEngagement()

        // When
        const favori = await engagementHttpSqlRepository.getFavori(
          jeuneDto.id,
          offre.id
        )

        // Then
        expect(favori).to.equal(undefined)
      })
    })
  })

  describe('deleteFavori', () => {
    it('supprime un favori', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre = uneOffreEngagement()
      await engagementHttpSqlRepository.saveAsFavori(jeuneDto.id, offre)

      // When
      await engagementHttpSqlRepository.deleteFavori(jeuneDto.id, offre.id)

      // Then
      const favori = await engagementHttpSqlRepository.getFavori(
        jeuneDto.id,
        offre.id
      )
      expect(favori).to.equal(undefined)
    })
  })
})

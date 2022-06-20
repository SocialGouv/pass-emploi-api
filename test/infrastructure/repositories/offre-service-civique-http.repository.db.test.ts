import {
  JeuneDto,
  JeuneSqlModel
} from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  uneOffreServiceCivique,
  uneOffreServiceCiviqueDto
} from '../../fixtures/offre-service-civique.fixture'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { OffreServiceCivique } from '../../../src/domain/offre-service-civique'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import { failure, success } from '../../../src/building-blocks/types/result'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-service-civique-http.repository.db'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('OffreServiceCiviqueHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
  let offreServiceCiviqueHttpSqlRepository: OffreServiceCiviqueHttpSqlRepository
  let serviceCiviqueClient: StubbedClass<EngagementClient>

  beforeEach(async () => {
    serviceCiviqueClient = stubClass(EngagementClient)

    offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository(serviceCiviqueClient)
  })

  describe('.getOffreEngagementById', () => {
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
            data: uneOffreServiceCiviqueDto()
          }
        })

        // When
        const result =
          await offreServiceCiviqueHttpSqlRepository.getServiceCiviqueById(
            idOffreEngagement
          )

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/unId'
        )
        const offreEngagement: OffreServiceCivique = {
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
          descriptionOrganisation: 'description',
          id: 'unId',
          localisation: {
            longitude: 1.2,
            latitude: 3.4
          }
        }
        expect(result).to.be.deep.equal(success(offreEngagement))
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
          await offreServiceCiviqueHttpSqlRepository.getServiceCiviqueById(
            idOffreEngagement
          )

        // Then
        expect(serviceCiviqueClient.get).to.have.been.calledWithExactly(
          'v0/mission/unFauxId'
        )
        expect(result).to.be.deep.equal(
          failure(new NonTrouveError('OffreEngagement', 'unFauxId'))
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
          await offreServiceCiviqueHttpSqlRepository.getServiceCiviqueById(
            idOffreEngagement
          )

        // Then
        expect(result).to.be.deep.equal(
          failure(new ErreurHttp('Bad request', 400))
        )
      })
    })
  })

  describe('getFavorisIdsByJeune', () => {
    it('renvoie les id des favoris', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre = uneOffreServiceCivique()
      await offreServiceCiviqueHttpSqlRepository.saveAsFavori(
        jeuneDto.id,
        offre
      )

      // When
      const ids =
        await offreServiceCiviqueHttpSqlRepository.getFavorisIdsByJeune(
          jeuneDto.id
        )

      // Then
      expect(ids).to.deep.equal([{ id: offre.id }])
    })
  })

  describe('getFavoriByJeune', () => {
    it('renvoie les favoris', async () => {
      // Given
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeuneDto(),
        idConseiller: undefined
      }
      await JeuneSqlModel.creer(jeuneDto)
      const offre: OffreServiceCivique = {
        id: 'unId',
        domaine: OffreServiceCivique.Domaine.education,
        ville: 'Paris',
        titre: 'La best offre',
        organisation: 'FNAC',
        dateDeDebut: '2022-05-12T10:00:10'
      }
      await offreServiceCiviqueHttpSqlRepository.saveAsFavori(
        jeuneDto.id,
        offre
      )

      // When
      const favoris =
        await offreServiceCiviqueHttpSqlRepository.getFavorisByJeune(
          jeuneDto.id
        )

      // Then
      expect(favoris).to.deep.equal([offre])
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
        const offre: OffreServiceCivique = {
          id: 'unId',
          domaine: OffreServiceCivique.Domaine.education,
          ville: 'Paris',
          titre: 'La best offre',
          organisation: 'FNAC',
          dateDeDebut: '2022-05-12T10:00:10'
        }
        await offreServiceCiviqueHttpSqlRepository.saveAsFavori(
          jeuneDto.id,
          offre
        )

        // When
        const favori = await offreServiceCiviqueHttpSqlRepository.getFavori(
          jeuneDto.id,
          offre.id
        )

        // Then
        expect(favori).to.deep.equal(offre)
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
        const offre = uneOffreServiceCivique()

        // When
        const favori = await offreServiceCiviqueHttpSqlRepository.getFavori(
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
      const offre = uneOffreServiceCivique()
      await offreServiceCiviqueHttpSqlRepository.saveAsFavori(
        jeuneDto.id,
        offre
      )

      // When
      await offreServiceCiviqueHttpSqlRepository.deleteFavori(
        jeuneDto.id,
        offre.id
      )

      // Then
      const favori = await offreServiceCiviqueHttpSqlRepository.getFavori(
        jeuneDto.id,
        offre.id
      )
      expect(favori).to.equal(undefined)
    })
  })
})

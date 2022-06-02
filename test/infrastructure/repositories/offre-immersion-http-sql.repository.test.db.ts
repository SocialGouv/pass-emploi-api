import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces'
import { expect } from 'chai'
import {
  RechercheDetailOffreInvalide,
  RechercheDetailOffreNonTrouve,
  RechercheOffreInvalide
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { ImmersionClient } from '../../../src/infrastructure/clients/immersion-client'
import { OffresImmersionHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-immersion-http-sql.repository'
import { offreImmersionDto } from '../../fixtures/offre-immersion.dto.fixture'
import { StubbedClass, stubClass } from '../../utils'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import {
  uneOffreImmersion,
  uneOffreImmersionQueryModel
} from '../../fixtures/offre-immersion.fixture'
import { FavoriOffreImmersionSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { OffreImmersion } from '../../../src/domain/offre-immersion'
import {
  FavoriOffreImmersionIdQueryModel,
  OffreImmersionQueryModel
} from 'src/application/queries/query-models/offres-immersion.query-models'
import { TIMEOUT } from 'dns'

describe('OffresImmersionHttpSqlRepository', () => {
  let offresImmersionHttpSqlRepository: OffresImmersionHttpSqlRepository
  let immersionClient: StubbedClass<ImmersionClient>

  beforeEach(() => {
    immersionClient = stubClass(ImmersionClient)

    offresImmersionHttpSqlRepository = new OffresImmersionHttpSqlRepository(
      immersionClient
    )
  })
  describe('findAll', () => {
    describe('quand la requête est correcte', () => {
      it('renvoie les offres', async () => {
        // Given
        const query = {
          rome: 'D1102',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        const response: AxiosResponse = {
          data: [
            {
              id: 'id',
              romeLabel: 'romeLabel',
              name: 'name',
              nafLabel: 'nafLabel',
              city: 'city'
            }
          ],
          status: 200,
          statusText: 'OK',
          request: '',
          headers: '',
          config: ''
        }

        immersionClient.post
          .withArgs('search-immersion', query)
          .resolves(response)

        // When
        const offres = await offresImmersionHttpSqlRepository.findAll({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        expect(offres).to.deep.equal(
          success([
            {
              id: 'id',
              metier: 'romeLabel',
              nomEtablissement: 'name',
              secteurActivite: 'nafLabel',
              ville: 'city'
            }
          ])
        )
      })
    })

    describe('quand la requête est mauvaise', () => {
      it('renvoie une erreur', async () => {
        // Given
        const query = {
          rome: 'PLOP',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        const badResponse: AxiosResponse = {
          data: {
            errors: [
              {
                message: 'Le champs Rome est pas bon'
              }
            ]
          },
          status: 400,
          statusText: 'BAD_REQUEST',
          request: '',
          headers: '',
          config: ''
        }

        immersionClient.post.rejects({ response: badResponse })

        // When
        const offres = await offresImmersionHttpSqlRepository.findAll({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        expect(offres).to.deep.equal(
          failure(new RechercheOffreInvalide('Le champs Rome est pas bon'))
        )
      })
    })
    describe('quand la requête renvoie une erreur', () => {
      it('renvoie une erreur', async () => {
        // Given
        const query = {
          rome: 'PLOP',
          location: {
            lat: 48.502103949334845,
            lon: 2.13082255225161
          },
          distance_km: 30
        }

        const error: Error = new Error(TIMEOUT)

        immersionClient.post.rejects(error)

        // When
        const call = offresImmersionHttpSqlRepository.findAll({
          rome: query.rome,
          lat: query.location.lat,
          lon: query.location.lon,
          distance: query.distance_km
        })

        // Then
        await expect(call).to.be.rejectedWith(error)
      })
    })
  })
  describe('get', () => {
    describe('quand la requête est correcte', () => {
      it("renvoie le détail d'une offre", async () => {
        // Given
        const query = {
          idOffreImmersion: 'id'
        }

        const response: AxiosResponse = {
          config: undefined,
          headers: undefined,
          request: undefined,
          status: 200,
          statusText: '',
          data: offreImmersionDto()
        }

        immersionClient.get.resolves(response)

        // When
        const detailOffre = await offresImmersionHttpSqlRepository.get(
          query.idOffreImmersion
        )

        // Then
        expect(immersionClient.get).to.have.been.calledWith(
          `/get-immersion-by-id/${query.idOffreImmersion}`
        )
        expect(detailOffre).to.deep.equal(
          success({
            adresse: 'addresse',
            estVolontaire: true,
            id: 'id',
            localisation: {
              latitude: 42,
              longitude: 2
            },
            metier: 'rome',
            nomEtablissement: 'name',
            secteurActivite: 'naf',
            ville: 'Paris',
            contact: {
              email: undefined,
              id: '1',
              modeDeContact: 'PRESENTIEL',
              nom: 'Nils',
              prenom: 'Tavernier',
              role: 'manager',
              telephone: undefined
            }
          })
        )
      })
    })
    describe('quand la requête est mauvaise', () => {
      it('renvoie une erreur quand la recherche est faite avec un mauvais id', async () => {
        // Given
        const query = {
          idOffreImmersion: 'fauxId'
        }

        const badResponse: AxiosResponse = {
          data: {
            errors: {
              message: "L'id fauxId n'est pas bon"
            }
          },
          status: 400,
          statusText: 'BAD_REQUEST',
          request: '',
          headers: '',
          config: ''
        }

        immersionClient.get.rejects({ response: badResponse })

        // When
        const offres = await offresImmersionHttpSqlRepository.get(
          query.idOffreImmersion
        )

        // Then
        expect(offres).to.deep.equal(
          failure(new RechercheDetailOffreInvalide("L'id fauxId n'est pas bon"))
        )
      })
      it('renvoie une erreur quand l"offre recherchée est introuvable', async () => {
        // Given
        const query = {
          idOffreImmersion: 'id'
        }

        const badResponse: AxiosResponse = {
          data: {
            errors: {
              message: "Offre d'immersion id not found"
            }
          },
          status: 404,
          statusText: 'NOT_FOUND',
          request: '',
          headers: '',
          config: ''
        }

        immersionClient.get.rejects({ response: badResponse })

        // When
        const offres = await offresImmersionHttpSqlRepository.get(
          query.idOffreImmersion
        )

        // Then
        expect(offres).to.deep.equal(
          failure(
            new RechercheDetailOffreNonTrouve("Offre d'immersion id not found")
          )
        )
      })
      it('renvoie une erreur quand une erreur inconnue survient', async () => {
        // Given
        const query = {
          idOffreImmersion: 'id'
        }
        const error = new Error('Erreur inconnue')
        immersionClient.get.rejects(error)

        // When
        const offres = offresImmersionHttpSqlRepository.get(
          query.idOffreImmersion
        )

        // Then
        await expect(offres).to.be.rejectedWith(error)
      })
    })
  })
  describe('.saveAsFavori', () => {
    describe("quand le favori n'existe pas", () => {
      it('sauvegarde un favori', async () => {
        // Given
        await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'ABCDE',
            idConseiller: 'ZIDANE'
          })
        )
        // When
        await offresImmersionHttpSqlRepository.saveAsFavori(
          'ABCDE',
          uneOffreImmersion()
        )

        // Then
        const offresImmersion = await FavoriOffreImmersionSqlModel.findAll()
        expect(offresImmersion.length).to.equal(1)
        expect(offresImmersion[0].idOffre).to.equal('123ABC')
        expect(offresImmersion[0].idJeune).to.equal('ABCDE')
      })
    })
  })
  describe('.getFavori', () => {
    let offreImmersion: OffreImmersion

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
      offreImmersion = uneOffreImmersion()
      await offresImmersionHttpSqlRepository.saveAsFavori(
        'ABCDE',
        offreImmersion
      )
    })

    describe("quand le favori n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const favori = await offresImmersionHttpSqlRepository.getFavori(
          'ABCDE',
          'UN MAUVAIS ID'
        )
        // Then
        expect(favori).to.equal(undefined)
      })
    })

    describe('quand le favori existe', () => {
      it("renvoie l'offre d'emploi", async () => {
        // When
        const favori = await offresImmersionHttpSqlRepository.getFavori(
          'ABCDE',
          offreImmersion.id
        )
        // Then
        expect(favori).to.deep.equal(offreImmersion)
      })
    })
  })
  describe('.deleteFavori', () => {
    let offreImmersion: OffreImmersion

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller: 'ZIDANE'
        })
      )
    })

    it('supprime le favori', async () => {
      // Given
      offreImmersion = uneOffreImmersion()
      await offresImmersionHttpSqlRepository.saveAsFavori(
        'ABCDE',
        offreImmersion
      )
      // When
      await offresImmersionHttpSqlRepository.deleteFavori(
        'ABCDE',
        offreImmersion.id
      )
      // Then
      const actual = await offresImmersionHttpSqlRepository.getFavori(
        'ABCDE',
        offreImmersion.id
      )
      expect(actual).to.equal(undefined)
    })
  })

  describe('.getFavorisQueryModelsByJeune', () => {
    const idJeune = 'ABCDE'

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: idJeune,
          idConseiller: 'ZIDANE'
        })
      )
      await offresImmersionHttpSqlRepository.saveAsFavori(
        idJeune,
        uneOffreImmersion()
      )
    })

    it('recupère tous les favoris immersions du jeune', async () => {
      // Given
      const expectedResult: OffreImmersionQueryModel[] = [
        uneOffreImmersionQueryModel()
      ]
      // When

      const result =
        await offresImmersionHttpSqlRepository.getFavorisQueryModelsByJeune(
          idJeune
        )
      // Then

      expect(result).to.deep.equal(expectedResult)
    })
  })

  describe('.getFavorisIdsQueryModelsByJeune', () => {
    const idJeune = 'ABCDE'

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'ZIDANE' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: idJeune,
          idConseiller: 'ZIDANE'
        })
      )
      await offresImmersionHttpSqlRepository.saveAsFavori(
        idJeune,
        uneOffreImmersion()
      )
    })

    it('recupère tous les ids des favoris immersions du jeune', async () => {
      // Given
      const expectedResult: FavoriOffreImmersionIdQueryModel[] = [
        { id: uneOffreImmersionQueryModel().id }
      ]
      // When

      const result =
        await offresImmersionHttpSqlRepository.getFavorisIdsQueryModelsByJeune(
          idJeune
        )
      // Then

      expect(result).to.deep.equal(expectedResult)
    })
  })
})

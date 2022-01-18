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
import { DatabaseForTesting, StubbedClass, stubClass } from '../../utils'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { FavoriOffreImmersionSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { OffreImmersion } from '../../../src/domain/offre-immersion'

describe('OffresImmersionHttpSqlRepository', () => {
  DatabaseForTesting.prepare()
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
        const offres = await offresImmersionHttpSqlRepository.findAll(
          query.rome,
          query.location.lat,
          query.location.lon
        )

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
        const offres = await offresImmersionHttpSqlRepository.findAll(
          query.rome,
          query.location.lat,
          query.location.lon
        )

        // Then
        expect(offres).to.deep.equal(
          failure(new RechercheOffreInvalide('Le champs Rome est pas bon'))
        )
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
          data: {
            romeLabel: 'rome',
            nafLabel: 'naf',
            id: 'id',
            name: 'name',
            city: 'Paris',
            address: 'addresse',
            voluntaryToImmersion: true,
            contactMode: 'IN_PERSON',
            contactDetails: {
              id: '1',
              lastName: 'Tavernier',
              firstName: 'Nils',
              role: 'manager'
            }
          }
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
            localisation: undefined,
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
})

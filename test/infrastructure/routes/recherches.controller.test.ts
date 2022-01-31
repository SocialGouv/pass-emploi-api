import { HttpStatus, INestApplication } from '@nestjs/common'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import * as request from 'supertest'
import { CreateRechercheCommandHandler } from '../../../src/application/commands/create-recherche.command.handler'
import { Recherche } from '../../../src/domain/recherche'
import { Contrat, Duree, Experience } from '../../../src/domain/offre-emploi'
import {
  CreateRechercheImmersionPayload,
  CreateRechercheOffresEmploiPayload
} from '../../../src/infrastructure/routes/validation/recherches.inputs'
import { GetRecherchesQueryHandler } from '../../../src/application/queries/get-recherches.query.handler'
import { RechercheQueryModel } from '../../../src/application/queries/query-models/recherches.query-model'

describe('RecherchesController', () => {
  let createRechercheCommandHandler: StubbedClass<CreateRechercheCommandHandler>
  let getRecherchesQueryHandler: StubbedClass<GetRecherchesQueryHandler>
  let app: INestApplication

  before(async () => {
    createRechercheCommandHandler = stubClass(CreateRechercheCommandHandler)
    getRecherchesQueryHandler = stubClass(GetRecherchesQueryHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateRechercheCommandHandler)
      .useValue(createRechercheCommandHandler)
      .overrideProvider(GetRecherchesQueryHandler)
      .useValue(getRecherchesQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /recherches/offres-emploi', () => {
    describe("Quand la recherche est une offre d'emploi", () => {
      it("crée la recherche d'une offre d'emploi quand il n'y a pas de critères", async () => {
        // Given
        const createRecherchePayload: CreateRechercheOffresEmploiPayload = {
          titre: 'Ma recherche',
          criteres: {}
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .send(createRecherchePayload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          createRechercheCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: '1',
            type: Recherche.Type.OFFRES_EMPLOI,
            titre: 'Ma recherche',
            metier: undefined,
            localisation: undefined,
            criteres: {}
          },
          unUtilisateurDecode()
        )
      })
      it('crée la recherche avec les critères renseignés', async () => {
        // Given
        const createRecherchePayload: CreateRechercheOffresEmploiPayload = {
          titre: 'Ma recherche',
          localisation: 'Paris',
          metier: 'Mécanicien',
          criteres: {
            page: 1,
            limit: 50,
            q: 'informatique',
            alternance: true,
            departement: 'Ile-de-France',
            experience: [Experience.moinsdUnAn],
            contrat: [Contrat.cdi, Contrat.cdd],
            duree: [Duree.tempsPartiel],
            rayon: 0,
            commune: '75118'
          }
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .send(createRecherchePayload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          createRechercheCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: '1',
            type: Recherche.Type.OFFRES_ALTERNANCE,
            titre: 'Ma recherche',
            localisation: 'Paris',
            metier: 'Mécanicien',
            criteres: {
              page: 1,
              limit: 50,
              q: 'informatique',
              alternance: true,
              departement: 'Ile-de-France',
              experience: [Experience.moinsdUnAn],
              contrat: [Contrat.cdi, Contrat.cdd],
              duree: [Duree.tempsPartiel],
              rayon: 0,
              commune: '75118'
            }
          },
          unUtilisateurDecode()
        )
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/1/recherches/offres-emploi'
    )
  })
  describe('POST /recherches/immersions', () => {
    describe('Quand la recherche est une immersion', () => {
      it('crée la recherche avec les critères renseignés', async () => {
        // Given
        const createRecherchePayload: CreateRechercheImmersionPayload = {
          titre: 'Ma recherche',
          localisation: 'Paris',
          metier: 'Maitre nageur',
          criteres: {
            lat: 48.868886438306724,
            lon: 2.3341967558765795,
            rome: 'G1204'
          }
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches/immersions')
          .set('authorization', unHeaderAuthorization())
          .send(createRecherchePayload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          createRechercheCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: '1',
            type: Recherche.Type.OFFRES_IMMERSION,
            titre: 'Ma recherche',
            localisation: 'Paris',
            metier: 'Maitre nageur',
            criteres: {
              lat: 48.868886438306724,
              lon: 2.3341967558765795,
              rome: 'G1204'
            }
          },
          unUtilisateurDecode()
        )
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/1/recherches/immersions'
    )
  })
  describe('GET /recherches', () => {
    it('renvoie les recherches du jeune en question', async () => {
      // Given
      const recherchesQueryModel: RechercheQueryModel[] = [
        {
          id: '1',
          metier: 'Boulanger',
          localisation: '',
          titre: 'titre',
          type: 'OFFRES_EMPLOI',
          criteres: {
            page: 1,
            limit: 50,
            q: 'informatique',
            alternance: true,
            experience: [Experience.moinsdUnAn],
            contrat: [Contrat.cdi, Contrat.cdd],
            duree: [Duree.tempsPartiel],
            rayon: 0,
            commune: '75118'
          }
        }
      ]
      getRecherchesQueryHandler.execute.resolves(recherchesQueryModel)
      // When
      const result = await request(app.getHttpServer())
        .get('/jeunes/1/recherches')
        .set('authorization', unHeaderAuthorization())

        // Then
        .expect(HttpStatus.OK)
      expect(result.body).to.deep.equal(recherchesQueryModel)
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/recherches')
  })
})

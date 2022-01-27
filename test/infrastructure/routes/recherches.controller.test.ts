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
import { CreateRecherchePayload } from '../../../src/infrastructure/routes/validation/recherches.inputs'
import { Recherche } from '../../../src/domain/recherche'
import { Contrat, Duree, Experience } from '../../../src/domain/offre-emploi'

describe('RecherchesController', () => {
  let createRechercheCommandHandler: StubbedClass<CreateRechercheCommandHandler>
  let app: INestApplication

  before(async () => {
    createRechercheCommandHandler = stubClass(CreateRechercheCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateRechercheCommandHandler)
      .useValue(createRechercheCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /recherches', () => {
    describe("Quand la recherche est une offre d'emploi ou d'alternance", () => {
      it("crée la recherche quand il n'y a pas de critères", async () => {
        // Given
        const createRecherchePayload: CreateRecherchePayload = {
          titre: 'Ma recherche',
          type: Recherche.Type.OFFRES_EMPLOI,
          criteres: {}
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches')
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
        const createRecherchePayload: CreateRecherchePayload = {
          titre: 'Ma recherche',
          type: Recherche.Type.OFFRES_ALTERNANCE,
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
          .post('/jeunes/1/recherches')
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
    describe("Quand la recherche est une offre d'immersion", () => {
      it('crée la recherche avec les critères renseignés', async () => {
        // Given
        const createRecherchePayload: CreateRecherchePayload = {
          titre: 'Ma recherche',
          type: Recherche.Type.OFFRES_IMMERSION,
          localisation: 'Paris',
          criteres: {
            rome: 'ABC123',
            lat: 40,
            lon: 8
          }
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches')
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
            metier: undefined,
            criteres: {
              rome: 'ABC123',
              lat: 40,
              lon: 8
            }
          },
          unUtilisateurDecode()
        )
      })
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/1/recherches')
  })
})

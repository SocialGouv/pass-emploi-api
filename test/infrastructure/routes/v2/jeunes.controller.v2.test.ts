import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import {
  ActionsByJeuneOutput,
  GetActionsByJeuneQueryHandler
} from '../../../../src/application/queries/get-actions-by-jeune.query.handler.db'
import { NonTrouveError } from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import { JwtService } from '../../../../src/infrastructure/auth/jwt.service'
import {
  unHeaderAuthorization,
  unJwtPayloadValide
} from '../../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../../utils'

describe('JeunesController v2', () => {
  let getActionsByJeuneQueryHandler: StubbedClass<GetActionsByJeuneQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    jwtService = stubClass(JwtService)
    getActionsByJeuneQueryHandler = stubClass(GetActionsByJeuneQueryHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetActionsByJeuneQueryHandler)
      .useValue(getActionsByJeuneQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  after(async () => {
    await app.close()
  })

  describe('GET /v2/jeunes/:idJeune/actions', () => {
    const idJeune = '1'
    it('renvoie 206', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        page: 1,
        tri: 'date_croissante'
      }
      const actionsByJeuneOutput: ActionsByJeuneOutput = {
        actions: [],
        metadonnees: {
          nombreTotal: 1,
          nombreEnCours: 2,
          nombreTerminees: 3,
          nombreAnnulees: 4,
          nombrePasCommencees: 5,
          nombreActionsParPage: 10
        }
      }
      const expectedActions = success(actionsByJeuneOutput)
      getActionsByJeuneQueryHandler.execute.resolves(expectedActions)

      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.PARTIAL_CONTENT)
        .expect(actionsByJeuneOutput)
    })

    it('retourne 400 quand le paramètre page est manquant', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        tri: 'date_croissante'
      }
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand le paramètre page est au mauvais format', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        page: 'poi'
      }
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand le paramètre tri est manquant', async () => {
      // Given
      const queryActions = {
        page: 1
      }
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand le paramètre tri est au mauvais format', async () => {
      // Given
      const queryActions = {
        tri: 'croissants'
      }
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 400 quand le paramètre statuts est au mauvais format', async () => {
      // Given
      const queryActions = {
        statuts: ['à tes souhaits']
      }
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    it('retourne 404 quand une failure non trouvé se produit', async () => {
      // Given
      const queryActions = {
        idJeune: idJeune,
        page: 2,
        tri: 'date_croissante'
      }
      getActionsByJeuneQueryHandler.execute.resolves(
        failure(new NonTrouveError('test'))
      )
      // When
      await request(app.getHttpServer())
        .get(`/v2/jeunes/${idJeune}/actions`)
        .set('authorization', unHeaderAuthorization())
        .query(queryActions)
        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
  })
})

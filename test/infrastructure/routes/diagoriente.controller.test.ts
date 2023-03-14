import { HttpStatus, INestApplication } from '@nestjs/common'
import { GetDiagorienteMetiersFavorisQueryHandler } from 'src/application/queries/get-diagoriente-metiers-favoris.query.handler'
import * as request from 'supertest'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { GetDiagorienteUrlsQueryHandler } from '../../../src/application/queries/get-diagoriente-urls.query.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import { DateService } from '../../../src/utils/date-service'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { expect, StubbedClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

describe('DiagorienteController', () => {
  let getDiagorienteUrlsQueryHandler: StubbedClass<GetDiagorienteUrlsQueryHandler>
  let getDiagorienteMetiersFavorisQueryHandler: StubbedClass<GetDiagorienteMetiersFavorisQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let dateService: StubbedClass<DateService>
  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getDiagorienteUrlsQueryHandler = app.get(GetDiagorienteUrlsQueryHandler)
    getDiagorienteMetiersFavorisQueryHandler = app.get(
      GetDiagorienteMetiersFavorisQueryHandler
    )
    jwtService = app.get(JwtService)
    dateService = app.get(DateService)
    dateService.now.returns(now)
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  describe('GET /jeunes/:idJeune/diagoriente/urls', () => {
    const idJeune = '1'
    describe('quand la query est en succes', () => {
      it('renvoie le resultat', async () => {
        // Given
        getDiagorienteUrlsQueryHandler.execute.resolves(
          success({ urlChatbot: '', urlFavoris: '', urlRecommandes: '' })
        )

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/diagoriente/urls`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)
          .expect({ urlChatbot: '', urlFavoris: '', urlRecommandes: '' })
        expect(
          getDiagorienteUrlsQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune
          },
          unUtilisateurDecode()
        )
      })
    })
    describe('quand la query est en failure', () => {
      it('throw une erreur', async () => {
        // Given
        getDiagorienteUrlsQueryHandler.execute
          .withArgs({
            idJeune
          })
          .resolves(failure(new NonTrouveError('Jeune', idJeune)))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/diagoriente/urls`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid('GET', '/jeunes/1/diagoriente/urls')
  })

  describe('GET /jeunes/:idJeune/diagoriente/metiers-favoris', () => {
    const idJeune = '1'
    describe('quand la query est en succes', () => {
      it('renvoie le resultat', async () => {
        // Given
        getDiagorienteMetiersFavorisQueryHandler.execute.resolves(
          success({
            aDesMetiersFavoris: true,
            metiersFavoris: [{ libelle: 'libelle', rome: 'rome' }]
          })
        )

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/diagoriente/metiers-favoris?detail=true`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)
          .expect({
            aDesMetiersFavoris: true,
            metiersFavoris: [{ libelle: 'libelle', rome: 'rome' }]
          })
        expect(
          getDiagorienteMetiersFavorisQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            detail: true
          },
          unUtilisateurDecode()
        )
      })
    })
    describe('quand la query est en failure', () => {
      it('throw une erreur', async () => {
        // Given
        getDiagorienteMetiersFavorisQueryHandler.execute
          .withArgs({
            idJeune,
            detail: undefined
          })
          .resolves(failure(new NonTrouveError('Jeune', idJeune)))

        // When
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/diagoriente/metiers-favoris`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'GET',
      '/jeunes/1/diagoriente/metiers-favoris'
    )
  })
})

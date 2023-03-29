import { StubbedClass } from '../../utils'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { GetAccueilJeunePoleEmploiQueryHandler } from '../../../src/application/queries/accueil/get-accueil-jeune-pole-emploi.query.handler.db'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { AccueilJeunePoleEmploiQueryModel } from '../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import * as request from 'supertest'

describe('JeunesPoleEmploiController', () => {
  let getAccueilJeunePoleEmploiQueryHandler: StubbedClass<GetAccueilJeunePoleEmploiQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAccueilJeunePoleEmploiQueryHandler = app.get(
      GetAccueilJeunePoleEmploiQueryHandler
    )
    jwtService = app.get(JwtService)
  })

  describe('GET /jeunes/:idJeune/pole-emploi/accueil', () => {
    const idJeune = '1'
    const maintenant = '2022-08-17T12:00:30+02:00'
    const accueilJeunePoleEmploiQueryModel: AccueilJeunePoleEmploiQueryModel = {
      dateDerniereMiseAJour: undefined,
      cetteSemaine: {
        nombreRendezVous: 1,
        nombreActionsDemarchesEnRetard: 1,
        nombreActionsDemarchesARealiser: 1
      },
      prochainRendezVous: undefined,
      mesAlertes: [],
      mesFavoris: []
    }
    it("renvoie l'accueil d'un jeune PE sans personnalisation", async () => {
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getAccueilJeunePoleEmploiQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant,
            accessToken: 'coucou'
          },
          unUtilisateurDecode()
        )
        .resolves(success(accueilJeunePoleEmploiQueryModel))
      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/pole-emploi/accueil?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect({
          cetteSemaine: {
            nombreRendezVous: 1,
            nombreActionsDemarchesEnRetard: 1,
            nombreActionsDemarchesARealiser: 1
          },
          mesAlertes: [],
          mesFavoris: []
        })
    })
    it('renvoie une erreur quand le jeune vient de MILO', async () => {
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      getAccueilJeunePoleEmploiQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant,
            accessToken: 'coucou'
          },
          unUtilisateurDecode()
        )
        .resolves(failure(new DroitsInsuffisants()))

      await request(app.getHttpServer())
        .get(
          `/jeunes/${idJeune}/pole-emploi/accueil?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/pole-emploi/accueil?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00'
    )
  })
})

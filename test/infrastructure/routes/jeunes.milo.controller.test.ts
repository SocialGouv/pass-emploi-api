import { HttpStatus, INestApplication } from '@nestjs/common'

import * as request from 'supertest'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { AccueilJeuneMiloQueryModel } from '../../../src/application/queries/query-models/jeunes.query-model'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { StubbedClass } from '../../utils'

import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { DateService } from '../../../src/utils/date-service'

import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { GetAccueilJeuneMiloQueryHandler } from 'src/application/queries/accueil/get-accueil-jeune-milo-query-handler'

describe('JeunesMiloController', () => {
  let getAccueilJeuneMiloQueryHandler: StubbedClass<GetAccueilJeuneMiloQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let dateService: StubbedClass<DateService>
  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAccueilJeuneMiloQueryHandler = app.get(GetAccueilJeuneMiloQueryHandler)
    jwtService = app.get(JwtService)
    dateService = app.get(DateService)
    dateService.now.returns(now)
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
  })

  describe('GET /jeunes/:idJeune/milo/accueil', () => {
    const idJeune = '1'
    const maintenant = '2023-03-03'
    const accueilJeuneQueryModel: AccueilJeuneMiloQueryModel = {
      dateDerniereMiseAJour: undefined,
      cetteSemaine: {
        nombreRendezVous: 1,
        nombreActionsDemarchesEnRetard: 1,
        nombreActionsDemarchesARealiser: 1
      },
      prochainRendezVous: undefined,
      evenementsAVenir: [],
      mesAlertes: [],
      mesFavoris: []
    }
    it("renvoie l'accueil d'un jeune MILO sans personnalisation", async () => {
      getAccueilJeuneMiloQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant
          },
          unUtilisateurDecode()
        )
        .resolves(success(accueilJeuneQueryModel))
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        dateDerniereMiseAJour,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        prochainRendezVous,
        ...accueilJeuneQueryModelResume
      } = accueilJeuneQueryModel
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/milo/accueil?maintenant=2023-03-03`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect({ ...accueilJeuneQueryModelResume })
    })
    it('renvoie une erreur quand le jeune est un jeune PE', async () => {
      getAccueilJeuneMiloQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant
          },
          unUtilisateurDecode()
        )
        .resolves(failure(new DroitsInsuffisants()))
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/milo/accueil?maintenant=2023-03-03`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/milo/accueil')
  })
})
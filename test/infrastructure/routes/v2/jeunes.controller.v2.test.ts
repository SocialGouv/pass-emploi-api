import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  ActionsByJeuneOutput,
  GetActionsByJeuneQueryHandler
} from '../../../../src/application/queries/get-actions-by-jeune.query.handler.db'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode
} from '../../../fixtures/authentification.fixture'
import { enleverLesUndefined, expect, StubbedClass } from '../../../utils'
import { getApplicationWithStubbedDependencies } from '../../../utils/module-for-testing'
import { JeuneHomeAgendaPoleEmploiQueryModel } from '../../../../src/application/queries/query-models/home-jeune-suivi.query-model'
import { uneDemarcheQueryModel } from '../../../fixtures/query-models/demarche.query-model.fixtures'
import { DateTime } from 'luxon'
import { ensureUserAuthenticationFailsIfInvalid } from '../../../utils/ensure-user-authentication-fails-if-invalid'
import { JwtService } from '../../../../src/infrastructure/auth/jwt.service'
import { GetJeuneHomeAgendaPoleEmploiQueryHandler } from '../../../../src/application/queries/get-jeune-home-agenda-pole-emploi.query.handler'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../../src/application/queries/get-jeune-home-demarches.query.handler'
import { RendezVousJeuneQueryModel } from '../../../../src/application/queries/query-models/rendez-vous.query-model'
import { RendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { GetRendezVousJeuneQueryHandler } from '../../../../src/application/queries/get-rendez-vous-jeune.query.handler.db'
import { GetRendezVousJeunePoleEmploiQueryHandler } from '../../../../src/application/queries/get-rendez-vous-jeune-pole-emploi.query.handler'
import { Cached } from '../../../../src/building-blocks/types/query'
import { JeuneHomeDemarcheQueryModel } from '../../../../src/application/queries/query-models/home-jeune.query-model'

describe('JeunesController v2', () => {
  let getActionsByJeuneQueryHandler: StubbedClass<GetActionsByJeuneQueryHandler>
  let getJeuneHomeAgendaPoleEmploiQueryHandler: StubbedClass<GetJeuneHomeAgendaPoleEmploiQueryHandler>
  let getJeuneHomeDemarchesQueryHandler: StubbedClass<GetJeuneHomeDemarchesQueryHandler>
  let getRendezVousJeunePoleEmploiQueryHandler: StubbedClass<GetRendezVousJeunePoleEmploiQueryHandler>
  let getRendezVousJeuneQueryHandler: StubbedClass<GetRendezVousJeuneQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getActionsByJeuneQueryHandler = app.get(GetActionsByJeuneQueryHandler)
    getJeuneHomeAgendaPoleEmploiQueryHandler = app.get(
      GetJeuneHomeAgendaPoleEmploiQueryHandler
    )
    getJeuneHomeDemarchesQueryHandler = app.get(
      GetJeuneHomeDemarchesQueryHandler
    )
    getRendezVousJeunePoleEmploiQueryHandler = app.get(
      GetRendezVousJeunePoleEmploiQueryHandler
    )
    getRendezVousJeuneQueryHandler = app.get(GetRendezVousJeuneQueryHandler)
    jwtService = app.get(JwtService)
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
          nombreNonQualifiables: 6,
          nombreAQualifier: 7,
          nombreQualifiees: 8,
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

  describe('GET /v2/jeunes/:idJeune/home/agenda/pole-emploi', () => {
    const idJeune = '1'
    const maintenant = '2022-08-17T12:00:30+02:00'
    const queryModel: JeuneHomeAgendaPoleEmploiQueryModel = {
      demarches: [
        enleverLesUndefined(uneDemarcheQueryModel()),
        enleverLesUndefined(uneDemarcheQueryModel())
      ],
      rendezVous: [],
      metadata: {
        demarchesEnRetard: 2,
        dateDeFin: new Date(maintenant),
        dateDeDebut: new Date(maintenant)
      }
    }
    it('retourne la home agenda du jeune quand tout se passe bien', async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      const data: Cached<JeuneHomeAgendaPoleEmploiQueryModel> = {
        queryModel,
        dateDuCache: uneDatetime()
      }
      getJeuneHomeAgendaPoleEmploiQueryHandler.execute
        .withArgs(
          {
            idJeune,
            maintenant: DateTime.fromISO(maintenant, { setZone: true }),
            accessToken: 'coucou'
          },
          unUtilisateurDecode()
        )
        .resolves(success(data))

      // When
      await request(app.getHttpServer())
        .get(
          `/v2/jeunes/${idJeune}/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect({
          resultat: {
            demarches: queryModel.demarches,
            rendezVous: queryModel.rendezVous,
            metadata: {
              demarchesEnRetard: 2,
              dateDeFin: '2022-08-17T10:00:30.000Z',
              dateDeDebut: '2022-08-17T10:00:30.000Z'
            }
          },
          dateDerniereMiseAJour: uneDatetime().toJSDate().toISOString()
        })
    })
    it("rejette quand la date n'est pas au bon format", async () => {
      // Given
      jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())

      // When
      await request(app.getHttpServer())
        .get(
          `/v2/jeunes/${idJeune}/home/agenda/pole-emploi?maintenant=30122022`
        )
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/v2/jeunes/1/home/agenda/pole-emploi?maintenant=2022-08-17T12%3A00%3A30%2B02%3A00'
    )
  })

  describe('GET /v2/jeunes/:idJeune/home/demarches', () => {
    const idJeune = '1'
    describe("quand c'est en succès", () => {
      it('retourne la home demarches du jeune', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        const data: Cached<JeuneHomeDemarcheQueryModel> = {
          queryModel: {
            actions: []
          },
          dateDuCache: uneDatetime()
        }
        getJeuneHomeDemarchesQueryHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(success(data))

        // When
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/home/demarches`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect({
            resultat: { actions: [] },
            dateDerniereMiseAJour: uneDatetime().toJSDate().toISOString()
          })
      })
    })
    describe("quand c'est en échec", () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        getJeuneHomeDemarchesQueryHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(failure(new ErreurHttp("C'est cassé", 400)))

        // When
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/home/demarches`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/v2/jeunes/1/home/demarches')
  })

  describe('GET /v2/jeunes/:idJeune/rendez-vous', () => {
    const idJeune = '1'
    describe("quand c'est un jeune pole-emploi", () => {
      it('renvoie une 404 quand le jeune n"existe pas', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', '1'))
        )
        // When
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
      it('retourne les rdv', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
        const data: Cached<RendezVousJeuneQueryModel[]> = {
          queryModel: [],
          dateDuCache: uneDatetime()
        }
        getRendezVousJeunePoleEmploiQueryHandler.execute.resolves(success(data))

        // When
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect({
            resultat: [],
            dateDerniereMiseAJour: uneDatetime().toJSDate().toISOString()
          })
      })
    })

    describe("quand ce n'est pas un jeune pole-emploi", () => {
      const idJeune = '1'
      const rendezVousJeuneQueryModel: RendezVousJeuneQueryModel[] = []

      beforeEach(() => {
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      })

      it('renvoit une 404 quand le jeune n"existe pas', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          failure(new NonTrouveError('Jeune', '1'))
        )
        // When
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
      it("retourne tous les rendez-vous si aucune période n'est renseignée", async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          success(rendezVousJeuneQueryModel)
        )
        // When - Then
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
        expect(
          getRendezVousJeuneQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            periode: undefined
          },
          unUtilisateurDecode()
        )
      })
      it('retourne les rendez-vous futurs si periode FUTURS est renseignée', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          success(rendezVousJeuneQueryModel)
        )
        // When - Then
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous?periode=FUTURS`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
        expect(
          getRendezVousJeuneQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            periode: RendezVous.Periode.FUTURS
          },
          unUtilisateurDecode()
        )
      })
      it('retourne les rendez-vous passés si periode PASSES est renseignée', async () => {
        // Given
        getRendezVousJeuneQueryHandler.execute.resolves(
          success(rendezVousJeuneQueryModel)
        )
        // When - Then
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous?periode=PASSES`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
        expect(
          getRendezVousJeuneQueryHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune,
            periode: RendezVous.Periode.PASSES
          },
          unUtilisateurDecode()
        )
      })
      it('retourne une 400 quand periode est mal formatée', async () => {
        // When - Then
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/rendezvous?periode=XX`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/v2/jeunes/1/rendezvous')
  })
})

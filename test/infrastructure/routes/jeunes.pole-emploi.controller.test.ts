import { GetTokenPoleEmploiQueryHandler } from 'src/application/queries/get-token-pole-emploi.query.handler'
import { GetMonSuiviPoleEmploiQueryHandler } from 'src/application/queries/milo/get-mon-suivi-jeune.pole-emploi.query.handler.db'
import { StubbedClass, enleverLesUndefined } from '../../utils'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import { HttpStatus, INestApplication } from '@nestjs/common'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import { GetAccueilJeunePoleEmploiQueryHandler } from '../../../src/application/queries/pole-emploi/get-accueil-jeune-pole-emploi.query.handler.db'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { failure, success } from '../../../src/building-blocks/types/result'
import {
  DroitsInsuffisants,
  ErreurHttp
} from '../../../src/building-blocks/types/domain-error'
import {
  AccueilJeunePoleEmploiQueryModel,
  CVPoleEmploiQueryModel,
  MonSuiviPoleEmploiQueryModel
} from '../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import * as request from 'supertest'
import { GetCVPoleEmploiQueryHandler } from '../../../src/application/queries/get-cv-pole-emploi.query.handler'
import { DateTime } from 'luxon'
import { GetJeuneHomeDemarchesQueryHandler } from '../../../src/application/queries/get-jeune-home-demarches.query.handler'
import { GetSuiviSemainePoleEmploiQueryHandler } from '../../../src/application/queries/get-suivi-semaine-pole-emploi.query.handler'
import { SuiviSemainePoleEmploiQueryModel } from '../../../src/application/queries/query-models/home-jeune-suivi.query-model'
import { JeuneHomeDemarcheQueryModel } from '../../../src/application/queries/query-models/home-jeune.query-model'
import { Cached } from '../../../src/building-blocks/types/query'
import { uneDatetime, uneDatetimeAvecOffset } from '../../fixtures/date.fixture'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'
import { CreateDemarcheCommandHandler } from '../../../src/application/commands/pole-emploi/create-demarche.command.handler'
import { UpdateStatutDemarcheCommandHandler } from '../../../src/application/commands/pole-emploi/update-demarche.command.handler'
import { Demarche } from '../../../src/domain/demarche'
import {
  UpdateStatutDemarchePayload,
  CreateDemarchePayload
} from '../../../src/infrastructure/routes/validation/demarches.inputs'
import { uneDemarche } from '../../fixtures/demarche.fixture'
import { Core } from '../../../src/domain/core'

describe('JeunesPoleEmploiController', () => {
  let getAccueilJeunePoleEmploiQueryHandler: StubbedClass<GetAccueilJeunePoleEmploiQueryHandler>
  let getCVPoleEmploiQueryHandler: StubbedClass<GetCVPoleEmploiQueryHandler>
  let getTokenPoleEmploiQueryHandler: StubbedClass<GetTokenPoleEmploiQueryHandler>
  let getJeuneHomeAgendaPoleEmploiQueryHandler: StubbedClass<GetSuiviSemainePoleEmploiQueryHandler>
  let getJeuneHomeDemarchesQueryHandler: StubbedClass<GetJeuneHomeDemarchesQueryHandler>
  let updateStatutDemarcheCommandHandler: StubbedClass<UpdateStatutDemarcheCommandHandler>
  let createDemarcheCommandHandler: StubbedClass<CreateDemarcheCommandHandler>
  let getMonSuiviPoleEmploiCommandHandler: StubbedClass<GetMonSuiviPoleEmploiQueryHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getAccueilJeunePoleEmploiQueryHandler = app.get(
      GetAccueilJeunePoleEmploiQueryHandler
    )
    getCVPoleEmploiQueryHandler = app.get(GetCVPoleEmploiQueryHandler)
    getTokenPoleEmploiQueryHandler = app.get(GetTokenPoleEmploiQueryHandler)
    getJeuneHomeAgendaPoleEmploiQueryHandler = app.get(
      GetSuiviSemainePoleEmploiQueryHandler
    )
    getJeuneHomeDemarchesQueryHandler = app.get(
      GetJeuneHomeDemarchesQueryHandler
    )
    updateStatutDemarcheCommandHandler = app.get(
      UpdateStatutDemarcheCommandHandler
    )
    getMonSuiviPoleEmploiCommandHandler = app.get(
      GetMonSuiviPoleEmploiQueryHandler
    )
    createDemarcheCommandHandler = app.get(CreateDemarcheCommandHandler)
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
        nombreActionsDemarchesARealiser: 1,
        nombreActionsDemarchesAFaireSemaineCalendaire: 1
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
            accessToken: 'coucou',
            structure: Core.Structure.MILO
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
            nombreActionsDemarchesARealiser: 1,
            nombreActionsDemarchesAFaireSemaineCalendaire: 1
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
            accessToken: 'coucou',
            structure: Core.Structure.MILO
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

  describe('GET /jeunes/:idJeune/pole-emplpoi/cv', () => {
    it('renvoie la liste des CVs du jeune', async () => {
      // Given
      const idJeune = 'un-id-jeune'
      const listeCvQueryModel: CVPoleEmploiQueryModel[] = [
        { nomFichier: 'un-nom-fichier.pdf', titre: 'un-titre', url: 'un-url' }
      ]
      getCVPoleEmploiQueryHandler.execute.resolves(success(listeCvQueryModel))

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}/pole-emploi/cv`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(listeCvQueryModel)
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1/pole-emploi/cv')
  })

  describe('GET /v2/jeunes/:idJeune/home/agenda/pole-emploi', () => {
    const idJeune = '1'
    const maintenant = '2022-08-17T12:00:30+02:00'
    const queryModel: SuiviSemainePoleEmploiQueryModel = {
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
      const data: Cached<SuiviSemainePoleEmploiQueryModel> = {
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

  describe('PUT /jeunes/:idJeune/demarches/:idDemarche/statut', () => {
    const idJeune = '1'
    const idDemarche = 'demarche'
    const payload: UpdateStatutDemarchePayload = {
      statut: Demarche.Statut.REALISEE,
      dateFin: uneDatetimeAvecOffset().toISO()
    }
    const demarche = uneDemarche()
    describe("quand c'est en succès", () => {
      it('met à jour le statut et retourne la demarche', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateStatutDemarcheCommandHandler.execute
          .withArgs(
            {
              statut: payload.statut,
              dateFin: uneDatetimeAvecOffset(),
              dateDebut: undefined,
              idJeune,
              idDemarche,
              accessToken: 'coucou'
            },
            unUtilisateurDecode()
          )
          .resolves(success(demarche))

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/demarches/${idDemarche}/statut`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.OK)
      })
    })
    describe("quand c'est en échec", () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        updateStatutDemarcheCommandHandler.execute.resolves(
          failure(new ErreurHttp("C'est cassé", 400))
        )

        // When
        await request(app.getHttpServer())
          .put(`/jeunes/${idJeune}/demarches/${idDemarche}/statut`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'put',
      '/jeunes/1/demarches/123/statut'
    )
  })

  describe('POST /jeunes/:idJeune/demarches', () => {
    const idJeune = '1'
    const payload: CreateDemarchePayload = {
      description: 'string',
      dateFin: uneDatetimeAvecOffset().toISO(),
      estDuplicata: true
    }
    const demarche = uneDemarche()
    describe("quand c'est en succès", () => {
      it('crée et retourne la demarche', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        createDemarcheCommandHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou',
              description: payload.description,
              dateFin: uneDatetimeAvecOffset(),
              estDuplicata: true
            },
            unUtilisateurDecode()
          )
          .resolves(success(demarche))

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/${idJeune}/demarches`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.CREATED)
      })
    })
    describe("quand c'est en échec", () => {
      it('renvoie une erreur HTTP', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
        createDemarcheCommandHandler.execute
          .withArgs(
            {
              idJeune,
              accessToken: 'coucou',
              description: payload.description,
              dateFin: uneDatetimeAvecOffset(),
              estDuplicata: true
            },
            unUtilisateurDecode()
          )
          .resolves(failure(new ErreurHttp("C'est cassé", 400)))

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/${idJeune}/demarches`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie une erreur 400 quand la description ne respecte pas la longeur autorisée', async () => {
        // Given
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/${idJeune}/demarches`)
          .set('authorization', unHeaderAuthorization())
          .send({ ...payload, description: 'a' })
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/1/demarches')
  })

  describe('GET /jeunes/:idJeune/pole-emplpoi/idp-token', () => {
    it('renvoie le token d’identité d’un jeune', async () => {
      // Given
      getTokenPoleEmploiQueryHandler.execute.resolves(success('idp-token'))

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/id-jeune/pole-emploi/idp-token`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect('idp-token')
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/pole-emploi/idp-token'
    )
  })

  describe('GET /jeunes/:idJeune/pole-emploi/mon-suivi', () => {
    it('renvoie le suivi d’un jeune', async () => {
      // Given
      const data: Cached<MonSuiviPoleEmploiQueryModel> = {
        queryModel: { demarches: [], rendezVous: [] },
        dateDuCache: uneDatetime()
      }
      getMonSuiviPoleEmploiCommandHandler.execute
        .withArgs(
          {
            idJeune: 'id-jeune',
            dateDebut: DateTime.fromISO('2023-04-12'),
            accessToken: 'coucou'
          },
          unUtilisateurDecode()
        )
        .resolves(success(data))

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/id-jeune/pole-emploi/mon-suivi`)
        .query({ dateDebut: '2023-04-12' })
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect({
          resultat: data.queryModel,
          dateDerniereMiseAJour: uneDatetime().toISO()
        })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/pole-emploi/idp-token'
    )
  })
})

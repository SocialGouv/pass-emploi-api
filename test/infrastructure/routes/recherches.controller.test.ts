import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { CreateRechercheFromSuggestionCommandHandler } from '../../../src/application/commands/create-recherche-from-suggestion.command.handler'
import { CreateRechercheCommandHandler } from '../../../src/application/commands/create-recherche.command.handler'
import {
  DeleteRechercheCommand,
  DeleteRechercheCommandHandler
} from '../../../src/application/commands/delete-recherche.command.handler'
import { RefuserSuggestionCommandHandler } from '../../../src/application/commands/refuser-suggestion.command.handler'
import { RafraichirSuggestionPoleEmploiCommandHandler } from '../../../src/application/commands/rafraichir-suggestion-pole-emploi.command.handler'
import { GetRecherchesQueryHandler } from '../../../src/application/queries/get-recherches.query.handler.db'
import { GetSuggestionsQueryHandler } from '../../../src/application/queries/get-suggestions.query.handler.db'
import { RechercheQueryModel } from '../../../src/application/queries/query-models/recherches.query-model'
import { SuggestionQueryModel } from '../../../src/application/queries/query-models/suggestion.query-model'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { Offre } from '../../../src/domain/offre/offre'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { JwtService } from '../../../src/infrastructure/auth/jwt.service'
import {
  CreateRechercheImmersionPayload,
  CreateRechercheOffresEmploiPayload
} from '../../../src/infrastructure/routes/validation/recherches.inputs'
import {
  unHeaderAuthorization,
  unJwtPayloadValide,
  unJwtPayloadValideJeunePE,
  unUtilisateurDecode,
  unUtilisateurDecodePoleEmploi
} from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe('RecherchesController', () => {
  let createRechercheCommandHandler: StubbedClass<CreateRechercheCommandHandler>
  let getRecherchesQueryHandler: StubbedClass<GetRecherchesQueryHandler>
  let deleteRechercheCommandHandler: StubbedClass<DeleteRechercheCommandHandler>
  let rafraichirSuggestionPoleEmploiCommandHandler: StubbedClass<RafraichirSuggestionPoleEmploiCommandHandler>
  let getSuggestionsQueryHandler: StubbedClass<GetSuggestionsQueryHandler>
  let createRechercheFromSuggestionCommandHandler: StubbedClass<CreateRechercheFromSuggestionCommandHandler>
  let refuserSuggestionCommandHandler: StubbedClass<RefuserSuggestionCommandHandler>
  let jwtService: StubbedClass<JwtService>
  let app: INestApplication

  beforeEach(async () => {
    createRechercheCommandHandler = stubClass(CreateRechercheCommandHandler)
    getRecherchesQueryHandler = stubClass(GetRecherchesQueryHandler)
    deleteRechercheCommandHandler = stubClass(DeleteRechercheCommandHandler)
    refuserSuggestionCommandHandler = stubClass(RefuserSuggestionCommandHandler)
    createRechercheFromSuggestionCommandHandler = stubClass(
      CreateRechercheFromSuggestionCommandHandler
    )
    rafraichirSuggestionPoleEmploiCommandHandler = stubClass(
      RafraichirSuggestionPoleEmploiCommandHandler
    )
    getSuggestionsQueryHandler = stubClass(GetSuggestionsQueryHandler)
    jwtService = stubClass(JwtService)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateRechercheCommandHandler)
      .useValue(createRechercheCommandHandler)
      .overrideProvider(GetRecherchesQueryHandler)
      .useValue(getRecherchesQueryHandler)
      .overrideProvider(DeleteRechercheCommandHandler)
      .useValue(deleteRechercheCommandHandler)
      .overrideProvider(RafraichirSuggestionPoleEmploiCommandHandler)
      .useValue(rafraichirSuggestionPoleEmploiCommandHandler)
      .overrideProvider(GetSuggestionsQueryHandler)
      .useValue(getSuggestionsQueryHandler)
      .overrideProvider(CreateRechercheFromSuggestionCommandHandler)
      .useValue(createRechercheFromSuggestionCommandHandler)
      .overrideProvider(RefuserSuggestionCommandHandler)
      .useValue(refuserSuggestionCommandHandler)
      .overrideProvider(JwtService)
      .useValue(jwtService)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  beforeEach(() => {
    jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
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
            q: 'informatique',
            alternance: true,
            departement: 'Ile-de-France',
            experience: [Offre.Emploi.Experience.moinsdUnAn],
            debutantAccepte: true,
            contrat: [Offre.Emploi.Contrat.cdi, Offre.Emploi.Contrat.cdd],
            duree: [Offre.Emploi.Duree.tempsPartiel],
            rayon: 10,
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
              q: 'informatique',
              alternance: true,
              departement: 'Ile-de-France',
              experience: [Offre.Emploi.Experience.moinsdUnAn],
              debutantAccepte: true,
              contrat: [Offre.Emploi.Contrat.cdi, Offre.Emploi.Contrat.cdd],
              duree: [Offre.Emploi.Duree.tempsPartiel],
              rayon: 10,
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
  describe('POST /recherches/services-civiques', () => {
    describe('Quand la recherche est un service civique', () => {
      it('crée la recherche avec les critères renseignés', async () => {
        // Given
        const payload = {
          titre: 'Ma recherche',
          localisation: 'Saint Étienne',
          criteres: {
            domaine: 'Le yolo domaine',
            lat: 12345,
            lon: 67890,
            distance: 30,
            dateDeDebutMinimum: uneDatetime.toJSDate().toISOString()
          }
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches/services-civique')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          createRechercheCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            metier: undefined,
            idJeune: '1',
            type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
            titre: 'Ma recherche',
            localisation: 'Saint Étienne',
            criteres: {
              domaine: 'Le yolo domaine',
              lat: 12345,
              lon: 67890,
              distance: 30,
              dateDeDebutMinimum: uneDatetime.toUTC().toISO()
            }
          },
          unUtilisateurDecode()
        )
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/1/recherches/services-civique'
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
            q: 'informatique',
            alternance: true,
            experience: [Offre.Emploi.Experience.moinsdUnAn],
            debutantAccepte: true,
            contrat: [Offre.Emploi.Contrat.cdi, Offre.Emploi.Contrat.cdd],
            duree: [Offre.Emploi.Duree.tempsPartiel],
            rayon: 10,
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

  describe('DELETE /jeunes/:idJeune/recherches/:idRecherche', () => {
    const recherche = uneRecherche()
    const jeune = unJeune()
    const command: DeleteRechercheCommand = {
      idJeune: jeune.id,
      idRecherche: recherche.id
    }
    it('supprime la recherche', async () => {
      //Given
      deleteRechercheCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/recherches/${recherche.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)
      expect(
        deleteRechercheCommandHandler.execute
      ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
    })
    it('renvoie une 404(NOT FOUND) si la recherche n"existe pas', async () => {
      //Given
      deleteRechercheCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new NonTrouveError('Recherche', command.idRecherche)))

      const expectedMessageJson = {
        code: 'NON_TROUVE',
        message: `Recherche ${command.idRecherche} non trouvé(e)`
      }
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/recherches/${recherche.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedMessageJson)
    })
    it("renvoie une 400(BAD REQUEST) si l'id de la recherche n'est pas un UUID", async () => {
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/recherches/12`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid(
      'delete',
      '/jeunes/ABCDE/recherches/123'
    )
  })

  describe('GET /recherches/suggestions', () => {
    const queryModel: SuggestionQueryModel = {
      id: 'f781ae20-8838-49c7-aa2e-9b224318fb65',
      titre: 'Petrisseur',
      type: Offre.Recherche.Type.OFFRES_EMPLOI,
      metier: 'Boulanger',
      localisation: 'Lille',
      dateCreation: uneDatetime.toISO(),
      dateRafraichissement: uneDatetime.toISO()
    }

    describe("quand c'est un jeune pole emploi", () => {
      beforeEach(() => {
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValideJeunePE())
      })
      describe('quand tout va bien', () => {
        it('rafraichit les suggestions pole emploi et retourne les suggestions', async () => {
          // Given
          rafraichirSuggestionPoleEmploiCommandHandler.execute.resolves(
            emptySuccess()
          )
          getSuggestionsQueryHandler.execute
            .withArgs({ idJeune: '1' }, unUtilisateurDecodePoleEmploi())
            .resolves([queryModel])

          // When
          await request(app.getHttpServer())
            .get('/jeunes/1/recherches/suggestions')
            .set('authorization', unHeaderAuthorization())

            // Then
            .expect(HttpStatus.OK)
            .expect([queryModel])
          expect(
            rafraichirSuggestionPoleEmploiCommandHandler.execute
          ).to.have.been.calledWithExactly(
            {
              idJeune: '1',
              token: 'coucou'
            },
            unUtilisateurDecodePoleEmploi()
          )
        })
      })
      describe('quand PE est down', () => {
        it('retourne une erreur', async () => {
          // Given
          rafraichirSuggestionPoleEmploiCommandHandler.execute.resolves(
            failure(new ErreurHttp('Erreur', 500))
          )
          // When
          await request(app.getHttpServer())
            .get('/jeunes/1/recherches/suggestions')
            .set('authorization', unHeaderAuthorization())

            // Then
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        })
      })
    })
    describe("quand c'est un jeune autre que pole emploi", () => {
      beforeEach(() => {
        jwtService.verifyTokenAndGetJwt.resolves(unJwtPayloadValide())
      })
      describe('quand tout va bien', () => {
        it('ne rafraichit pas les suggestions et renvoie les suggestions', async () => {
          // Given
          getSuggestionsQueryHandler.execute
            .withArgs({ idJeune: '1' }, unUtilisateurDecode())
            .resolves([queryModel])

          // When
          await request(app.getHttpServer())
            .get('/jeunes/1/recherches/suggestions')
            .set('authorization', unHeaderAuthorization())

            // Then
            .expect(HttpStatus.OK)
            .expect([queryModel])
          expect(
            rafraichirSuggestionPoleEmploiCommandHandler.execute
          ).not.to.have.been.called()
        })
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/jeunes/1/recherches/suggestions'
    )
  })

  describe('POST /recherches/suggestions/:idSuggestion/accepter', () => {
    describe('quand la suggestion existe', () => {
      it('crée la recherche correspondante', async () => {
        // Given
        const idSuggestion = 'id-suggestion'
        createRechercheFromSuggestionCommandHandler.execute.resolves(
          emptySuccess()
        )

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/1/recherches/suggestions/${idSuggestion}/accepter`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.CREATED)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'post',
        '/jeunes/1/recherches/suggestions/123/accepter'
      )
    })
  })

  describe('POST /recherches/suggestions/:idSuggestion/refuser', () => {
    describe('quand la suggestion existe', () => {
      it('supprime la suggestion', async () => {
        // Given
        const idSuggestion = 'id-suggestion'
        refuserSuggestionCommandHandler.execute.resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post(`/jeunes/1/recherches/suggestions/${idSuggestion}/refuser`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/jeunes/1/recherches/suggestions/123/refuser'
    )
  })
})

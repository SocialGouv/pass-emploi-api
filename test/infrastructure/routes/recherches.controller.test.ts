import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
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
  CreateRechercheOffresEmploiPayload,
  CreateRechercheServiceCiviquePayload
} from '../../../src/infrastructure/routes/validation/recherches.inputs'
import { GetRecherchesQueryHandler } from '../../../src/application/queries/get-recherches.query.handler.db'
import { RechercheQueryModel } from '../../../src/application/queries/query-models/recherches.query-model'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import {
  DeleteRechercheCommand,
  DeleteRechercheCommandHandler
} from '../../../src/application/commands/delete-recherche.command.handler'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'

describe('RecherchesController', () => {
  let createRechercheCommandHandler: StubbedClass<CreateRechercheCommandHandler>
  let getRecherchesQueryHandler: StubbedClass<GetRecherchesQueryHandler>
  let deleteRechercheCommandHandler: StubbedClass<DeleteRechercheCommandHandler>
  let app: INestApplication

  before(async () => {
    createRechercheCommandHandler = stubClass(CreateRechercheCommandHandler)
    getRecherchesQueryHandler = stubClass(GetRecherchesQueryHandler)
    deleteRechercheCommandHandler = stubClass(DeleteRechercheCommandHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateRechercheCommandHandler)
      .useValue(createRechercheCommandHandler)
      .overrideProvider(GetRecherchesQueryHandler)
      .useValue(getRecherchesQueryHandler)
      .overrideProvider(DeleteRechercheCommandHandler)
      .useValue(deleteRechercheCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
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
            q: 'informatique',
            alternance: true,
            departement: 'Ile-de-France',
            experience: [Experience.moinsdUnAn],
            debutantAccepte: true,
            contrat: [Contrat.cdi, Contrat.cdd],
            duree: [Duree.tempsPartiel],
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
              experience: [Experience.moinsdUnAn],
              debutantAccepte: true,
              contrat: [Contrat.cdi, Contrat.cdd],
              duree: [Duree.tempsPartiel],
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
        const createRecherchePayload: CreateRechercheServiceCiviquePayload = {
          titre: 'Ma recherche',
          localisation: 'Saint Étienne',
          criteres: {
            domaine: 'Le yolo domaine',
            lat: 12345,
            lon: 67890,
            distance: 30,
            dateDeDebutMinimum: '1998-07-12T10:12:14.000Z'
          }
        }

        // When
        await request(app.getHttpServer())
          .post('/jeunes/1/recherches/services-civique')
          .set('authorization', unHeaderAuthorization())
          .send(createRecherchePayload)

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
              dateDeDebutMinimum: '1998-07-12T10:12:14.000Z'
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
            experience: [Experience.moinsdUnAn],
            debutantAccepte: true,
            contrat: [Contrat.cdi, Contrat.cdd],
            duree: [Duree.tempsPartiel],
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
    it('renvoie une 400(BAD REQUEST) si l"id de la recherche n"est pas un UUID', async () => {
      const expectedMessageJson = {
        statusCode: 400,
        message: 'Validation failed (uuid  is expected)',
        error: 'Bad Request'
      }
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/recherches/12`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.BAD_REQUEST)
        .expect(expectedMessageJson)
    })
    ensureUserAuthenticationFailsIfInvalid(
      'delete',
      '/jeunes/ABCDE/recherches/123'
    )
  })
})

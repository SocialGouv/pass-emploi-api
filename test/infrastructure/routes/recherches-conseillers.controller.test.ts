import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { CreateSuggestionConseillerImmersionCommandHandler } from 'src/application/commands/create-suggestion-conseiller-immersion.command.handler'
import { CreateSuggestionConseillerServiceCiviqueCommandHandler } from 'src/application/commands/create-suggestion-conseiller-service-civique.command.handler'
import {
  CreateSuggestionImmersionsPayload,
  CreateSuggestionOffresEmploiPayload,
  CreateSuggestionServicesCiviquePayload
} from 'src/infrastructure/routes/validation/recherches.inputs'
import * as request from 'supertest'
import { CreateSuggestionConseillerOffreEmploiCommandHandler } from '../../../src/application/commands/create-suggestion-conseiller-offre-emploi.command.handler'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

const idConseiller = 'id-conseiller'

describe('RecherchesConseillersController', () => {
  let createSuggestionDuConseillerCommandHandler: StubbedClass<CreateSuggestionConseillerOffreEmploiCommandHandler>
  let createSuggestionConseillerImmersionCommandHandler: StubbedClass<CreateSuggestionConseillerImmersionCommandHandler>
  let createSuggestionConseillerServiceCiviqueCommandHandler: StubbedClass<CreateSuggestionConseillerServiceCiviqueCommandHandler>
  let app: INestApplication

  before(async () => {
    createSuggestionDuConseillerCommandHandler = stubClass(
      CreateSuggestionConseillerOffreEmploiCommandHandler
    )
    createSuggestionConseillerImmersionCommandHandler = stubClass(
      CreateSuggestionConseillerImmersionCommandHandler
    )
    createSuggestionConseillerServiceCiviqueCommandHandler = stubClass(
      CreateSuggestionConseillerServiceCiviqueCommandHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateSuggestionConseillerOffreEmploiCommandHandler)
      .useValue(createSuggestionDuConseillerCommandHandler)
      .overrideProvider(CreateSuggestionConseillerImmersionCommandHandler)
      .useValue(createSuggestionConseillerImmersionCommandHandler)
      .overrideProvider(CreateSuggestionConseillerServiceCiviqueCommandHandler)
      .useValue(createSuggestionConseillerServiceCiviqueCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /conseillers/:idConseiller/recherches/suggestions/offres-emploi', () => {
    it('renvoie un code Bad Request quand la liste des ids jeunes est vide', async () => {
      // Given
      const suggestionPayload: CreateSuggestionOffresEmploiPayload = {
        idsJeunes: [],
        localisation: 'paris',
        q: 'Boulanger',
        departement: 'Paris'
      }

      // When - Then
      await request(app.getHttpServer())
        .post(
          `/conseillers/${idConseiller}/recherches/suggestions/offres-emploi`
        )
        .set('authorization', unHeaderAuthorization())
        .send(suggestionPayload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('retourne un code Bad Request quand la localisation est manquante', async () => {
      // Given
      const suggestionPayload = {
        idsJeunes: ['1'],
        q: 'Boulanger',
        departement: 'Paris'
      }

      // When - Then
      await request(app.getHttpServer())
        .post(
          `/conseillers/${idConseiller}/recherches/suggestions/offres-emploi`
        )
        .set('authorization', unHeaderAuthorization())
        .send(suggestionPayload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('retourne un code Bad Request quand commune ET département sont manquantes', async () => {
      // Given
      const suggestionPayload = {
        idsJeunes: ['1'],
        localisation: 'Paris',
        q: 'Boulanger'
      }

      // When - Then
      await request(app.getHttpServer())
        .post(
          `/conseillers/${idConseiller}/recherches/suggestions/offres-emploi`
        )
        .set('authorization', unHeaderAuthorization())
        .send(suggestionPayload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('crée la suggestion', async () => {
      // Given
      const suggestionPayload: CreateSuggestionOffresEmploiPayload = {
        idsJeunes: ['1'],
        localisation: 'paris',
        q: 'Boulanger',
        departement: 'Paris',
        alternance: true
      }

      createSuggestionDuConseillerCommandHandler.execute.resolves(
        emptySuccess()
      )
      // When - Then
      await request(app.getHttpServer())
        .post(
          `/conseillers/${idConseiller}/recherches/suggestions/offres-emploi`
        )
        .set('authorization', unHeaderAuthorization())
        .send(suggestionPayload)
        .expect(HttpStatus.CREATED)

      expect(
        createSuggestionDuConseillerCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller,
          idsJeunes: suggestionPayload.idsJeunes,
          localisation: suggestionPayload.localisation,
          metier: undefined,
          titre: undefined,
          criteres: {
            q: 'Boulanger',
            departement: 'Paris',
            commune: undefined,
            alternance: true
          }
        },
        unUtilisateurDecode()
      )
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/recherches/suggestions/offres-emploi'
    )
  })

  describe('POST /conseillers/:idConseiller/recherches/suggestions/immersions', () => {
    it('crée la suggestion', async () => {
      // Given
      const suggestionPayload: CreateSuggestionImmersionsPayload = {
        idsJeunes: ['1'],
        localisation: 'Paris',
        rome: 'a',
        lat: 10,
        lon: 10
      }

      createSuggestionConseillerImmersionCommandHandler.execute.resolves(
        emptySuccess()
      )
      // When - Then
      await request(app.getHttpServer())
        .post(`/conseillers/${idConseiller}/recherches/suggestions/immersions`)
        .set('authorization', unHeaderAuthorization())
        .send(suggestionPayload)
        .expect(HttpStatus.CREATED)

      expect(
        createSuggestionConseillerImmersionCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller,
          idsJeunes: suggestionPayload.idsJeunes,
          localisation: 'Paris',
          metier: undefined,
          titre: undefined,
          criteres: {
            rome: 'a',
            lat: 10,
            lon: 10
          }
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/recherches/suggestions/immersions'
    )
  })

  describe('POST /conseillers/:idConseiller/recherches/suggestions/services-civique', () => {
    it('crée la suggestion', async () => {
      // Given
      const suggestionPayload: CreateSuggestionServicesCiviquePayload = {
        idsJeunes: ['1'],
        localisation: 'Paris',
        lat: 10,
        lon: 10
      }

      createSuggestionConseillerServiceCiviqueCommandHandler.execute.resolves(
        emptySuccess()
      )
      // When - Then
      await request(app.getHttpServer())
        .post(
          `/conseillers/${idConseiller}/recherches/suggestions/services-civique`
        )
        .set('authorization', unHeaderAuthorization())
        .send(suggestionPayload)
        .expect(HttpStatus.CREATED)

      expect(
        createSuggestionConseillerServiceCiviqueCommandHandler.execute
      ).to.have.been.calledWithExactly(
        {
          idConseiller,
          idsJeunes: suggestionPayload.idsJeunes,
          localisation: 'Paris',
          metier: undefined,
          titre: undefined,
          criteres: {
            lat: 10,
            lon: 10
          }
        },
        unUtilisateurDecode()
      )
    })
    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/recherches/suggestions/services-civique'
    )
  })
})

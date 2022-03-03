import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { CreateRendezVousCommandHandler } from 'src/application/commands/create-rendez-vous.command.handler'
import {
  CreerSuperviseursCommand,
  CreerSuperviseursCommandHandler
} from 'src/application/commands/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from 'src/application/commands/delete-superviseurs.command.handler'
import { GetAllRendezVousConseillerQueryHandler } from 'src/application/queries/get-rendez-vous-conseiller.query.handler'
import { Action } from 'src/domain/action'
import { CodeTypeRendezVous } from 'src/domain/rendez-vous'
import { CreateRendezVousPayload } from 'src/infrastructure/routes/validation/rendez-vous.inputs'
import * as request from 'supertest'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unRendezVousConseillerQueryModel } from 'test/fixtures/rendez-vous.fixture'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../../src/application/commands/creer-jeune-milo.command.handler'
import { SendNotificationNouveauMessageCommandHandler } from '../../../src/application/commands/send-notification-nouveau-message.command.handler'
import { GetConseillerByEmailQueryHandler } from '../../../src/application/queries/get-conseiller-by-email.query.handler'
import { GetDossierMiloJeuneQueryHandler } from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import { GetJeunesByConseillerQueryHandler } from '../../../src/application/queries/get-jeunes-by-conseiller.query.handler'
import {
  DroitsInsuffisants,
  ErreurHttpMilo,
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import {
  CreateActionPayload,
  EnvoyerNotificationsPayload
} from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unDossierMilo } from '../../fixtures/milo.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { unDetailJeuneQueryModel } from '../../fixtures/query-models/jeunes.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { SendNotificationsNouveauxMessagesCommandHandler } from '../../../src/application/commands/send-notifications-nouveaux-messages.command.handler'

describe('ConseillersController', () => {
  let getConseillerByEmailQueryHandler: StubbedClass<GetConseillerByEmailQueryHandler>
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let getJeunesByConseillerQueryHandler: StubbedClass<GetJeunesByConseillerQueryHandler>
  let sendNotificationNouveauMessage: StubbedClass<SendNotificationNouveauMessageCommandHandler>
  let sendNotificationsNouveauxMessages: StubbedClass<SendNotificationsNouveauxMessagesCommandHandler>
  let getDossierMiloJeuneQueryHandler: StubbedClass<GetDossierMiloJeuneQueryHandler>
  let getAllRendezVousConseillerQueryHandler: StubbedClass<GetAllRendezVousConseillerQueryHandler>
  let createRendezVousCommandHandler: StubbedClass<CreateRendezVousCommandHandler>
  let creerJeuneMiloCommandHandler: StubbedClass<CreerJeuneMiloCommandHandler>
  let creerSuperviseursCommandHandler: StubbedClass<CreerSuperviseursCommandHandler>
  let deleteSuperviseursCommandHandler: StubbedClass<DeleteSuperviseursCommandHandler>
  let app: INestApplication

  before(async () => {
    getConseillerByEmailQueryHandler = stubClass(
      GetConseillerByEmailQueryHandler
    )
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    sendNotificationNouveauMessage = stubClass(
      SendNotificationNouveauMessageCommandHandler
    )
    sendNotificationsNouveauxMessages = stubClass(
      SendNotificationsNouveauxMessagesCommandHandler
    )
    getDossierMiloJeuneQueryHandler = stubClass(GetDossierMiloJeuneQueryHandler)
    getAllRendezVousConseillerQueryHandler = stubClass(
      GetAllRendezVousConseillerQueryHandler
    )
    createRendezVousCommandHandler = stubClass(CreateRendezVousCommandHandler)
    creerJeuneMiloCommandHandler = stubClass(CreerJeuneMiloCommandHandler)
    getJeunesByConseillerQueryHandler = stubClass(
      GetJeunesByConseillerQueryHandler
    )
    creerSuperviseursCommandHandler = stubClass(CreerSuperviseursCommandHandler)
    deleteSuperviseursCommandHandler = stubClass(
      DeleteSuperviseursCommandHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetConseillerByEmailQueryHandler)
      .useValue(getConseillerByEmailQueryHandler)
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(SendNotificationNouveauMessageCommandHandler)
      .useValue(sendNotificationNouveauMessage)
      .overrideProvider(SendNotificationsNouveauxMessagesCommandHandler)
      .useValue(sendNotificationsNouveauxMessages)
      .overrideProvider(GetDossierMiloJeuneQueryHandler)
      .useValue(getDossierMiloJeuneQueryHandler)
      .overrideProvider(GetAllRendezVousConseillerQueryHandler)
      .useValue(getAllRendezVousConseillerQueryHandler)
      .overrideProvider(CreateRendezVousCommandHandler)
      .useValue(createRendezVousCommandHandler)
      .overrideProvider(CreerJeuneMiloCommandHandler)
      .useValue(creerJeuneMiloCommandHandler)
      .overrideProvider(GetJeunesByConseillerQueryHandler)
      .useValue(getJeunesByConseillerQueryHandler)
      .overrideProvider(CreerSuperviseursCommandHandler)
      .useValue(creerSuperviseursCommandHandler)
      .overrideProvider(DeleteSuperviseursCommandHandler)
      .useValue(deleteSuperviseursCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('GET /conseillers?email', () => {
    it("renvoie les infos du conseiller s'il existe ", async () => {
      // Given
      const queryModel = detailConseillerQueryModel()
      getConseillerByEmailQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?email=conseiller@email.fr')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(queryModel)

      expect(
        getConseillerByEmailQueryHandler.execute
      ).to.have.been.calledWithExactly(
        {
          emailConseiller: 'conseiller@email.fr',
          structureUtilisateur: Core.Structure.MILO
        },
        unUtilisateurDecode()
      )
    })

    it("renvoie un code 403 si l'utilisateur n'est pas superviseur ", async () => {
      // Given
      getConseillerByEmailQueryHandler.execute.rejects(new DroitsInsuffisants())

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?email=conseiller@email.fr&structure=POLE_EMPLOI')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers?email=conseiller@email.fr'
    )
  })

  describe('GET /conseillers/:idConseiller/jeunes', () => {
    it('renvoie la liste des jeunes du conseiller', async () => {
      // Given
      const listeJeunes = [unDetailJeuneQueryModel()]
      getJeunesByConseillerQueryHandler.execute.resolves(success(listeJeunes))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers/1/jeunes')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(listeJeunes)

      expect(
        getJeunesByConseillerQueryHandler.execute
      ).to.have.been.calledWithExactly(
        { idConseiller: '1' },
        unUtilisateurDecode()
      )
    })

    describe("quand l'utilisateur n'est pas autorisé", () => {
      it('renvoie une 403 Interdit', async () => {
        // Given
        getJeunesByConseillerQueryHandler.execute.rejects(
          new DroitsInsuffisants()
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/1/jeunes')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.FORBIDDEN)
      })
    })

    describe("quand le conseiller n'existe pas", () => {
      it('renvoie une 404 Non Trouve', async () => {
        // Given
        getJeunesByConseillerQueryHandler.execute.resolves(
          failure(new NonTrouveError('Conseiller', '1'))
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/1/jeunes')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe("quand le conseiller n'est pas autorisé", () => {
      it('renvoie une 403 Interdit', async () => {
        // Given
        getJeunesByConseillerQueryHandler.execute.resolves(
          failure(new DroitsInsuffisants())
        )

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/1/jeunes')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.FORBIDDEN)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/conseillers/1/jeunes')
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/action', () => {
    it("renvoie l'id de l'action créée", async () => {
      // Given
      const actionPayload: CreateActionPayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire'
      }
      const idAction = '15916d7e-f13a-4158-b7eb-3936aa937a0a'
      createActionCommandHandler.execute.resolves(success(idAction))

      // When - Then
      await request(app.getHttpServer())
        .post('/conseillers/1/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayload)
        .expect(HttpStatus.CREATED)
        .expect({ id: idAction })

      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: '1',
          typeCreateur: Action.TypeCreateur.CONSEILLER,
          commentaire: 'Ceci est un commentaire'
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/jeunes/ABCDE/action'
    )
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/notify-message', () => {
    describe('quand tout va bien', () => {
      it('renvoie void', async () => {
        // Given
        sendNotificationNouveauMessage.execute
          .withArgs({
            idConseiller: '1',
            idJeune: 'ABCDE'
          })
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/1/jeunes/ABCDE/notify-message')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)

        expect(
          sendNotificationNouveauMessage.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: 'ABCDE',
            idConseiller: '1'
          },
          unUtilisateurDecode()
        )
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        const result = failure(new NonTrouveError('Jeune', 'ZIZOU'))
        sendNotificationNouveauMessage.execute
          .withArgs({
            idConseiller: '1',
            idJeune: 'ZIZOU'
          })
          .resolves(result)

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/1/jeunes/ZIZOU/notify-message')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    describe("quand le conseiller n'est pas lié au jeune", () => {
      it('renvoie 404', async () => {
        // Given
        const result = failure(
          new JeuneNonLieAuConseillerError('JACQUET', 'ABCDE')
        )
        sendNotificationNouveauMessage.execute
          .withArgs({
            idConseiller: 'JACQUET',
            idJeune: 'ABCDE'
          })
          .resolves(result)

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/JACQUET/jeunes/ABCDE/notify-message')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/jeunes/ABCDE/notify-message'
    )
  })

  describe('POST /conseillers/:idConseiller/jeunes/notify-messages', () => {
    describe('quand tout va bien', () => {
      it('renvoie void', async () => {
        // Given
        const payload: EnvoyerNotificationsPayload = {
          idsJeunes: ['ABCDE', 'CJKDB']
        }

        sendNotificationsNouveauxMessages.execute
          .withArgs({
            idConseiller: '1',
            idsJeunes: ['ABCDE', 'CJKDB']
          })
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/1/jeunes/notify-messages')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)

        expect(
          sendNotificationsNouveauxMessages.execute
        ).to.have.been.calledWithExactly(
          {
            idsJeunes: payload.idsJeunes,
            idConseiller: '1'
          },
          unUtilisateurDecode()
        )
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/jeunes/notify-messages'
    )
  })

  describe('GET /conseillers/:idConseiller/rendezvous', () => {
    describe('quand le rendez-vous existe', () => {
      it('renvoie le rendezvous', async () => {
        // Given
        getAllRendezVousConseillerQueryHandler.execute
          .withArgs({ idConseiller: '41' }, unUtilisateurDecode())
          .resolves(unRendezVousConseillerQueryModel())

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/41/rendezvous')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(unRendezVousConseillerQueryModel()))
      })
    })
  })

  describe('POST /conseillers/:idConseiller/rendezvous', () => {
    it('crée le rendezvous quand tout va bien', async () => {
      // Given
      const idConseiller = '41'
      const payload: CreateRendezVousPayload = {
        jeuneId: '1',
        comment: '',
        date: uneDatetime.toJSDate().toISOString(),
        duration: 30,
        modality: 'rdv'
      }
      createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

      // When - Then
      await request(app.getHttpServer())
        .post(`/conseillers/${idConseiller}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.CREATED)
        .expect({ id: 'id-rdv' })

      expect(createRendezVousCommandHandler.execute).to.have.been.calledWith(
        {
          idJeune: payload.jeuneId,
          commentaire: payload.comment,
          date: payload.date,
          duree: payload.duration,
          modalite: payload.modality,
          idConseiller: idConseiller,
          type: undefined,
          precision: undefined,
          adresse: undefined,
          organisme: undefined,
          presenceConseiller: undefined
        },
        unUtilisateurDecode()
      )
    })
    it("retourne une 400 quand la date n'est pas une dateString", async () => {
      // Given
      const idConseiller = '41'
      const payload: CreateRendezVousPayload = {
        jeuneId: '1',
        comment: '',
        date: '',
        duration: 30
      }

      // When - Then
      await request(app.getHttpServer())
        .post(`/conseillers/${idConseiller}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it("retourne une 400 quand le type n'est pas bon", async () => {
      // Given
      const idConseiller = '41'
      const payload: CreateRendezVousPayload = {
        jeuneId: '1',
        comment: '',
        date: uneDatetime.toJSDate().toISOString(),
        duration: 30,
        type: 'blabla'
      }

      // When - Then
      await request(app.getHttpServer())
        .post(`/conseillers/${idConseiller}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it("retourne une 400 quand le champ precision n'est pas rempli", async () => {
      // Given
      const idConseiller = '41'
      const payload: CreateRendezVousPayload = {
        jeuneId: '1',
        comment: '',
        date: uneDatetime.toJSDate().toISOString(),
        duration: 30,
        type: CodeTypeRendezVous.AUTRE
      }

      // When - Then
      await request(app.getHttpServer())
        .post(`/conseillers/${idConseiller}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('retourne une 201 quand le champ precision est rempli', async () => {
      // Given
      const idConseiller = '41'
      const payload: CreateRendezVousPayload = {
        jeuneId: '1',
        comment: '',
        date: uneDatetime.toJSDate().toISOString(),
        duration: 30,
        type: CodeTypeRendezVous.AUTRE,
        precision: 'aa'
      }
      createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

      // When - Then
      await request(app.getHttpServer())
        .post(`/conseillers/${idConseiller}/rendezvous`)
        .set('authorization', unHeaderAuthorization())
        .send(payload)
        .expect(HttpStatus.CREATED)
        .expect({ id: 'id-rdv' })
    })
  })

  describe('GET /conseillers/milo/dossiers/:idDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le dossier', async () => {
        // Given
        getDossierMiloJeuneQueryHandler.execute
          .withArgs({ idDossier: '1' }, unUtilisateurDecode())
          .resolves(success(unDossierMilo()))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/dossiers/1')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(unDossierMilo()))
      })
    })

    describe("quand le dossier n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        // Given
        getDossierMiloJeuneQueryHandler.execute
          .withArgs({ idDossier: '2' }, unUtilisateurDecode())
          .resolves(failure(new ErreurHttpMilo('Pas trouvé', 404)))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/dossiers/2')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/dossiers/2'
    )
  })

  describe('POST /conseillers/milo/jeunes', () => {
    describe('quand le jeune est nouveau', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idDossier: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        creerJeuneMiloCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(success({ id: 'idJeune' }))

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send(command)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)
          .expect({ id: 'idJeune' })
      })
    })

    describe('quand le jeune est déjà chez nous', () => {
      it('renvoie 400', async () => {
        // Given
        // Given
        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new ErreurHttpMilo('email pas bon', 400))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/milo/dossiers/2'
    )
  })

  describe('POST /conseillers/superviseurs', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superviseurs: [
            { email: 'test@octo.com', structure: Core.Structure.MILO }
          ]
        }

        creerSuperviseursCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/superviseurs')
          .send(command)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)
      })
    })
    describe("quand le payload n'est pas valide", () => {
      it('renvoie 400 quand le champ email est pas bon', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test', structure: Core.Structure.MILO }]
        }

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie 400 quand le superviseur est incomplet', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test@octo.com' }]
        }

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/conseillers/superviseurs')
  })

  describe('DELETE /conseillers/superviseurs', () => {
    describe('quand le payload est valide', () => {
      it('renvoie 201', async () => {
        // Given
        const command: CreerSuperviseursCommand = {
          superviseurs: [
            { email: 'test@octo.com', structure: Core.Structure.MILO }
          ]
        }

        deleteSuperviseursCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .delete('/conseillers/superviseurs')
          .send(command)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NO_CONTENT)
      })
    })
    describe("quand le payload n'est pas valide", () => {
      it('renvoie 400 quand le champ email est pas bon', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test', structure: Core.Structure.MILO }]
        }

        // When - Then
        await request(app.getHttpServer())
          .delete('/conseillers/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('renvoie 400 quand le superviseur est incomplet', async () => {
        // Given
        const payload = {
          superviseurs: [{ email: 'test@octo.com' }]
        }

        // When - Then
        await request(app.getHttpServer())
          .delete('/conseillers/superviseurs')
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/conseillers/superviseurs')
  })
})

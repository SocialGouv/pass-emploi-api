import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { CreateRendezVousCommandHandler } from 'src/application/commands/create-rendez-vous.command.handler'
import {
  CreerSuperviseursCommand,
  CreerSuperviseursCommandHandler
} from 'src/application/commands/creer-superviseurs.command.handler'
import { DeleteSuperviseursCommandHandler } from 'src/application/commands/delete-superviseurs.command.handler'
import { RecupererJeunesDuConseillerCommandHandler } from 'src/application/commands/recuperer-jeunes-du-conseiller.command.handler'
import { GetJeuneMiloByDossierQueryHandler } from 'src/application/queries/get-jeune-milo-by-dossier.query.handler.db'
import { GetAllRendezVousConseillerQueryHandler } from 'src/application/queries/get-rendez-vous-conseiller.query.handler.db'
import { Action } from 'src/domain/action/action'
import { CodeTypeRendezVous } from 'src/domain/rendez-vous/rendez-vous'
import { CreateActionPayload } from 'src/infrastructure/routes/validation/actions.inputs'
import { CreateRendezVousPayload } from 'src/infrastructure/routes/validation/rendez-vous.inputs'
import { DateService } from 'src/utils/date-service'
import * as request from 'supertest'
import { uneDatetime, uneDatetimeAvecOffset } from 'test/fixtures/date.fixture'
import { unRendezVousConseillerFutursEtPassesQueryModel } from 'test/fixtures/rendez-vous.fixture'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import { CreateSuggestionConseillerOffreEmploiCommandHandler } from '../../../src/application/commands/create-suggestion-conseiller-offre-emploi.command.handler'
import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../../src/application/commands/creer-jeune-milo.command.handler'
import {
  ModifierConseillerCommand,
  ModifierConseillerCommandHandler
} from '../../../src/application/commands/modifier-conseiller.command.handler'
import {
  ModifierJeuneDuConseillerCommand,
  ModifierJeuneDuConseillerCommandHandler
} from '../../../src/application/commands/modifier-jeune-du-conseiller.command.handler'
import { SendNotificationsNouveauxMessagesCommandHandler } from '../../../src/application/commands/send-notifications-nouveaux-messages.command.handler'
import { GetConseillerByEmailQueryHandler } from '../../../src/application/queries/get-conseiller-by-email.query.handler.db'
import { GetDossierMiloJeuneQueryHandler } from '../../../src/application/queries/get-dossier-milo-jeune.query.handler'
import { GetIndicateursPourConseillerQueryHandler } from '../../../src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { GetJeunesByConseillerQueryHandler } from '../../../src/application/queries/get-jeunes-by-conseiller.query.handler.db'
import {
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  ErreurHttp,
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
  CreerJeuneMiloPayload,
  EnvoyerNotificationsPayload
} from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import { uneAgence } from '../../fixtures/agence.fixture'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
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

describe('ConseillersController', () => {
  let getConseillerByEmailQueryHandler: StubbedClass<GetConseillerByEmailQueryHandler>
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let getJeunesByConseillerQueryHandler: StubbedClass<GetJeunesByConseillerQueryHandler>
  let sendNotificationsNouveauxMessages: StubbedClass<SendNotificationsNouveauxMessagesCommandHandler>
  let getDossierMiloJeuneQueryHandler: StubbedClass<GetDossierMiloJeuneQueryHandler>
  let getJeuneMiloByDossierQueryHandler: StubbedClass<GetJeuneMiloByDossierQueryHandler>
  let getAllRendezVousConseillerQueryHandler: StubbedClass<GetAllRendezVousConseillerQueryHandler>
  let createRendezVousCommandHandler: StubbedClass<CreateRendezVousCommandHandler>
  let creerJeuneMiloCommandHandler: StubbedClass<CreerJeuneMiloCommandHandler>
  let creerSuperviseursCommandHandler: StubbedClass<CreerSuperviseursCommandHandler>
  let deleteSuperviseursCommandHandler: StubbedClass<DeleteSuperviseursCommandHandler>
  let modifierConseillerCommandHandler: StubbedClass<ModifierConseillerCommandHandler>
  let recupererJeunesDuConseillerCommandHandler: StubbedClass<RecupererJeunesDuConseillerCommandHandler>
  let modifierJeuneDuConseillerCommandHandler: StubbedClass<ModifierJeuneDuConseillerCommandHandler>
  let getIndicateursJeunePourConseillerQueryHandler: StubbedClass<GetIndicateursPourConseillerQueryHandler>
  let createSuggestionDuConseillerCommandHandler: StubbedClass<CreateSuggestionConseillerOffreEmploiCommandHandler>
  let app: INestApplication

  let dateService: StubbedClass<DateService>
  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    getConseillerByEmailQueryHandler = stubClass(
      GetConseillerByEmailQueryHandler
    )
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    sendNotificationsNouveauxMessages = stubClass(
      SendNotificationsNouveauxMessagesCommandHandler
    )
    getDossierMiloJeuneQueryHandler = stubClass(GetDossierMiloJeuneQueryHandler)
    getJeuneMiloByDossierQueryHandler = stubClass(
      GetJeuneMiloByDossierQueryHandler
    )
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
    modifierConseillerCommandHandler = stubClass(
      ModifierConseillerCommandHandler
    )
    recupererJeunesDuConseillerCommandHandler = stubClass(
      RecupererJeunesDuConseillerCommandHandler
    )
    modifierJeuneDuConseillerCommandHandler = stubClass(
      ModifierJeuneDuConseillerCommandHandler
    )
    getIndicateursJeunePourConseillerQueryHandler = stubClass(
      GetIndicateursPourConseillerQueryHandler
    )
    createSuggestionDuConseillerCommandHandler = stubClass(
      CreateSuggestionConseillerOffreEmploiCommandHandler
    )
    dateService = stubClass(DateService)
    dateService.now.returns(now)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetConseillerByEmailQueryHandler)
      .useValue(getConseillerByEmailQueryHandler)
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(SendNotificationsNouveauxMessagesCommandHandler)
      .useValue(sendNotificationsNouveauxMessages)
      .overrideProvider(GetDossierMiloJeuneQueryHandler)
      .useValue(getDossierMiloJeuneQueryHandler)
      .overrideProvider(GetJeuneMiloByDossierQueryHandler)
      .useValue(getJeuneMiloByDossierQueryHandler)
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
      .overrideProvider(ModifierConseillerCommandHandler)
      .useValue(modifierConseillerCommandHandler)
      .overrideProvider(RecupererJeunesDuConseillerCommandHandler)
      .useValue(recupererJeunesDuConseillerCommandHandler)
      .overrideProvider(ModifierJeuneDuConseillerCommandHandler)
      .useValue(modifierJeuneDuConseillerCommandHandler)
      .overrideProvider(DateService)
      .useValue(dateService)
      .overrideProvider(GetIndicateursPourConseillerQueryHandler)
      .useValue(getIndicateursJeunePourConseillerQueryHandler)
      .overrideProvider(CreateSuggestionConseillerOffreEmploiCommandHandler)
      .useValue(createSuggestionDuConseillerCommandHandler)
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
      getConseillerByEmailQueryHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

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
      getJeunesByConseillerQueryHandler.execute.resolves(success([]))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers/1/jeunes')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect([])

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

  describe('PUT /conseillers/{idConseiller}/jeunes/{idJeune}', () => {
    const conseiller = unConseiller()
    const jeune = unJeune()

    describe('quand le payload est valide', () => {
      it('met à jour le jeune', async () => {
        // Given
        const command: ModifierJeuneDuConseillerCommand = {
          idJeune: jeune.id,
          idPartenaire: 'le-id-part'
        }

        modifierJeuneDuConseillerCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}/jeunes/${jeune.id}`)
          .send({
            idPartenaire: 'le-id-part'
          })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
      })
    })

    describe('quand le payload est invalide', () => {
      it('renvoie 400', async () => {
        // Given
        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}/jeunes/${jeune.id}`)
          .send({
            idPartenaire: 'le-id-part-trop-long'
          })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    describe('quand la commande est en erreur', () => {
      it('renvoie le code idoine', async () => {
        // Given
        const command: ModifierJeuneDuConseillerCommand = {
          idJeune: jeune.id,
          idPartenaire: 'le-id-part'
        }

        modifierJeuneDuConseillerCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(failure(new NonTrouveError('Jeune', '21')))

        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}/jeunes/${jeune.id}`)
          .send({
            idPartenaire: 'le-id-part'
          })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('put', '/conseillers/2/jeunes/21')
  })

  describe('POST /conseillers/:idConseiller/jeunes/:idJeune/action', () => {
    const nowJsPlus3Mois = now.plus({ months: 3 })

    it("renvoie l'id de l'action créée sans dateEcheance", async () => {
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
          commentaire: 'Ceci est un commentaire',
          dateEcheance: nowJsPlus3Mois,
          rappel: false
        },
        unUtilisateurDecode()
      )
    })
    it("renvoie l'id de l'action créée avec dateEcheance", async () => {
      // Given
      const actionPayload: CreateActionPayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire',
        dateEcheance: uneDatetimeAvecOffset().toISO()
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
          commentaire: 'Ceci est un commentaire',
          dateEcheance: uneDatetimeAvecOffset(),
          rappel: true
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/1/jeunes/ABCDE/action'
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
          .withArgs(
            { idConseiller: '41', presenceConseiller: undefined },
            unUtilisateurDecode()
          )
          .resolves(unRendezVousConseillerFutursEtPassesQueryModel())

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/41/rendezvous')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(
            JSON.stringify(unRendezVousConseillerFutursEtPassesQueryModel())
          )
      })
    })
  })

  describe('POST /conseillers/:idConseiller/rendezvous', () => {
    describe('quand le payload est bon', () => {
      describe('quand la commande est en succes', () => {
        before(() => {
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))
        })
        it('crée le rendezvous avec jeunesIds', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true
          }

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })

          expect(
            createRendezVousCommandHandler.execute
          ).to.have.been.calledWith(
            {
              idsJeunes: payload.jeunesIds,
              commentaire: payload.comment,
              date: payload.date,
              duree: payload.duration,
              modalite: payload.modality,
              idConseiller: idConseiller,
              type: undefined,
              precision: undefined,
              titre: undefined,
              adresse: undefined,
              organisme: undefined,
              presenceConseiller: undefined,
              invitation: true
            },
            unUtilisateurDecode()
          )
        })
        it("crée le rendezvous sans jeunesIds quand c'est une animation collective", async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: [],
            comment: '',
            titre: 'aa',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true,
            type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
          }

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })
        })
        it("crée le rendezvous avec jeunesIds quand c'est une animation collective", async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            titre: 'aa',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true,
            type: CodeTypeRendezVous.INFORMATION_COLLECTIVE
          }

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
            .expect({ id: 'id-rdv' })
        })
        it('retourne une 200 quand presenceConseiller est undefined pour le type ENTRETIEN_CONSEILLER', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 200 quand presenceConseiller est undefined pour le type par defaut', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 200 quand presenceConseiller est true pour le type ENTRETIEN_CONSEILLER', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
            presenceConseiller: true
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 200 quand presenceConseiller est true pour le type par defaut', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            presenceConseiller: true
          }
          createRendezVousCommandHandler.execute.resolves(success('id-rdv'))

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.CREATED)
        })
        it('retourne une 201 quand le champ precision est rempli', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
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
      describe('quand la commande est en echec', () => {
        it('retourne une 403 quand une failure JeuneNonLieAuConseiller est renvoyée', async () => {
          // Given
          const idConseiller = '41'
          const payload: CreateRendezVousPayload = {
            jeunesIds: ['1'],
            comment: '',
            date: uneDatetime().toJSDate().toISOString(),
            duration: 30,
            modality: 'rdv',
            invitation: true
          }
          createRendezVousCommandHandler.execute.resolves(
            failure(new JeuneNonLieAuConseillerError('41', '1'))
          )

          // When - Then
          await request(app.getHttpServer())
            .post(`/conseillers/${idConseiller}/rendezvous`)
            .set('authorization', unHeaderAuthorization())
            .send(payload)
            .expect(HttpStatus.FORBIDDEN)
        })
      })
    })
    describe("quand le payload n'est pas bon", () => {
      it('retourne une 400 les jeunes sont vide pour une rdv autre que animation collective', async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: [],
          comment: '',
          titre: 'aa',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          modality: 'rdv',
          invitation: true
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it("retourne une 400 quand la date n'est pas une dateString", async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
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
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
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
      it('retourne une 400 quand presenceConseiller est false pour le type ENTRETIEN_CONSEILLER', async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
          presenceConseiller: false
        }

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/rendezvous`)
          .set('authorization', unHeaderAuthorization())
          .send(payload)
          .expect(HttpStatus.BAD_REQUEST)
      })
      it('retourne une 400 quand presenceConseiller est false pour le type par defaut', async () => {
        // Given
        const idConseiller = '41'
        const payload: CreateRendezVousPayload = {
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
          duration: 30,
          presenceConseiller: false
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
          jeunesIds: ['1'],
          comment: '',
          date: uneDatetime().toJSDate().toISOString(),
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
          .resolves(failure(new ErreurHttp('Pas trouvé', 404)))

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

  describe('GET /conseillers/milo/jeunes/:idDossier', () => {
    describe('quand le dossier existe', () => {
      it('renvoie le jeune', async () => {
        // Given
        getJeuneMiloByDossierQueryHandler.execute
          .withArgs({ idDossier: '1' }, unUtilisateurDecode())
          .resolves(success(unDetailJeuneQueryModel()))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/jeunes/1')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify(unDetailJeuneQueryModel()))
      })
    })

    describe("quand le dossier n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        // Given
        getJeuneMiloByDossierQueryHandler.execute
          .withArgs({ idDossier: '2' }, unUtilisateurDecode())
          .resolves(failure(new ErreurHttp('Pas trouvé', 404)))

        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/milo/jeunes/2')
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
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        const payload: CreerJeuneMiloPayload = {
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
          .send(payload)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CREATED)
          .expect({ id: 'idJeune' })
      })
    })

    describe('quand le jeune est déjà chez nous', () => {
      it('renvoie 400', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'ID400',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new ErreurHttp('email pas bon', 400))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send({ ...command, idDossier: command.idPartenaire })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    describe('quand le mail existe déja', () => {
      it('renvoie 409', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'ID409',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new EmailExisteDejaError('test@test.fr'))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send({ ...command, idDossier: command.idPartenaire })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CONFLICT)
      })
    })

    describe("quand l'id dossier existe déja", () => {
      it('renvoie 409', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'ID409',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }

        creerJeuneMiloCommandHandler.execute.resolves(
          failure(new DossierExisteDejaError('ID409'))
        )

        // When - Then
        await request(app.getHttpServer())
          .post('/conseillers/milo/jeunes')
          .send({ ...command, idDossier: command.idPartenaire })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.CONFLICT)
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

  describe('PUT /conseillers/{idConseiller}', () => {
    const conseiller = unConseiller()
    const agence = uneAgence()

    describe('quand le payload est valide', () => {
      it('met à jour le conseiller', async () => {
        // Given
        const command: ModifierConseillerCommand = {
          notificationsSonores: true,
          agence: agence,
          idConseiller: conseiller.id
        }

        modifierConseillerCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}`)
          .send({
            notificationsSonores: true,
            agence: agence
          })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
      })
    })

    describe('quand le payload est invalide', () => {
      it('renvoie 400', async () => {
        // Given
        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}`)
          .send({
            notificationsSonores: 'plop',
            agence: 'plop'
          })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    describe("quand l'agence n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        const command: ModifierConseillerCommand = {
          notificationsSonores: true,
          agence: agence,
          idConseiller: conseiller.id
        }

        modifierConseillerCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(failure(new NonTrouveError('Agence', agence.id!)))

        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}`)
          .send({
            notificationsSonores: true,
            agence: uneAgence()
          })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid('put', '/conseillers/2')
  })

  describe('POST /conseillers/{idConseiller}/recuperer-mes-jeunes', () => {
    describe('quand le conseiller existe', () => {
      it('recupere ses jeunes', async () => {
        // Given
        const idConseiller = 'test'
        recupererJeunesDuConseillerCommandHandler.execute
          .withArgs({ idConseiller }, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/recuperer-mes-jeunes`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
      })
    })

    describe("quand le conseiller n'existe pas", () => {
      it('renvoie 404', async () => {
        // Given
        const idConseiller = 'test'
        recupererJeunesDuConseillerCommandHandler.execute
          .withArgs({ idConseiller }, unUtilisateurDecode())
          .resolves(failure(new NonTrouveError('Conseiller', idConseiller)))

        // When - Then
        await request(app.getHttpServer())
          .post(`/conseillers/${idConseiller}/recuperer-mes-jeunes`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'post',
      '/conseillers/2/recuperer-mes-jeunes'
    )
  })

  describe('GET /conseillers/{idConseiller}/jeunes/{idJeune}/indicateurs?dateDebut&dateFin', () => {
    describe('quand les query params sont valides', () => {
      it('récupère les indicateurs d’un jeune pour un conseiller ', async () => {
        // Given
        const idConseiller = '1'
        const idJeune = 'id-jeune'

        const dateDebutString = '2022-03-01T03:24:00Z'
        const dateFinString = '2022-03-08T03:24:00Z'

        const desIndicateursJeunePourConseiller = {
          actions: {
            creees: 0,
            enRetard: 0,
            terminees: 0,
            aEcheance: 0
          },
          rendezVous: {
            planifies: 0
          },
          offres: {
            consultees: 0,
            partagees: 0
          },
          favoris: {
            offresSauvegardees: 0,
            recherchesSauvegardees: 0
          }
        }

        getIndicateursJeunePourConseillerQueryHandler.execute
          .withArgs(
            {
              idConseiller,
              idJeune,
              dateDebut: new Date(dateDebutString),
              dateFin: new Date(dateFinString)
            },
            unUtilisateurDecode()
          )
          .resolves(success(desIndicateursJeunePourConseiller))

        // When - Then

        await request(app.getHttpServer())
          .get(
            `/conseillers/${idConseiller}/jeunes/${idJeune}/indicateurs?dateDebut=${dateDebutString}&dateFin=${dateFinString}`
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(desIndicateursJeunePourConseiller)
      })
    })

    describe('quand le query param n‘est pas une date', () => {
      it('renvoie 400', async () => {
        // When - Then

        await request(app.getHttpServer())
          .get(
            '/conseillers/1/jeunes/id-jeune/indicateurs?dateDebut=2022--8-01&dateFin=2022-08-10'
          )
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/1/jeunes/id-jeune/indicateurs?dateDebut=2022-08-01&dateFin=2022-08-10'
    )
  })
})

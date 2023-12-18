import { HttpStatus, INestApplication } from '@nestjs/common'
import { CreateActionCommandHandler } from 'src/application/commands/action/create-action.command.handler'
import { DeleteConseillerCommandHandler } from 'src/application/commands/conseiller/delete-conseiller.command.handler'
import { CreateRendezVousCommandHandler } from 'src/application/commands/create-rendez-vous.command.handler'
import {
  ModifierConseillerCommand,
  ModifierConseillerCommandHandler
} from 'src/application/commands/modifier-conseiller.command.handler'
import {
  ModifierJeuneDuConseillerCommand,
  ModifierJeuneDuConseillerCommandHandler
} from 'src/application/commands/modifier-jeune-du-conseiller.command.handler'
import { RecupererJeunesDuConseillerCommandHandler } from 'src/application/commands/recuperer-jeunes-du-conseiller.command.handler'
import { SendNotificationsNouveauxMessagesCommandHandler } from 'src/application/commands/send-notifications-nouveaux-messages.command.handler'
import { GetConseillersQueryHandler } from 'src/application/queries/get-conseillers.query.handler.db'
import { GetDetailConseillerQueryHandler } from 'src/application/queries/get-detail-conseiller.query.handler.db'
import { GetIndicateursPourConseillerQueryHandler } from 'src/application/queries/get-indicateurs-pour-conseiller.query.handler.db'
import { GetJeunesByConseillerQueryHandler } from 'src/application/queries/get-jeunes-by-conseiller.query.handler.db'
import { GetJeunesIdentitesQueryHandler } from 'src/application/queries/get-jeunes-identites.query.handler.db'
import { GetAllRendezVousConseillerQueryHandler } from 'src/application/queries/rendez-vous/get-rendez-vous-conseiller.query.handler.db'
import {
  DroitsInsuffisants,
  JeuneNonLieAuConseillerError,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { Action } from 'src/domain/action/action'
import { Qualification } from 'src/domain/action/qualification'
import { Core } from 'src/domain/core'
import { CodeTypeRendezVous } from 'src/domain/rendez-vous/rendez-vous'
import { CreateActionPayload } from 'src/infrastructure/routes/validation/actions.inputs'
import { EnvoyerNotificationsPayload } from 'src/infrastructure/routes/validation/conseillers.inputs'
import { CreateRendezVousPayload } from 'src/infrastructure/routes/validation/rendez-vous.inputs'
import * as request from 'supertest'
import { uneAgence } from 'test/fixtures/agence.fixture'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneDatetime, uneDatetimeAvecOffset } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { detailConseillerQueryModel } from 'test/fixtures/query-models/conseiller.query-model.fixtures'
import { unRendezVousConseillerFutursEtPassesQueryModel } from 'test/fixtures/rendez-vous.fixture'
import { expect, StubbedClass } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'

describe('ConseillersController', () => {
  let getDetailConseillerQueryHandler: StubbedClass<GetDetailConseillerQueryHandler>
  let getConseillersQueryHandler: StubbedClass<GetConseillersQueryHandler>
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let getJeunesByConseillerQueryHandler: StubbedClass<GetJeunesByConseillerQueryHandler>
  let sendNotificationsNouveauxMessages: StubbedClass<SendNotificationsNouveauxMessagesCommandHandler>
  let getAllRendezVousConseillerQueryHandler: StubbedClass<GetAllRendezVousConseillerQueryHandler>
  let createRendezVousCommandHandler: StubbedClass<CreateRendezVousCommandHandler>
  let deleteConseillerCommandHandler: StubbedClass<DeleteConseillerCommandHandler>
  let modifierConseillerCommandHandler: StubbedClass<ModifierConseillerCommandHandler>
  let recupererJeunesDuConseillerCommandHandler: StubbedClass<RecupererJeunesDuConseillerCommandHandler>
  let modifierJeuneDuConseillerCommandHandler: StubbedClass<ModifierJeuneDuConseillerCommandHandler>
  let getIndicateursJeunePourConseillerQueryHandler: StubbedClass<GetIndicateursPourConseillerQueryHandler>
  let getIdentitesJeunesQueryHandler: StubbedClass<GetJeunesIdentitesQueryHandler>

  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getDetailConseillerQueryHandler = app.get(GetDetailConseillerQueryHandler)
    getConseillersQueryHandler = app.get(GetConseillersQueryHandler)
    createActionCommandHandler = app.get(CreateActionCommandHandler)
    getJeunesByConseillerQueryHandler = app.get(
      GetJeunesByConseillerQueryHandler
    )
    sendNotificationsNouveauxMessages = app.get(
      SendNotificationsNouveauxMessagesCommandHandler
    )
    getAllRendezVousConseillerQueryHandler = app.get(
      GetAllRendezVousConseillerQueryHandler
    )
    createRendezVousCommandHandler = app.get(CreateRendezVousCommandHandler)
    deleteConseillerCommandHandler = app.get(DeleteConseillerCommandHandler)
    modifierConseillerCommandHandler = app.get(ModifierConseillerCommandHandler)
    recupererJeunesDuConseillerCommandHandler = app.get(
      RecupererJeunesDuConseillerCommandHandler
    )
    modifierJeuneDuConseillerCommandHandler = app.get(
      ModifierJeuneDuConseillerCommandHandler
    )
    getIndicateursJeunePourConseillerQueryHandler = app.get(
      GetIndicateursPourConseillerQueryHandler
    )
    getIdentitesJeunesQueryHandler = app.get(GetJeunesIdentitesQueryHandler)
  })

  describe('DELETE /conseillers/:idConseiller', () => {
    it('supprime le conseiller', async () => {
      //Given
      deleteConseillerCommandHandler.execute
        .withArgs({ idConseiller: 'id-conseiller' }, unUtilisateurDecode())
        .resolves(emptySuccess())

      //When
      await request(app.getHttpServer())
        .delete(`/conseillers/id-conseiller`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)
    })

    ensureUserAuthenticationFailsIfInvalid('delete', '/conseillers/whatever')
  })

  describe('GET /conseillers', () => {
    const queryModel = [{ id: 'a', nom: 'b', prenom: 'c', email: 'd' }]
    it('recherche des conseillers', async () => {
      // Given
      getConseillersQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?q=jean')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(queryModel)

      expect(getConseillersQueryHandler.execute).to.have.been.calledWithExactly(
        {
          recherche: 'jean',
          structureDifferenteRecherchee: undefined
        },
        unUtilisateurDecode()
      )
    })
    it('recherche des conseillers avec une structure', async () => {
      // Given
      getConseillersQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?q=jean&structure=POLE_EMPLOI')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(queryModel)

      expect(getConseillersQueryHandler.execute).to.have.been.calledWithExactly(
        {
          recherche: 'jean',
          structureDifferenteRecherchee: Core.Structure.POLE_EMPLOI
        },
        unUtilisateurDecode()
      )
    })
    it("renvoie bad request si la structure n'est pas correcte", async () => {
      // Given
      getConseillersQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?q=jean&structure=MILO')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.BAD_REQUEST)
    })
    it('renvoie bad request si les criteres de recherche sont inferieurs à 2 caractères', async () => {
      // Given
      getConseillersQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?q=j')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.BAD_REQUEST)
    })
    it("renvoie bad request si aucun critere n'est renseigné", async () => {
      // Given
      getConseillersQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.BAD_REQUEST)
    })

    it("renvoie un code 403 si l'utilisateur n'est pas superviseur ", async () => {
      // Given
      getConseillersQueryHandler.execute.resolves(
        failure(new DroitsInsuffisants())
      )

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers?q=conseiller@email.fr')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.FORBIDDEN)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers?email=conseiller@email.fr'
    )
  })

  describe('GET /conseillers/id', () => {
    it("renvoie les infos du conseiller s'il existe ", async () => {
      // Given
      const queryModel = detailConseillerQueryModel()
      getDetailConseillerQueryHandler.execute.resolves(success(queryModel))

      // When - Then
      await request(app.getHttpServer())
        .get('/conseillers/123')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect(queryModel)

      expect(
        getDetailConseillerQueryHandler.execute
      ).to.have.been.calledOnceWithExactly(
        {
          idConseiller: '123',
          structure: Core.Structure.MILO,
          accessToken: 'coucou'
        },
        unUtilisateurDecode()
      )
    })

    ensureUserAuthenticationFailsIfInvalid('get', '/conseillers/123')
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
        comment: 'Ceci est un commentaire',
        codeQualification: Qualification.Code.PROJET_PROFESSIONNEL,
        status: Action.Statut.TERMINEE
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
          rappel: false,
          codeQualification: Qualification.Code.PROJET_PROFESSIONNEL,
          statut: Action.Statut.TERMINEE
        },
        unUtilisateurDecode()
      )
    })

    it("renvoie l'id de l'action créée avec dateEcheance", async () => {
      // Given
      const actionPayload: CreateActionPayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire',
        codeQualification: Qualification.Code.CITOYENNETE,
        dateEcheance: uneDatetimeAvecOffset().toISO(),
        status: Action.Statut.EN_COURS
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
          rappel: true,
          codeQualification: Qualification.Code.CITOYENNETE,
          statut: Action.Statut.EN_COURS
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
        beforeEach(() => {
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
              invitation: true,
              nombreMaxParticipants: undefined
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

  describe('PUT /conseillers/{idConseiller}', () => {
    const conseiller = unConseiller()
    const agence = uneAgence()
    const nouvelleDateSignatureCGU = '2020-04-12T12:00:00.000Z'

    describe('quand le payload est valide', () => {
      it('met à jour le conseiller', async () => {
        // Given
        const command: ModifierConseillerCommand = {
          notificationsSonores: true,
          agence: agence,
          idConseiller: conseiller.id,
          dateSignatureCGU: nouvelleDateSignatureCGU
        }

        modifierConseillerCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}`)
          .send({
            notificationsSonores: true,
            agence: agence,
            dateSignatureCGU: nouvelleDateSignatureCGU
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
          idConseiller: conseiller.id,
          dateSignatureCGU: nouvelleDateSignatureCGU
        }

        modifierConseillerCommandHandler.execute
          .withArgs(command, unUtilisateurDecode())
          .resolves(failure(new NonTrouveError('Agence', agence.id!)))

        // When - Then
        await request(app.getHttpServer())
          .put(`/conseillers/${conseiller.id}`)
          .send({
            notificationsSonores: true,
            agence: uneAgence(),
            dateSignatureCGU: nouvelleDateSignatureCGU
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
              dateFin: new Date(dateFinString),
              exclure: undefined
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

  describe('GET /conseillers/{idConseiller}/jeunes/identites&ids', () => {
    it('récupère l’identité des jeunes du conseiller', async () => {
      // Given
      const idConseiller = 'idConseiller'
      const idsJeunes = ['id-jeune-1', 'id-jeune-2']
      getIdentitesJeunesQueryHandler.execute
        .withArgs({ idConseiller, idsJeunes })
        .resolves(
          success([
            { id: 'id-jeune-1', nom: 'Curie', prenom: 'Marie' },
            { id: 'id-jeune-2', nom: 'Lovelace', prenom: 'Ada' }
          ])
        )

      // When
      await request(app.getHttpServer())
        .get(`/conseillers/${idConseiller}/jeunes/identites`)
        .query({ ids: idsJeunes })
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect([
          { id: 'id-jeune-1', nom: 'Curie', prenom: 'Marie' },
          { id: 'id-jeune-2', nom: 'Lovelace', prenom: 'Ada' }
        ])
    })

    describe('quand la requête est invalide', () => {
      it('renvoie 400', async () => {
        // Given
        // When - Then
        await request(app.getHttpServer())
          .get('/conseillers/id-conseiller/jeunes/identites')
          .query({ ids: [] })
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/1/jeunes/identites'
    )
  })
})

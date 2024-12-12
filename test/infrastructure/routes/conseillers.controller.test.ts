import { HttpStatus, INestApplication } from '@nestjs/common'
import { DeleteConseillerCommandHandler } from 'src/application/commands/conseiller/delete-conseiller.command.handler'
import {
  ModifierConseillerCommand,
  ModifierConseillerCommandHandler
} from 'src/application/commands/conseiller/modifier-conseiller.command.handler'
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
import {
  DroitsInsuffisants,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { EnvoyerNotificationsPayload } from 'src/infrastructure/routes/validation/conseillers.inputs'
import * as request from 'supertest'
import { uneAgence } from 'test/fixtures/agence.fixture'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from 'test/fixtures/authentification.fixture'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { detailConseillerQueryModel } from 'test/fixtures/query-models/conseiller.query-model.fixtures'
import { StubbedClass, expect } from 'test/utils'
import { ensureUserAuthenticationFailsIfInvalid } from 'test/utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from 'test/utils/module-for-testing'
import { GetDemarchesConseillerQueryHandler } from '../../../src/application/queries/get-demarches-conseiller.query.handler'
import { uneDemarcheQueryModel } from '../../fixtures/query-models/demarche.query-model.fixtures'

describe('ConseillersController', () => {
  let getDetailConseillerQueryHandler: StubbedClass<GetDetailConseillerQueryHandler>
  let getConseillersQueryHandler: StubbedClass<GetConseillersQueryHandler>
  let getJeunesByConseillerQueryHandler: StubbedClass<GetJeunesByConseillerQueryHandler>
  let sendNotificationsNouveauxMessages: StubbedClass<SendNotificationsNouveauxMessagesCommandHandler>
  let deleteConseillerCommandHandler: StubbedClass<DeleteConseillerCommandHandler>
  let modifierConseillerCommandHandler: StubbedClass<ModifierConseillerCommandHandler>
  let recupererJeunesDuConseillerCommandHandler: StubbedClass<RecupererJeunesDuConseillerCommandHandler>
  let modifierJeuneDuConseillerCommandHandler: StubbedClass<ModifierJeuneDuConseillerCommandHandler>
  let getIndicateursJeunePourConseillerQueryHandler: StubbedClass<GetIndicateursPourConseillerQueryHandler>
  let getIdentitesJeunesQueryHandler: StubbedClass<GetJeunesIdentitesQueryHandler>
  let getDemarchesConseillerQueryHandler: StubbedClass<GetDemarchesConseillerQueryHandler>

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getDetailConseillerQueryHandler = app.get(GetDetailConseillerQueryHandler)
    getConseillersQueryHandler = app.get(GetConseillersQueryHandler)
    getJeunesByConseillerQueryHandler = app.get(
      GetJeunesByConseillerQueryHandler
    )
    sendNotificationsNouveauxMessages = app.get(
      SendNotificationsNouveauxMessagesCommandHandler
    )
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
    getDemarchesConseillerQueryHandler = app.get(
      GetDemarchesConseillerQueryHandler
    )
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

  describe('PUT /conseillers/{idConseiller}', () => {
    const conseiller = unConseiller()
    const agence = uneAgence()
    const nouvelleDateSignatureCGU = '2020-04-12T12:00:00.000Z'
    const nouvellesDateVisionnageActus = '2020-04-12T12:00:00.000Z'

    describe('quand le payload est valide', () => {
      it('met à jour le conseiller', async () => {
        // Given
        const command: ModifierConseillerCommand = {
          notificationsSonores: true,
          agence: agence,
          idConseiller: conseiller.id,
          dateSignatureCGU: nouvelleDateSignatureCGU,
          dateVisionnageActus: nouvellesDateVisionnageActus
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
            dateSignatureCGU: nouvelleDateSignatureCGU,
            dateVisionnageActus: nouvellesDateVisionnageActus
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
          dateSignatureCGU: nouvelleDateSignatureCGU,
          dateVisionnageActus: nouvellesDateVisionnageActus
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
            dateSignatureCGU: nouvelleDateSignatureCGU,
            dateVisionnageActus: nouvellesDateVisionnageActus
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

  describe('GET /conseillers/{idConseiller}/jeunes/identites', () => {
    it("récupère l'identité des jeunes du conseiller", async () => {
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

  describe('GET /conseillers/{idConseiller}/jeunes/{idJeune}/demarches', () => {
    it('récupère les demarches du jeune pour un conseiller', async () => {
      // Given
      const idConseiller = 'idConseiller'
      const idJeune = 'id-jeune'
      getDemarchesConseillerQueryHandler.execute.resolves(
        success({ queryModel: [uneDemarcheQueryModel()] })
      )

      // When
      await request(app.getHttpServer())
        .get(`/conseillers/${idConseiller}/jeunes/${idJeune}/demarches`)
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
        .expect({ queryModel: [uneDemarcheQueryModel()] })

      expect(
        getDemarchesConseillerQueryHandler.execute
      ).to.have.been.calledOnceWith({
        idConseiller,
        idJeune,
        accessToken: 'coucou',
        dateDebut: undefined
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/conseillers/1/jeunes/2/demarches'
    )
  })
})

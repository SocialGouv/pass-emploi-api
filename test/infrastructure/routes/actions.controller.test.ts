import { HttpStatus, INestApplication } from '@nestjs/common'
import { Action } from 'src/domain/action/action'
import * as request from 'supertest'
import { AddCommentaireActionCommandHandler } from '../../../src/application/commands/action/add-commentaire-action.command.handler'
import { CreateActionCommandHandler } from '../../../src/application/commands/action/create-action.command.handler'
import { DeleteActionCommandHandler } from '../../../src/application/commands/action/delete-action.command.handler'
import {
  QualifierActionCommand,
  QualifierActionCommandHandler
} from '../../../src/application/commands/milo/qualifier-action.command.handler'
import {
  GetActionsConseillerV2Query,
  GetActionsConseillerV2QueryHandler,
  TriActionsConseillerV2
} from '../../../src/application/queries/action/get-actions-conseiller-v2.query.handler.db'
import {
  ActionsJeuneQueryModel,
  GetActionsJeuneQuery,
  GetActionsJeuneQueryHandler
} from '../../../src/application/queries/action/get-actions-jeune.query.handler.db'
import { GetCommentairesActionQueryHandler } from '../../../src/application/queries/action/get-commentaires-action.query.handler.db'
import { GetDetailActionQueryHandler } from '../../../src/application/queries/action/get-detail-action.query.handler.db'
import { CommentaireActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import {
  DroitsInsuffisants,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Qualification } from '../../../src/domain/action/qualification'
import {
  CreateActionParLeJeunePayload,
  CreateActionPayload
} from '../../../src/infrastructure/routes/validation/actions.inputs'
import { DateService } from '../../../src/utils/date-service'
import { unCommentaire, uneAction } from '../../fixtures/action.fixture'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import {
  uneDate,
  uneDatetime,
  uneDatetimeAvecOffset
} from '../../fixtures/date.fixture'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import { StubbedClass, expect } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'

import Statut = Action.Statut
import Tri = Action.Tri
import Code = Qualification.Code
import Etat = Qualification.Etat

let getDetailActionQueryHandler: StubbedClass<GetDetailActionQueryHandler>
let deleteActionCommandHandler: StubbedClass<DeleteActionCommandHandler>
let addCommentaireActionCommandHandler: StubbedClass<AddCommentaireActionCommandHandler>
let getCommentaireActionCommandHandler: StubbedClass<GetCommentairesActionQueryHandler>
let qualifierActionCommandHandler: StubbedClass<QualifierActionCommandHandler>
let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
let getActionsConseillerQueryHandler: StubbedClass<GetActionsConseillerV2QueryHandler>
let getActionsByJeuneQueryHandler: StubbedClass<GetActionsJeuneQueryHandler>

describe('ActionsController', () => {
  let app: INestApplication

  const now = uneDatetime().set({ second: 59, millisecond: 0 })

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getDetailActionQueryHandler = app.get(GetDetailActionQueryHandler)
    deleteActionCommandHandler = app.get(DeleteActionCommandHandler)
    createActionCommandHandler = app.get(CreateActionCommandHandler)
    getActionsByJeuneQueryHandler = app.get(GetActionsJeuneQueryHandler)
    addCommentaireActionCommandHandler = app.get(
      AddCommentaireActionCommandHandler
    )
    getCommentaireActionCommandHandler = app.get(
      GetCommentairesActionQueryHandler
    )
    getActionsConseillerQueryHandler = app.get(
      GetActionsConseillerV2QueryHandler
    )
    qualifierActionCommandHandler = app.get(QualifierActionCommandHandler)
  })

  describe('actions', () => {
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

        expect(
          createActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
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

        expect(
          createActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
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

    describe('GET /actions/:idAction', () => {
      const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
      it("renvoie l'action demandée", async () => {
        // Given
        getDetailActionQueryHandler.execute
          .withArgs({ idAction }, unUtilisateurDecode())
          .resolves(uneActionQueryModel({ id: idAction }))

        // When - Then
        const actionJson = {
          id: idAction,
          content: "Ceci est un contenu d'action",
          comment: 'Ceci est un commentaire',
          status: 'in_progress',
          creationDate: '2021-11-11T08:03:30.000Z',
          lastUpdate: '2021-11-11T09:03:30.000Z',
          jeune: {
            id: '1',
            lastName: 'Saez',
            firstName: 'Damien',
            idConseiller: 'id-conseiller'
          },
          creatorType: 'conseiller',
          creator: 'Nils Tavernier',
          dateEcheance: '2021-11-11T10:03:30.000Z',
          etat: 'NON_QUALIFIABLE'
        }
        await request(app.getHttpServer())
          .get(`/actions/${idAction}`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(actionJson)
      })

      it("renvoie un code 404 (Not Found) si l'action n'existe pas", async () => {
        // Given
        getDetailActionQueryHandler.execute.resolves(undefined)

        // When - Then
        await request(app.getHttpServer())
          .get(`/actions/${idAction}`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })

      ensureUserAuthenticationFailsIfInvalid('get', '/actions/123')
    })
    describe('DELETE /actions/:idAction', () => {
      const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
      it("supprime l'action demandée", async () => {
        // Given
        deleteActionCommandHandler.execute
          .withArgs({ idAction }, unUtilisateurDecode())
          .resolves(emptySuccess())

        // When - Then
        await request(app.getHttpServer())
          .delete(`/actions/${idAction}`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NO_CONTENT)
      })

      it("renvoie un code 404 (Not Found) si l'action n'existe pas", async () => {
        // Given
        const action = uneAction()
        deleteActionCommandHandler.execute.resolves(
          failure(new NonTrouveError('Action', action.id))
        )

        // When - Then
        await request(app.getHttpServer())
          .delete(`/actions/${idAction}`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.NOT_FOUND)
      })

      it("renvoie un code 404 (Not Found) si l'action possède un commentaire", async () => {
        // Given
        deleteActionCommandHandler.execute.resolves(
          failure(
            new MauvaiseCommandeError(
              'Impossible de supprimer une action avec un commentaire.'
            )
          )
        )

        // When - Then
        await request(app.getHttpServer())
          .delete(`/actions/${idAction}`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.BAD_REQUEST)
      })

      ensureUserAuthenticationFailsIfInvalid('delete', '/actions/123')
    })

    describe('GET /v2/conseillers/{idConseiller}/actions', () => {
      describe('quand la query est au bon format', () => {
        it('retourne les actions à qualifier', async () => {
          // Given
          const query: GetActionsConseillerV2Query = {
            idConseiller: 'un-id-conseiller',
            page: 2,
            limit: undefined,
            codesCategories: undefined,
            aQualifier: true,
            tri: undefined
          }
          const resultat = {
            pagination: {
              page: 1,
              limit: 10,
              total: 0
            },
            resultats: []
          }

          getActionsConseillerQueryHandler.execute
            .withArgs(query, unUtilisateurDecode())
            .resolves(success(resultat))

          // When - Then
          await request(app.getHttpServer())
            .get(
              `/v2/conseillers/${query.idConseiller}/actions?page=2&aQualifier=true`
            )
            .set('authorization', unHeaderAuthorization())
            .expect(HttpStatus.OK)
            .expect(JSON.stringify(resultat))
        })
        it('retourne les actions pas à qualifier', async () => {
          // Given
          const query: GetActionsConseillerV2Query = {
            idConseiller: 'un-id-conseiller',
            page: 2,
            limit: undefined,
            codesCategories: undefined,
            aQualifier: false,
            tri: undefined
          }
          const resultat = {
            pagination: {
              page: 1,
              limit: 10,
              total: 0
            },
            resultats: []
          }

          getActionsConseillerQueryHandler.execute
            .withArgs(query, unUtilisateurDecode())
            .resolves(success(resultat))

          // When - Then
          await request(app.getHttpServer())
            .get(
              `/v2/conseillers/${query.idConseiller}/actions?page=2&aQualifier=false`
            )
            .set('authorization', unHeaderAuthorization())
            .expect(HttpStatus.OK)
            .expect(JSON.stringify(resultat))
        })
        it('retourne toutes les actions', async () => {
          // Given
          const query: GetActionsConseillerV2Query = {
            idConseiller: 'un-id-conseiller',
            page: 2,
            limit: undefined,
            codesCategories: undefined,
            aQualifier: undefined,
            tri: undefined
          }
          const resultat = {
            pagination: {
              page: 1,
              limit: 10,
              total: 0
            },
            resultats: []
          }

          getActionsConseillerQueryHandler.execute
            .withArgs(query, unUtilisateurDecode())
            .resolves(success(resultat))

          // When - Then
          await request(app.getHttpServer())
            .get(`/v2/conseillers/${query.idConseiller}/actions?page=2`)
            .set('authorization', unHeaderAuthorization())
            .expect(HttpStatus.OK)
            .expect(JSON.stringify(resultat))
        })
        it('retourne les actions avec les catégories demandées', async () => {
          // Given
          const query: GetActionsConseillerV2Query = {
            idConseiller: 'un-id-conseiller',
            page: 2,
            limit: undefined,
            codesCategories: [
              Action.Qualification.Code.SANTE,
              Action.Qualification.Code.CITOYENNETE
            ],
            aQualifier: undefined,
            tri: undefined
          }
          const resultat = {
            pagination: {
              page: 1,
              limit: 10,
              total: 0
            },
            resultats: []
          }

          getActionsConseillerQueryHandler.execute
            .withArgs(query, unUtilisateurDecode())
            .resolves(success(resultat))

          // When - Then
          await request(app.getHttpServer())
            .get(
              `/v2/conseillers/${query.idConseiller}/actions?page=2&codesCategories=SANTE&codesCategories=CITOYENNETE`
            )
            .set('authorization', unHeaderAuthorization())
            .expect(HttpStatus.OK)
            .expect(JSON.stringify(resultat))
        })
        it('retourne les actions triées', async () => {
          // Given
          const query: GetActionsConseillerV2Query = {
            idConseiller: 'un-id-conseiller',
            page: 2,
            limit: undefined,
            codesCategories: undefined,
            aQualifier: undefined,
            tri: TriActionsConseillerV2.BENEFICIAIRE_ALPHABETIQUE
          }
          const resultat = {
            pagination: {
              page: 1,
              limit: 10,
              total: 0
            },
            resultats: []
          }

          getActionsConseillerQueryHandler.execute
            .withArgs(query, unUtilisateurDecode())
            .resolves(success(resultat))

          // When - Then
          await request(app.getHttpServer())
            .get(
              `/v2/conseillers/${query.idConseiller}/actions?page=2&tri=BENEFICIAIRE_ALPHABETIQUE`
            )
            .set('authorization', unHeaderAuthorization())
            .expect(HttpStatus.OK)
            .expect(JSON.stringify(resultat))
        })
      })

      describe('quand la query est au mauvais format', () => {
        it("retourne une erreur 400 quand page n'est pas un number", async () => {
          await request(app.getHttpServer())
            .get(`/v2/conseillers/un-id-conseiller/actions?page=trois`)
            .set('authorization', unHeaderAuthorization())
            .expect(HttpStatus.BAD_REQUEST)
        })
      })

      ensureUserAuthenticationFailsIfInvalid('get', '/v2/conseillers/2/actions')
    })

    describe('POST /jeunes/:idJeune/action', () => {
      const nowJsPlus3Mois = now.plus({ months: 3 })

      const actionPayload: CreateActionParLeJeunePayload = {
        content: "Ceci est un contenu d'action",
        comment: 'Ceci est un commentaire',
        status: Action.Statut.EN_COURS,
        codeQualification: Code.CITOYENNETE,
        estDuplicata: true
      }
      it("renvoie l'id de l'action créée avec echeance par defaut", async () => {
        // Given
        const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
        createActionCommandHandler.execute.resolves(success(idAction))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send(actionPayload)

          // Then
          .expect(HttpStatus.CREATED)
          .expect({ id: idAction })
        expect(
          createActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: 'ABCDE',
            contenu: "Ceci est un contenu d'action",
            idCreateur: 'ABCDE',
            typeCreateur: Action.TypeCreateur.JEUNE,
            statut: Action.Statut.EN_COURS,
            commentaire: 'Ceci est un commentaire',
            dateEcheance: nowJsPlus3Mois,
            rappel: false,
            codeQualification: Code.CITOYENNETE,
            estDuplicata: true
          },
          unUtilisateurDecode()
        )
      })
      it("renvoie l'id de l'action créée avec echeance par defaut sans statut", async () => {
        // Given
        const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
        createActionCommandHandler.execute.resolves(success(idAction))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send({
            content: "Ceci est un contenu d'action",
            comment: 'Ceci est un commentaire',
            codeQualification: Code.CITOYENNETE
          })

          // Then
          .expect(HttpStatus.CREATED)
          .expect({ id: idAction })
        expect(
          createActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: 'ABCDE',
            contenu: "Ceci est un contenu d'action",
            idCreateur: 'ABCDE',
            typeCreateur: Action.TypeCreateur.JEUNE,
            statut: undefined,
            commentaire: 'Ceci est un commentaire',
            dateEcheance: nowJsPlus3Mois,
            rappel: false,
            codeQualification: Code.CITOYENNETE,
            estDuplicata: undefined
          },
          unUtilisateurDecode()
        )
      })
      it("renvoie l'id de l'action créée avec echeance par defaut et statut done", async () => {
        // Given
        const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
        createActionCommandHandler.execute.resolves(success(idAction))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send({
            content: "Ceci est un contenu d'action",
            comment: 'Ceci est un commentaire',
            status: Action.Statut.TERMINEE,
            codeQualification: Code.CITOYENNETE
          })

          // Then
          .expect(HttpStatus.CREATED)
          .expect({ id: idAction })
        expect(
          createActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: 'ABCDE',
            contenu: "Ceci est un contenu d'action",
            idCreateur: 'ABCDE',
            typeCreateur: Action.TypeCreateur.JEUNE,
            statut: Action.Statut.TERMINEE,
            commentaire: 'Ceci est un commentaire',
            dateEcheance: now,
            rappel: false,
            codeQualification: Code.CITOYENNETE,
            estDuplicata: undefined
          },
          unUtilisateurDecode()
        )
      })
      it("renvoie l'id de l'action créée avec echeance et rappel", async () => {
        // Given
        const payloadAvecEcheance: CreateActionParLeJeunePayload = {
          ...actionPayload,
          dateEcheance: uneDatetimeAvecOffset().toISO(),
          rappel: false
        }
        const idAction = 'a40a178e-9562-416f-ad9d-42dfbc663a8a'
        createActionCommandHandler.execute.resolves(success(idAction))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send(payloadAvecEcheance)

          // Then
          .expect(HttpStatus.CREATED)
          .expect({ id: idAction })
        expect(
          createActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
          {
            idJeune: 'ABCDE',
            contenu: "Ceci est un contenu d'action",
            idCreateur: 'ABCDE',
            typeCreateur: Action.TypeCreateur.JEUNE,
            statut: Action.Statut.EN_COURS,
            commentaire: 'Ceci est un commentaire',
            dateEcheance: uneDatetimeAvecOffset(),
            rappel: false,
            codeQualification: Code.CITOYENNETE,
            estDuplicata: true
          },
          unUtilisateurDecode()
        )
      })

      it("renvoie une 404 (Not Found) quand le jeune n'existe pas", async () => {
        const echec = failure(new NonTrouveError('Jeune', 'ABCDE'))
        createActionCommandHandler.execute.resolves(echec)

        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send(actionPayload)
          .expect(HttpStatus.NOT_FOUND)
      })

      it('renvoie une 400 (Bad Request) quand le statut est incorrect', async () => {
        const echec = failure(new Action.StatutInvalide('whatever_status'))
        createActionCommandHandler.execute.resolves(echec)

        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send(actionPayload)
          .expect(HttpStatus.BAD_REQUEST)
          .expect({
            message: echec.error.message,
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request'
          })
      })

      it('renvoie une 400 (Bad Request) quand le statut est égal à "annulée"', async () => {
        const actionPayloadWithCanceledStatus: CreateActionParLeJeunePayload = {
          content: "Ceci est un contenu d'action",
          comment: 'Ceci est un commentaire',
          status: Action.Statut.ANNULEE
        }

        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/action')
          .set('authorization', unHeaderAuthorization())
          .send(actionPayloadWithCanceledStatus)
          .expect(HttpStatus.BAD_REQUEST)
      })

      ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/action')
    })

    describe('GET /v2/jeunes/:idJeune/actions', () => {
      const idJeune = '1'
      it('renvoie 206', async () => {
        // Given
        const queryActions: GetActionsJeuneQuery = {
          idJeune: idJeune,
          page: 1,
          tri: Tri.DATE_CROISSANTE,
          statuts: [Statut.TERMINEE],
          etats: [Etat.A_QUALIFIER],
          codesCategories: [Code.SANTE]
        }
        const actionsByJeuneOutput: ActionsJeuneQueryModel = {
          actions: [],
          metadonnees: {
            nombreTotal: 1,
            nombreFiltrees: 1,
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

      it('retourne 400 quand le paramètre etats est au mauvais format', async () => {
        // Given
        const queryActions = {
          etats: ['à tes souhaits']
        }
        // When
        await request(app.getHttpServer())
          .get(`/v2/jeunes/${idJeune}/actions`)
          .set('authorization', unHeaderAuthorization())
          .query(queryActions)
          // Then
          .expect(HttpStatus.BAD_REQUEST)
      })

      it('retourne 400 quand le paramètre categories est au mauvais format', async () => {
        // Given
        const queryActions = {
          categories: ['à tes souhaits']
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
  })

  describe('commentaires', () => {
    describe('POST /actions/:idAction/commentaires', () => {
      it("ajoute un commentaire à l'action", async () => {
        // Given
        const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
        const commentaire = 'poi-commentaire'
        const commentaireCree = unCommentaire()

        const utilisateur = unUtilisateurDecode()
        addCommentaireActionCommandHandler.execute
          .withArgs(
            { idAction, commentaire, createur: utilisateur },
            utilisateur
          )
          .resolves(success(commentaireCree))

        // When
        await request(app.getHttpServer())
          .post(`/actions/${idAction}/commentaires`)
          .send({ commentaire })
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.CREATED)
          .expect({
            ...commentaireCree,
            date: commentaireCree.date.toISO()
          })

        expect(
          addCommentaireActionCommandHandler.execute
        ).to.have.been.calledWithExactly(
          { idAction, commentaire, createur: utilisateur },
          utilisateur
        )
      })
      it("retourne une erreur non autorisée pour un utilisateur n'ayant pas les droits", async () => {
        // Given
        const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'

        addCommentaireActionCommandHandler.execute.resolves(
          failure(new DroitsInsuffisants())
        )

        // When
        await request(app.getHttpServer())
          .post(`/actions/${idAction}/commentaires`)
          .send({ commentaire: 'plop' })
          .set('authorization', unHeaderAuthorization())

          // Then
          .expect(HttpStatus.FORBIDDEN)
      })

      ensureUserAuthenticationFailsIfInvalid(
        'post',
        '/actions/123/commentaires'
      )
    })
    describe('GET /actions/:idAction/commentaires', () => {
      it("récupère les commentaires d'une action", async () => {
        // Given
        const idAction = '13c11b33-751c-4e1b-a49d-1b5a473ba159'
        const conseiller = unConseiller()
        const commentaireQueryModel: CommentaireActionQueryModel = {
          id: '99dc0cc1-84ef-4979-aa5c-4477ddeb26bd',
          message: "Qu'en est-il de cette action ?",
          date: DateService.fromJSDateToISOString(uneDate()),
          createur: {
            id: conseiller.id,
            prenom: conseiller.firstName,
            nom: conseiller.lastName,
            type: Action.TypeCreateur.CONSEILLER
          }
        }

        const utilisateur = unUtilisateurDecode()
        getCommentaireActionCommandHandler.execute
          .withArgs({ idAction }, utilisateur)
          .resolves(success([commentaireQueryModel]))

        // When
        await request(app.getHttpServer())
          .get(`/actions/${idAction}/commentaires`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.OK)
          .expect([
            {
              ...commentaireQueryModel,
              date: DateService.fromJSDateToISOString(uneDate())
            }
          ])
      })
      it("retourne une erreur non autorisée pour un utilisateur n'ayant pas les droits", async () => {
        // Given
        getCommentaireActionCommandHandler.execute.resolves(
          failure(new DroitsInsuffisants())
        )

        // When
        await request(app.getHttpServer())
          .get(`/actions/13c11b33-751c-4e1b-a49d-1b5a473ba159/commentaires`)
          .set('authorization', unHeaderAuthorization())
          // Then
          .expect(HttpStatus.FORBIDDEN)
      })

      ensureUserAuthenticationFailsIfInvalid('get', '/actions/123/commentaires')
    })
  })

  describe('POST /actions/:idAction/qualifier', () => {
    it("qualifie l'action", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      const command: QualifierActionCommand = {
        idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
        utilisateur,
        dateDebut: uneDatetimeAvecOffset(),
        dateFinReelle: uneDatetimeAvecOffset(),
        commentaireQualification: 'Un commentaire valide',
        codeQualification: Action.Qualification.Code.EMPLOI
      }

      qualifierActionCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(
          success({
            code: Action.Qualification.Code.EMPLOI,
            heures: 3,
            libelle: 'Emploi',
            commentaireQualification: 'Un commentaire'
          })
        )

      // When
      await request(app.getHttpServer())
        .post(`/actions/${command.idAction}/qualifier`)
        .send({
          ...command,
          dateDebut: uneDatetimeAvecOffset().toISO(),
          dateFinReelle: uneDatetimeAvecOffset().toISO()
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.CREATED)

      expect(
        qualifierActionCommandHandler.execute
      ).to.have.been.calledWithExactly(command, utilisateur)
    })
    it("retourne une erreur non autorisée pour un utilisateur n'ayant pas les droits", async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      const command: QualifierActionCommand = {
        idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
        utilisateur,
        dateDebut: undefined,
        dateFinReelle: undefined,
        commentaireQualification: 'un commentaire valide',
        codeQualification: Action.Qualification.Code.EMPLOI
      }

      qualifierActionCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(failure(new DroitsInsuffisants()))

      // When
      await request(app.getHttpServer())
        .post(`/actions/${command.idAction}/qualifier`)
        .send({ ...command })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.FORBIDDEN)
    })
    it('retourne une BAD_REQUEST lorsque le commentaire dépasse les 255 caractères.', async () => {
      // Given
      const utilisateur = unUtilisateurDecode()

      const command: QualifierActionCommand = {
        idAction: '13c11b33-751c-4e1b-a49d-1b5a473ba159',
        utilisateur,
        dateDebut: uneDatetimeAvecOffset(),
        dateFinReelle: uneDatetimeAvecOffset(),
        commentaireQualification:
          "Un commentaire invalide car il dépasse la limite fixée à deux cent cinquante-cinq caractères par l'API-Application Programming Interface- développée par i-milo. Ce commentaire est invalide puisqu'il est d'une longueur de deux cent cinquante-six caractères.",
        codeQualification: Action.Qualification.Code.EMPLOI
      }

      // When
      await request(app.getHttpServer())
        .post(`/actions/${command.idAction}/qualifier`)
        .send({
          ...command,
          dateDebut: uneDatetimeAvecOffset().toISO(),
          dateFinReelle: uneDatetimeAvecOffset().toISO()
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.BAD_REQUEST)
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/actions/123/qualifier')
  })
})

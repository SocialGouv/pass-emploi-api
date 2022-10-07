import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { DeleteActionCommandHandler } from '../../../src/application/commands/delete-action.command.handler'
import { GetDetailActionQueryHandler } from '../../../src/application/queries/get-detail-action.query.handler.db'
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
import { unCommentaire, uneAction } from '../../fixtures/action.fixture'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { uneActionQueryModel } from '../../fixtures/query-models/action.query-model.fixtures'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { AddCommentaireActionCommandHandler } from '../../../src/application/commands/add-commentaire-action.command.handler'
import { GetCommentairesActionQueryHandler } from '../../../src/application/queries/get-commentaires-action.query.handler.db'
import { CommentaireActionQueryModel } from '../../../src/application/queries/query-models/actions.query-model'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { Action } from 'src/domain/action/action'
import { uneDate, uneDatetimeAvecOffset } from '../../fixtures/date.fixture'
import {
  QualifierActionCommand,
  QualifierActionCommandHandler
} from '../../../src/application/commands/qualifier-action.command.handler'
import { DateService } from '../../../src/utils/date-service'

let getDetailActionQueryHandler: StubbedClass<GetDetailActionQueryHandler>
let deleteActionCommandHandler: StubbedClass<DeleteActionCommandHandler>
let addCommentaireActionCommandHandler: StubbedClass<AddCommentaireActionCommandHandler>
let getCommentaireActionCommandHandler: StubbedClass<GetCommentairesActionQueryHandler>
let qualifierActionCommandHandler: StubbedClass<QualifierActionCommandHandler>

describe('ActionsController', () => {
  let app: INestApplication
  beforeEach(async () => {
    getDetailActionQueryHandler = stubClass(GetDetailActionQueryHandler)
    deleteActionCommandHandler = stubClass(DeleteActionCommandHandler)
    addCommentaireActionCommandHandler = stubClass(
      AddCommentaireActionCommandHandler
    )
    getCommentaireActionCommandHandler = stubClass(
      GetCommentairesActionQueryHandler
    )
    qualifierActionCommandHandler = stubClass(QualifierActionCommandHandler)

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetDetailActionQueryHandler)
      .useValue(getDetailActionQueryHandler)
      .overrideProvider(DeleteActionCommandHandler)
      .useValue(deleteActionCommandHandler)
      .overrideProvider(AddCommentaireActionCommandHandler)
      .useValue(addCommentaireActionCommandHandler)
      .overrideProvider(GetCommentairesActionQueryHandler)
      .useValue(getCommentaireActionCommandHandler)
      .overrideProvider(QualifierActionCommandHandler)
      .useValue(qualifierActionCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })
  describe('actions', () => {
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
            firstName: 'Damien'
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
        codeQualification: Action.Qualification.Code.EMPLOI
      }

      qualifierActionCommandHandler.execute
        .withArgs(command, utilisateur)
        .resolves(
          success({
            code: Action.Qualification.Code.EMPLOI,
            heures: 3,
            libelle: 'Emploi'
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

    ensureUserAuthenticationFailsIfInvalid('post', '/actions/123/qualifier')
  })
})

import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi.command.handler'
import { GetDetailJeuneQueryHandler } from '../../../src/application/queries/get-detail-jeune.query.handler'
import { DetailJeuneQueryModel } from '../../../src/application/queries/query-models/jeunes.query-models'
import {
  FavoriExisteDejaError,
  FavoriNonTrouveError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { CreateActionAvecStatutPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import { AddFavoriPayload } from '../../../src/infrastructure/routes/validation/jeunes.inputs'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import StatutInvalide = Action.StatutInvalide

describe('JeunesController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let addFavoriOffreEmploiCommandHandler: StubbedClass<AddFavoriOffreEmploiCommandHandler>
  let deleteFavoriOffreEmploiCommandHandler: StubbedClass<DeleteFavoriOffreEmploiCommandHandler>
  let getDetailJeuneQueryHandler: StubbedClass<GetDetailJeuneQueryHandler>
  let app: INestApplication

  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    addFavoriOffreEmploiCommandHandler = stubClass(
      AddFavoriOffreEmploiCommandHandler
    )
    deleteFavoriOffreEmploiCommandHandler = stubClass(
      DeleteFavoriOffreEmploiCommandHandler
    )
    getDetailJeuneQueryHandler = stubClass(GetDetailJeuneQueryHandler)
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(AddFavoriOffreEmploiCommandHandler)
      .useValue(addFavoriOffreEmploiCommandHandler)
      .overrideProvider(DeleteFavoriOffreEmploiCommandHandler)
      .useValue(deleteFavoriOffreEmploiCommandHandler)
      .overrideProvider(GetDetailJeuneQueryHandler)
      .useValue(getDetailJeuneQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('POST /jeunes/:idJeune/action', () => {
    const actionPayload: CreateActionAvecStatutPayload = {
      content: "Ceci est un contenu d'action",
      comment: 'Ceci est un commentaire',
      status: Action.Statut.EN_COURS
    }
    it("renvoie l'id de l'action créée", async () => {
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
      expect(createActionCommandHandler.execute).to.have.been.calledWithExactly(
        {
          idJeune: 'ABCDE',
          contenu: "Ceci est un contenu d'action",
          idCreateur: 'ABCDE',
          typeCreateur: Action.TypeCreateur.JEUNE,
          statut: Action.Statut.EN_COURS,
          commentaire: 'Ceci est un commentaire'
        }
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
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.NOT_FOUND
        })
    })

    it('renvoie une 400 (Bad Request) quand le statuts est incorrect', async () => {
      const echec = failure(new StatutInvalide('whatever_status'))
      createActionCommandHandler.execute.resolves(echec)

      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/action')
        .set('authorization', unHeaderAuthorization())
        .send(actionPayload)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.BAD_REQUEST
        })
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/action')
  })

  describe('POST /jeunes/:idJeune/favori', () => {
    const offreEmploi = uneOffreEmploi()
    const command: AddFavoriOffreEmploiCommand = {
      idJeune: 'ABCDE',
      offreEmploi: offreEmploi
    }

    const payload: AddFavoriPayload = {
      idOffre: offreEmploi.id,
      nomEntreprise: offreEmploi.nomEntreprise,
      duree: offreEmploi.duree,
      titre: offreEmploi.titre,
      alternance: offreEmploi.alternance,
      typeContrat: offreEmploi.typeContrat,
      localisation: offreEmploi.localisation
    }
    it('crée un favori', async () => {
      // Given
      addFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/favori')
        .set('authorization', unHeaderAuthorization())
        .send(payload)

        // Then
        .expect(HttpStatus.CREATED)
      expect(
        addFavoriOffreEmploiCommandHandler.execute
      ).to.have.been.calledWith(command)
    })
    it('renvoie une 404 (Not Found) quand le jeune n"existe pas', async () => {
      // Given
      addFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new NonTrouveError('Jeune', command.idJeune)))

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/favori')
        .set('authorization', unHeaderAuthorization())
        .send(payload)

        // Then
        .expect(HttpStatus.NOT_FOUND)
    })
    it('renvoie une 409 (Conflict) quand l"offre n"existe pas', async () => {
      // Given
      addFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(
            new FavoriExisteDejaError(command.idJeune, command.offreEmploi.id)
          )
        )

      // When
      await request(app.getHttpServer())
        .post('/jeunes/ABCDE/favori')
        .set('authorization', unHeaderAuthorization())
        .send(payload)

        // Then
        .expect(HttpStatus.CONFLICT)
    })
    ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/favori')
  })

  describe('DELETE /jeunes/:idJeune/favori/:idOffreEmploi', () => {
    const offreEmploi = uneOffreEmploi()
    const jeune = unJeune()
    const command: DeleteFavoriOffreEmploiCommand = {
      idJeune: jeune.id,
      idOffreEmploi: offreEmploi.id
    }
    it('supprime le favori', async () => {
      //Given
      deleteFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(emptySuccess())
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/favori/${offreEmploi.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NO_CONTENT)
      expect(
        deleteFavoriOffreEmploiCommandHandler.execute
      ).to.have.be.calledWith(command)
    })
    it('renvoie une 404(NOT FOUND) si le favori n"existe pas', async () => {
      //Given
      deleteFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(
          failure(
            new FavoriNonTrouveError(command.idJeune, command.idOffreEmploi)
          )
        )

      const expectedMessageJson = {
        code: 'FAVORI_NON_TROUVE',
        message: `Le Favori du jeune ${command.idJeune} correspondant à l'offre ${command.idOffreEmploi} n'existe pas`
      }
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/favori/${offreEmploi.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedMessageJson)
    })
    it('renvoie une 404(NOT FOUND) si le jeune n"existe pas', async () => {
      //Given
      deleteFavoriOffreEmploiCommandHandler.execute
        .withArgs(command)
        .resolves(failure(new NonTrouveError('Jeune', command.idJeune)))

      const expectedMessageJson = {
        code: 'NON_TROUVE',
        message: `Jeune ${command.idJeune} non trouvé(e)`
      }
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/favori/${offreEmploi.id}`)
        .set('authorization', unHeaderAuthorization())
        //Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedMessageJson)
    })
    ensureUserAuthenticationFailsIfInvalid('delete', '/jeunes/ABCDE/favori/123')
  })

  describe('GET /jeunes/:idJeune', () => {
    const idJeune = '1'
    it('renvoit le jeune quand il existe', async () => {
      // Given
      const detailJeuneQueryModel: DetailJeuneQueryModel = {
        id: idJeune,
        firstName: 'Kenji',
        lastName: 'Tavernier',
        creationDate: 'une_date'
      }
      getDetailJeuneQueryHandler.execute.resolves(detailJeuneQueryModel)

      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(HttpStatus.OK)
        .expect(detailJeuneQueryModel)
      expect(getDetailJeuneQueryHandler.execute).to.have.been.calledWith({
        idJeune
      })
    })
    it('renvoit une 404 quand le jeune n"existe pas', async () => {
      // Given
      getDetailJeuneQueryHandler.execute.resolves(undefined)
      const expectedResponseJson = {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Jeune ${idJeune} not found`
      }
      // When
      await request(app.getHttpServer())
        .get(`/jeunes/${idJeune}`)
        .set('authorization', unHeaderAuthorization())
        // Then
        .expect(expectedResponseJson)
      expect(getDetailJeuneQueryHandler.execute).to.have.been.calledWith({
        idJeune
      })
    })
    ensureUserAuthenticationFailsIfInvalid('get', '/jeunes/1')
  })
})

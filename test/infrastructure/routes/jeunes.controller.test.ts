import { HttpStatus, INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import { CreateActionCommandHandler } from '../../../src/application/commands/create-action.command.handler'
import {
  FavoriExisteDejaError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Action } from '../../../src/domain/action'
import { CreateActionAvecStatutPayload } from '../../../src/infrastructure/routes/validation/conseillers.inputs'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import StatutInvalide = Action.StatutInvalide
import { AddFavoriPayload } from '../../../src/infrastructure/routes/validation/jeunes.inputs'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi-command.handler'
import { unJeune } from '../../fixtures/jeune.fixture'

describe('JeunesController', () => {
  let createActionCommandHandler: StubbedClass<CreateActionCommandHandler>
  let addFavoriOffreEmploiCommandHandler: StubbedClass<AddFavoriOffreEmploiCommandHandler>
  let deleteFavoriOffreEmploiCommandHandler: StubbedClass<DeleteFavoriOffreEmploiCommandHandler>
  let app: INestApplication

  before(async () => {
    createActionCommandHandler = stubClass(CreateActionCommandHandler)
    addFavoriOffreEmploiCommandHandler = stubClass(
      AddFavoriOffreEmploiCommandHandler
    )
    deleteFavoriOffreEmploiCommandHandler = stubClass(
      DeleteFavoriOffreEmploiCommandHandler
    )
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(CreateActionCommandHandler)
      .useValue(createActionCommandHandler)
      .overrideProvider(AddFavoriOffreEmploiCommandHandler)
      .useValue(addFavoriOffreEmploiCommandHandler)
      .overrideProvider(DeleteFavoriOffreEmploiCommandHandler)
      .useValue(deleteFavoriOffreEmploiCommandHandler)
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
        .send(actionPayload)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: echec.error.message,
          statusCode: HttpStatus.BAD_REQUEST
        })
    })
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
        .send(payload)

        // Then
        .expect(HttpStatus.CONFLICT)
    })
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
          failure(new NonTrouveError('OffreEmploi', command.idOffreEmploi))
        )

      const expectedMessageJson = {
        code: 'NON_TROUVE',
        message: `OffreEmploi ${command.idOffreEmploi} non trouvé(e)`
      }
      //When
      await request(app.getHttpServer())
        .delete(`/jeunes/${jeune.id}/favori/${offreEmploi.id}`)
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
        //Then
        .expect(HttpStatus.NOT_FOUND)
        .expect(expectedMessageJson)
    })
  })
})

import { HttpStatus, INestApplication } from '@nestjs/common'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from 'src/application/commands/add-favori-offre-immersion.command.handler'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from 'src/application/commands/delete-favori-offre-immersion.command.handler'
import * as request from 'supertest'
import { uneOffreImmersion } from 'test/fixtures/offre-immersion.fixture'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi.command.handler'
import {
  FavoriExisteDejaError,
  FavoriNonTrouveError,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import {
  AddFavoriImmersionPayload,
  AddFavoriOffresEmploiPayload
} from '../../../src/infrastructure/routes/validation/favoris.inputs'
import {
  unHeaderAuthorization,
  unUtilisateurDecode
} from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import {
  buildTestingModuleForHttpTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

describe.only('FavorisController', () => {
  let addFavoriOffreEmploiCommandHandler: StubbedClass<AddFavoriOffreEmploiCommandHandler>
  let deleteFavoriOffreEmploiCommandHandler: StubbedClass<DeleteFavoriOffreEmploiCommandHandler>
  let addFavoriOffreImmersionCommandHandler: StubbedClass<AddFavoriOffreImmersionCommandHandler>
  let deleteFavoriOffreImmersionCommandHandler: StubbedClass<DeleteFavoriOffreImmersionCommandHandler>
  let app: INestApplication

  before(async () => {
    addFavoriOffreEmploiCommandHandler = stubClass(
      AddFavoriOffreEmploiCommandHandler
    )
    deleteFavoriOffreEmploiCommandHandler = stubClass(
      DeleteFavoriOffreEmploiCommandHandler
    )

    addFavoriOffreImmersionCommandHandler = stubClass(
      AddFavoriOffreImmersionCommandHandler
    )
    deleteFavoriOffreImmersionCommandHandler = stubClass(
      DeleteFavoriOffreImmersionCommandHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(AddFavoriOffreEmploiCommandHandler)
      .useValue(addFavoriOffreEmploiCommandHandler)
      .overrideProvider(DeleteFavoriOffreEmploiCommandHandler)
      .useValue(deleteFavoriOffreEmploiCommandHandler)
      .overrideProvider(AddFavoriOffreImmersionCommandHandler)
      .useValue(addFavoriOffreImmersionCommandHandler)
      .overrideProvider(DeleteFavoriOffreImmersionCommandHandler)
      .useValue(deleteFavoriOffreImmersionCommandHandler)
      .compile()

    app = testingModule.createNestApplication()
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe(' Favoris Offres Emploi', () => {
    describe('POST /jeunes/:idJeune/favori/offres-emploi', () => {
      const offreEmploi = uneOffreEmploi()
      const command: AddFavoriOffreEmploiCommand = {
        idJeune: 'ABCDE',
        offreEmploi: offreEmploi
      }

      const payload: AddFavoriOffresEmploiPayload = {
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
          .post('/jeunes/ABCDE/favori/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          addFavoriOffreEmploiCommandHandler.execute
        ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
      })
      it('renvoie une 404 (Not Found) quand le jeune n"existe pas', async () => {
        // Given
        addFavoriOffreEmploiCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('Jeune', command.idJeune)))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/favori/offres-emploi')
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
          .post('/jeunes/ABCDE/favori/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CONFLICT)
      })
      ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/favori')
    })

    describe('DELETE /jeunes/:idJeune/favori/offres-emploi/:idOffreEmploi', () => {
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
          .delete(`/jeunes/${jeune.id}/favori/offres-emploi/${offreEmploi.id}`)
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NO_CONTENT)
        expect(
          deleteFavoriOffreEmploiCommandHandler.execute
        ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
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
          .delete(`/jeunes/${jeune.id}/favori/offres-emploi/${offreEmploi.id}`)
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
          .delete(`/jeunes/${jeune.id}/favori/offres-emploi/${offreEmploi.id}`)
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NOT_FOUND)
          .expect(expectedMessageJson)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'delete',
        '/jeunes/ABCDE/favori/offres-emploi/123'
      )
    })
  })

  describe(' Favoris Offres Immersion', () => {
    describe('POST /jeunes/:idJeune/favori/offres-immersion', () => {
      const offreImmersion = uneOffreImmersion()
      const command: AddFavoriOffreImmersionCommand = {
        idJeune: 'ABCDE',
        offreImmersion: offreImmersion
      }

      const payload: AddFavoriImmersionPayload = {
        idOffre: offreImmersion.id,
        metier: offreImmersion.metier,
        nomEtablissement: offreImmersion.nomEtablissement,
        secteurActivite: offreImmersion.secteurActivite,
        ville: offreImmersion.ville
      }
      it('crée un favori', async () => {
        // Given
        addFavoriOffreImmersionCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/favori/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          addFavoriOffreImmersionCommandHandler.execute
        ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
      })
      it('renvoie une 404 (Not Found) quand le jeune n"existe pas', async () => {
        // Given
        addFavoriOffreImmersionCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('Jeune', command.idJeune)))

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/favori/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.NOT_FOUND)
      })
      it("renvoie une 409 (Conflict) quand l'offre n'existe pas", async () => {
        // Given
        addFavoriOffreImmersionCommandHandler.execute
          .withArgs(command)
          .resolves(
            failure(
              new FavoriExisteDejaError(
                command.idJeune,
                command.offreImmersion.id
              )
            )
          )

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/favori/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CONFLICT)
      })
      ensureUserAuthenticationFailsIfInvalid('post', '/jeunes/ABCDE/favori')
    })

    describe('DELETE /jeunes/:idJeune/favori/offres-immersion/:idOffreImmersion', () => {
      const offreImmersion = uneOffreImmersion()
      const jeune = unJeune()
      const command: DeleteFavoriOffreImmersionCommand = {
        idJeune: jeune.id,
        idOffreImmersion: offreImmersion.id
      }
      it('supprime le favori', async () => {
        //Given
        deleteFavoriOffreImmersionCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())
        //When
        await request(app.getHttpServer())
          .delete(
            `/jeunes/${jeune.id}/favori/offres-immersion/${offreImmersion.id}`
          )
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NO_CONTENT)
        expect(
          deleteFavoriOffreImmersionCommandHandler.execute
        ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
      })
      it('renvoie une 404(NOT FOUND) si le favori n"existe pas', async () => {
        //Given
        deleteFavoriOffreImmersionCommandHandler.execute
          .withArgs(command)
          .resolves(
            failure(
              new FavoriNonTrouveError(
                command.idJeune,
                command.idOffreImmersion
              )
            )
          )

        const expectedMessageJson = {
          code: 'FAVORI_NON_TROUVE',
          message: `Le Favori du jeune ${command.idJeune} correspondant à l'offre ${command.idOffreImmersion} n'existe pas`
        }
        //When
        await request(app.getHttpServer())
          .delete(
            `/jeunes/${jeune.id}/favori/offres-immersion/${offreImmersion.id}`
          )
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NOT_FOUND)
          .expect(expectedMessageJson)
      })
      it('renvoie une 404(NOT FOUND) si le jeune n"existe pas', async () => {
        //Given
        deleteFavoriOffreImmersionCommandHandler.execute
          .withArgs(command)
          .resolves(failure(new NonTrouveError('Jeune', command.idJeune)))

        const expectedMessageJson = {
          code: 'NON_TROUVE',
          message: `Jeune ${command.idJeune} non trouvé(e)`
        }
        //When
        await request(app.getHttpServer())
          .delete(
            `/jeunes/${jeune.id}/favori/offres-immersion/${offreImmersion.id}`
          )
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NOT_FOUND)
          .expect(expectedMessageJson)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'delete',
        '/jeunes/ABCDE/favori/offres-immersion/123'
      )
    })
  })
})

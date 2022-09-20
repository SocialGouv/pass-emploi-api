import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import {
  AddFavoriOffreImmersionCommand,
  AddFavoriOffreImmersionCommandHandler
} from 'src/application/commands/add-favori-offre-immersion.command.handler'
import {
  DeleteFavoriOffreImmersionCommand,
  DeleteFavoriOffreImmersionCommandHandler
} from 'src/application/commands/delete-favori-offre-immersion.command.handler'
import { GetFavorisOffresEmploiJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-emploi-jeune.query.handler.db'
import { GetFavorisOffresImmersionJeuneQueryHandler } from 'src/application/queries/get-favoris-offres-immersion-jeune.query.handler.db'
import * as request from 'supertest'
import { uneOffreImmersion } from 'test/fixtures/offre-immersion.fixture'
import {
  AddFavoriOffreEmploiCommand,
  AddFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/add-favori-offre-emploi.command.handler'
import {
  AddFavoriServiceCiviqueCommand,
  AddFavoriOffreServiceCiviqueCommandHandler
} from '../../../src/application/commands/add-favori-offre-service-civique-command-handler'
import {
  DeleteFavoriOffreEmploiCommand,
  DeleteFavoriOffreEmploiCommandHandler
} from '../../../src/application/commands/delete-favori-offre-emploi.command.handler'
import {
  DeleteFavoriOffreServiceCiviqueCommand,
  DeleteFavoriOffreServiceCiviqueCommandHandler
} from '../../../src/application/commands/delete-favori-offre-service-civique.command.handler'
import {
  FavoriExisteDejaError,
  FavoriNonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
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
import { GetFavorisServiceCiviqueJeuneQueryHandler } from '../../../src/application/queries/get-favoris-service-civique-jeune.query.handler.db'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import { GetFavorisJeunePourConseillerQueryHandler } from '../../../src/application/queries/get-favoris-jeune-pour-conseiller.query.handler.db'
import { GetMetadonneesFavorisJeuneQueryHandler } from '../../../src/application/queries/get-metadonnees-favoris-jeune.query.handler.db'
import { Offre } from '../../../src/domain/offre/offre'

describe('FavorisController', () => {
  let addFavoriOffreEmploiCommandHandler: StubbedClass<AddFavoriOffreEmploiCommandHandler>
  let deleteFavoriOffreEmploiCommandHandler: StubbedClass<DeleteFavoriOffreEmploiCommandHandler>
  let getFavorisOffresEmploiJeuneQueryHandler: StubbedClass<GetFavorisOffresEmploiJeuneQueryHandler>
  let addFavoriOffreImmersionCommandHandler: StubbedClass<AddFavoriOffreImmersionCommandHandler>
  let deleteFavoriOffreImmersionCommandHandler: StubbedClass<DeleteFavoriOffreImmersionCommandHandler>
  let getFavorisOffresImmersionJeuneQueryHandler: StubbedClass<GetFavorisOffresImmersionJeuneQueryHandler>
  let addFavoriOffreEngagementCommandHandler: StubbedClass<AddFavoriOffreServiceCiviqueCommandHandler>
  let deleteFavoriOffreEngagementCommandHandler: StubbedClass<DeleteFavoriOffreServiceCiviqueCommandHandler>
  let getFavorisServiceCiviqueJeuneQueryHandler: StubbedClass<GetFavorisServiceCiviqueJeuneQueryHandler>
  let getFavorisJeunePourConseillerQueryHandler: StubbedClass<GetFavorisJeunePourConseillerQueryHandler>
  let getMetadonneesFavorisJeuneQueryHandler: StubbedClass<GetMetadonneesFavorisJeuneQueryHandler>
  let app: INestApplication

  before(async () => {
    addFavoriOffreEmploiCommandHandler = stubClass(
      AddFavoriOffreEmploiCommandHandler
    )
    deleteFavoriOffreEmploiCommandHandler = stubClass(
      DeleteFavoriOffreEmploiCommandHandler
    )
    getFavorisOffresEmploiJeuneQueryHandler = stubClass(
      GetFavorisOffresEmploiJeuneQueryHandler
    )

    addFavoriOffreImmersionCommandHandler = stubClass(
      AddFavoriOffreImmersionCommandHandler
    )
    deleteFavoriOffreImmersionCommandHandler = stubClass(
      DeleteFavoriOffreImmersionCommandHandler
    )
    getFavorisOffresImmersionJeuneQueryHandler = stubClass(
      GetFavorisOffresImmersionJeuneQueryHandler
    )

    addFavoriOffreEngagementCommandHandler = stubClass(
      AddFavoriOffreServiceCiviqueCommandHandler
    )
    deleteFavoriOffreEngagementCommandHandler = stubClass(
      DeleteFavoriOffreServiceCiviqueCommandHandler
    )
    getFavorisServiceCiviqueJeuneQueryHandler = stubClass(
      GetFavorisServiceCiviqueJeuneQueryHandler
    )
    getFavorisJeunePourConseillerQueryHandler = stubClass(
      GetFavorisJeunePourConseillerQueryHandler
    )
    getMetadonneesFavorisJeuneQueryHandler = stubClass(
      GetMetadonneesFavorisJeuneQueryHandler
    )

    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(AddFavoriOffreEmploiCommandHandler)
      .useValue(addFavoriOffreEmploiCommandHandler)
      .overrideProvider(DeleteFavoriOffreEmploiCommandHandler)
      .useValue(deleteFavoriOffreEmploiCommandHandler)
      .overrideProvider(GetFavorisOffresEmploiJeuneQueryHandler)
      .useValue(getFavorisOffresEmploiJeuneQueryHandler)
      .overrideProvider(AddFavoriOffreImmersionCommandHandler)
      .useValue(addFavoriOffreImmersionCommandHandler)
      .overrideProvider(DeleteFavoriOffreImmersionCommandHandler)
      .useValue(deleteFavoriOffreImmersionCommandHandler)
      .overrideProvider(GetFavorisOffresImmersionJeuneQueryHandler)
      .useValue(getFavorisOffresImmersionJeuneQueryHandler)
      .overrideProvider(AddFavoriOffreServiceCiviqueCommandHandler)
      .useValue(addFavoriOffreEngagementCommandHandler)
      .overrideProvider(DeleteFavoriOffreServiceCiviqueCommandHandler)
      .useValue(deleteFavoriOffreEngagementCommandHandler)
      .overrideProvider(GetFavorisServiceCiviqueJeuneQueryHandler)
      .useValue(getFavorisServiceCiviqueJeuneQueryHandler)
      .overrideProvider(GetFavorisJeunePourConseillerQueryHandler)
      .useValue(getFavorisJeunePourConseillerQueryHandler)
      .overrideProvider(GetMetadonneesFavorisJeuneQueryHandler)
      .useValue(getMetadonneesFavorisJeuneQueryHandler)
      .compile()

    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
  })

  describe('Favoris pour Conseiller', () => {
    describe('GET /jeunes/:idJeune/favoris', () => {
      it('Renvoie la liste des favoris du jeune', async () => {
        // Given
        getFavorisJeunePourConseillerQueryHandler.execute
          .withArgs({ idJeune: '1' }, unUtilisateurDecode())
          .resolves([])

        // When - Then
        await request(app.getHttpServer())
          .get('/jeunes/1/favoris')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify([]))
      })
      ensureUserAuthenticationFailsIfInvalid('GET', '/jeunes/ABCDE/favoris')
    })
  })

  describe(' Favoris Offres Emploi', () => {
    describe('GET /jeunes/:idJeune/favoris/offres-emploi', () => {
      it("Renvoie la liste des favoris offres emploi d'un jeune", async () => {
        // Given
        getFavorisOffresEmploiJeuneQueryHandler.execute
          .withArgs({ idJeune: '1', detail: false }, unUtilisateurDecode())
          .resolves([])

        // When - Then
        await request(app.getHttpServer())
          .get('/jeunes/1/favoris/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify([]))
      })
      ensureUserAuthenticationFailsIfInvalid(
        'GET',
        '/jeunes/ABCDE/favoris/offres-emploi'
      )
    })

    describe('POST /jeunes/:idJeune/favoris/offres-emploi', () => {
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
          .post('/jeunes/ABCDE/favoris/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          addFavoriOffreEmploiCommandHandler.execute
        ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
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
          .post('/jeunes/ABCDE/favoris/offres-emploi')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CONFLICT)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'POST',
        '/jeunes/ABCDE/favoris/offres-emploi'
      )
    })

    describe('DELETE /jeunes/:idJeune/favoris/offres-emploi/:idOffreEmploi', () => {
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
          .delete(`/jeunes/${jeune.id}/favoris/offres-emploi/${offreEmploi.id}`)
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
          .delete(`/jeunes/${jeune.id}/favoris/offres-emploi/${offreEmploi.id}`)
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NOT_FOUND)
          .expect(expectedMessageJson)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'DELETE',
        '/jeunes/ABCDE/favoris/offres-emploi/123'
      )
    })
  })

  describe(' Favoris Offres Immersion', () => {
    describe('GET /jeunes/:idJeune/favoris/offres-immersion', () => {
      it("Renvoie la liste des favoris immersion d'un jeune", async () => {
        // Given
        getFavorisOffresImmersionJeuneQueryHandler.execute
          .withArgs({ idJeune: '1', detail: false }, unUtilisateurDecode())
          .resolves([])

        // When - Then
        await request(app.getHttpServer())
          .get('/jeunes/1/favoris/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify([]))
      })
      ensureUserAuthenticationFailsIfInvalid(
        'GET',
        '/jeunes/ABCDE/favoris/offres-immersion'
      )
    })

    describe('POST /jeunes/:idJeune/favoris/offres-immersion', () => {
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
          .post('/jeunes/ABCDE/favoris/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          addFavoriOffreImmersionCommandHandler.execute
        ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
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
          .post('/jeunes/ABCDE/favoris/offres-immersion')
          .set('authorization', unHeaderAuthorization())
          .send(payload)

          // Then
          .expect(HttpStatus.CONFLICT)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'POST',
        '/jeunes/ABCDE/favoris/offres-immersion'
      )
    })

    describe('DELETE /jeunes/:idJeune/favoris/offres-immersion/:idOffreImmersion', () => {
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
            `/jeunes/${jeune.id}/favoris/offres-immersion/${offreImmersion.id}`
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
            `/jeunes/${jeune.id}/favoris/offres-immersion/${offreImmersion.id}`
          )
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NOT_FOUND)
          .expect(expectedMessageJson)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'delete',
        '/jeunes/ABCDE/favoris/offres-immersion/123'
      )
    })
  })

  describe(' Favoris Services Civique', () => {
    describe('GET /jeunes/:idJeune/favoris/services-civique', () => {
      it('Renvoie la liste des favoris services civique d’un jeune', async () => {
        // Given
        getFavorisServiceCiviqueJeuneQueryHandler.execute
          .withArgs({ idJeune: '1', detail: false }, unUtilisateurDecode())
          .resolves([])

        // When - Then
        await request(app.getHttpServer())
          .get('/jeunes/1/favoris/services-civique')
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(JSON.stringify([]))
      })
    })

    describe('POST /jeunes/:idJeune/favoris/services-civique', () => {
      const offre: Offre.Favori.ServiceCivique = {
        id: 'unId',
        domaine: Offre.ServiceCivique.Domaine.education,
        ville: 'Paris',
        titre: 'La best offre',
        organisation: 'FNAC',
        dateDeDebut: '2022-05-12T10:00:10'
      }
      const command: AddFavoriServiceCiviqueCommand = {
        idJeune: 'ABCDE',
        offre
      }

      it('crée un favori', async () => {
        // Given
        addFavoriOffreEngagementCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/favoris/services-civique')
          .set('authorization', unHeaderAuthorization())
          .send(offre)

          // Then
          .expect(HttpStatus.CREATED)
        expect(
          addFavoriOffreEngagementCommandHandler.execute
        ).to.have.been.calledWithExactly(command, unUtilisateurDecode())
      })
      it("renvoie une 409 (Conflict) quand l'offre n'existe pas", async () => {
        // Given
        addFavoriOffreEngagementCommandHandler.execute
          .withArgs(command)
          .resolves(
            failure(
              new FavoriExisteDejaError(command.idJeune, command.offre.id)
            )
          )

        // When
        await request(app.getHttpServer())
          .post('/jeunes/ABCDE/favoris/services-civique')
          .set('authorization', unHeaderAuthorization())
          .send(offre)

          // Then
          .expect(HttpStatus.CONFLICT)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'post',
        '/jeunes/ABCDE/favoris/services-civique'
      )
    })

    describe('DELETE /jeunes/:idJeune/favoris/services-civique/:idOffre', () => {
      const offre = uneOffreServiceCivique()
      const jeune = unJeune()
      const command: DeleteFavoriOffreServiceCiviqueCommand = {
        idJeune: jeune.id,
        idOffre: offre.id
      }
      it('supprime le favori', async () => {
        //Given
        deleteFavoriOffreEngagementCommandHandler.execute
          .withArgs(command)
          .resolves(emptySuccess())
        //When
        await request(app.getHttpServer())
          .delete(`/jeunes/${jeune.id}/favoris/services-civique/${offre.id}`)
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NO_CONTENT)
        expect(
          deleteFavoriOffreEngagementCommandHandler.execute
        ).to.have.be.calledWithExactly(command, unUtilisateurDecode())
      })
      it('renvoie une 404(NOT FOUND) si le favori n"existe pas', async () => {
        //Given
        deleteFavoriOffreEngagementCommandHandler.execute
          .withArgs(command)
          .resolves(
            failure(new FavoriNonTrouveError(command.idJeune, command.idOffre))
          )

        const expectedMessageJson = {
          code: 'FAVORI_NON_TROUVE',
          message: `Le Favori du jeune ${command.idJeune} correspondant à l'offre ${command.idOffre} n'existe pas`
        }
        //When
        await request(app.getHttpServer())
          .delete(`/jeunes/${jeune.id}/favoris/services-civique/${offre.id}`)
          .set('authorization', unHeaderAuthorization())
          //Then
          .expect(HttpStatus.NOT_FOUND)
          .expect(expectedMessageJson)
      })
      ensureUserAuthenticationFailsIfInvalid(
        'delete',
        '/jeunes/ABCDE/favoris/services-civique/123'
      )
    })
  })

  describe(' Métadonnées favoris pour Conseiller', () => {
    describe('GET /jeunes/:idJeune/favoris/metadonnees', () => {
      it('Renvoie les métadonnées des favoris d’un jeune pour un conseiller ', async () => {
        // Given
        const idJeune = 'poi-id-jeune'

        const expectedResponse = {
          favoris: {
            autoriseLePartage: true,
            offres: {
              total: 0,
              nombreOffresAlternance: 0,
              nombreOffresEmploi: 0,
              nombreOffresImmersion: 0,
              nombreOffresServiceCivique: 0
            },
            recherches: {
              total: 0,
              nombreRecherchesOffresAlternance: 0,
              nombreRecherchesOffresEmploi: 0,
              nombreRecherchesOffresImmersion: 0,
              nombreRecherchesOffresServiceCivique: 0
            }
          }
        }
        getMetadonneesFavorisJeuneQueryHandler.execute.resolves(
          success(expectedResponse)
        )

        // When- Then
        await request(app.getHttpServer())
          .get(`/jeunes/${idJeune}/favoris/metadonnees`)
          .set('authorization', unHeaderAuthorization())
          .expect(HttpStatus.OK)
          .expect(expectedResponse)
      })
    })
  })
})

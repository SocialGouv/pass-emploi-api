import { DateTime } from 'luxon'
import { Core } from 'src/domain/core'
import { Offre } from 'src/domain/offre/offre'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import {
  GetMetadonneesFavorisJeuneQuery,
  GetMetadonneesFavorisJeuneQueryHandler
} from '../../../../src/application/queries/favoris/get-metadonnees-favoris-jeune.query.handler.db'
import { success } from '../../../../src/building-blocks/types/result'
import { Recherche } from '../../../../src/domain/offre/recherche/recherche'
import { OffresEmploiHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { FavorisOffresImmersionSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../../src/infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { RechercheSqlRepository } from '../../../../src/infrastructure/repositories/offre/recherche/recherche-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { IdService } from '../../../../src/utils/id-service'
import { uneRecherche } from '../../../fixtures/recherche.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetMetadonneesFavorisJeuneQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let getMetadonneesFavorisJeuneQueryHandler: GetMetadonneesFavorisJeuneQueryHandler
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>

  let recherchesSauvegardeesRepository: RechercheSqlRepository
  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    recherchesSauvegardeesRepository = new RechercheSqlRepository(
      databaseForTesting.sequelize
    )
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)

    getMetadonneesFavorisJeuneQueryHandler =
      new GetMetadonneesFavorisJeuneQueryHandler(conseillerAgenceAuthorizer)
  })

  describe('handle', () => {
    const idJeune = 'poi-id-jeune'
    beforeEach(async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: 'poi-id-conseiller' })
      await ConseillerSqlModel.creer(conseillerDto)

      const jeuneDto = unJeuneDto({
        id: idJeune,
        idConseiller: conseillerDto.id,
        partageFavoris: true
      })
      await JeuneSqlModel.creer(jeuneDto)
    })

    describe('offres', () => {
      it("récupère le nombre d'offres immersion et l'autorisation de partage", async () => {
        // Given
        const uneOffreImmersion = {
          id: 'poi-id-offre',
          metier: 'poi-metier',
          nomEtablissement: 'poi-etablissement',
          secteurActivite: 'poi-secteur-activite',
          ville: 'poi-ville'
        }
        const offreImmersionRepository =
          new FavorisOffresImmersionSqlRepository()
        await offreImmersionRepository.save({
          idBeneficiaire: idJeune,
          offre: uneOffreImmersion,
          dateCreation: DateTime.now()
        })

        const query = {
          idJeune: idJeune
        }
        const expectedMetadonnees = {
          favoris: {
            autoriseLePartage: true,
            offres: {
              total: 1,
              nombreOffresAlternance: 0,
              nombreOffresEmploi: 0,
              nombreOffresImmersion: 1,
              nombreOffresServiceCivique: 0
            },
            recherches: {
              total: 0,
              nombreRecherchesOffresEmploi: 0,
              nombreRecherchesOffresAlternance: 0,
              nombreRecherchesOffresImmersion: 0,
              nombreRecherchesOffresServiceCivique: 0
            }
          }
        }

        // When
        const actual = await getMetadonneesFavorisJeuneQueryHandler.handle(
          query
        )

        // Then

        expect(actual).to.deep.equal(success(expectedMetadonnees))
      })
      it("récupère le nombre d'offres service civique et l'autorisation de partage", async () => {
        // Given
        const uneOffreServiceCivique = {
          id: 'poi-id-offre',
          domaine: 'poi-domaine',
          titre: 'poi-titre'
        }
        const offreServiceCiviqueRepository =
          new OffreServiceCiviqueHttpSqlRepository()
        await offreServiceCiviqueRepository.save({
          idBeneficiaire: idJeune,
          offre: uneOffreServiceCivique,
          dateCreation: DateTime.now()
        })

        const query = {
          idJeune: idJeune
        }
        const expectedMetadonnees = {
          favoris: {
            autoriseLePartage: true,
            offres: {
              total: 1,
              nombreOffresAlternance: 0,
              nombreOffresEmploi: 0,
              nombreOffresImmersion: 0,
              nombreOffresServiceCivique: 1
            },
            recherches: {
              total: 0,
              nombreRecherchesOffresEmploi: 0,
              nombreRecherchesOffresAlternance: 0,
              nombreRecherchesOffresImmersion: 0,
              nombreRecherchesOffresServiceCivique: 0
            }
          }
        }

        // When
        const result = await getMetadonneesFavorisJeuneQueryHandler.handle(
          query
        )

        // Then
        expect(result).to.deep.equal(success(expectedMetadonnees))
      })

      it("récupère le nombre d'offres alternance et l'autorisation de partage", async () => {
        // Given
        const uneOffreAlternance = {
          id: 'poi-id-offre',
          titre: 'poi-titre',
          typeContrat: 'poi-type-contrat',
          alternance: true
        }
        const favori: Offre.Favori<Offre.Favori.Emploi> = {
          idBeneficiaire: idJeune,
          dateCreation: DateTime.now(),
          offre: uneOffreAlternance
        }
        const offreEmploiRepository = new OffresEmploiHttpSqlRepository()
        await offreEmploiRepository.save(favori)

        const query = {
          idJeune: idJeune
        }
        const expectedMetadonnees = {
          favoris: {
            autoriseLePartage: true,
            offres: {
              total: 1,
              nombreOffresAlternance: 1,
              nombreOffresEmploi: 0,
              nombreOffresImmersion: 0,
              nombreOffresServiceCivique: 0
            },
            recherches: {
              total: 0,
              nombreRecherchesOffresEmploi: 0,
              nombreRecherchesOffresAlternance: 0,
              nombreRecherchesOffresImmersion: 0,
              nombreRecherchesOffresServiceCivique: 0
            }
          }
        }
        // When
        const result = await getMetadonneesFavorisJeuneQueryHandler.handle(
          query
        )

        // Then
        expect(result).to.deep.equal(success(expectedMetadonnees))
      })

      it("récupère le nombre d'offres emploi et l'autorisation de partage", async () => {
        // Given
        const uneOffreEmploi = {
          id: 'poi-id-offre',
          titre: 'poi-titre',
          typeContrat: 'poi-type-contrat'
        }
        const favori: Offre.Favori<Offre.Favori.Emploi> = {
          idBeneficiaire: idJeune,
          dateCreation: DateTime.now(),
          offre: uneOffreEmploi
        }
        const offreEmploiRepository = new OffresEmploiHttpSqlRepository()
        await offreEmploiRepository.save(favori)

        const query = {
          idJeune: idJeune
        }
        const expectedMetadonnees = {
          favoris: {
            autoriseLePartage: true,
            offres: {
              total: 1,
              nombreOffresAlternance: 0,
              nombreOffresEmploi: 1,
              nombreOffresImmersion: 0,
              nombreOffresServiceCivique: 0
            },
            recherches: {
              total: 0,
              nombreRecherchesOffresEmploi: 0,
              nombreRecherchesOffresAlternance: 0,
              nombreRecherchesOffresImmersion: 0,
              nombreRecherchesOffresServiceCivique: 0
            }
          }
        }

        // When
        const result = await getMetadonneesFavorisJeuneQueryHandler.handle(
          query
        )

        // Then
        expect(result).to.deep.equal(success(expectedMetadonnees))
      })
    })

    describe('recherches sauvegardées', () => {
      const idService: StubbedClass<IdService> = stubClass(IdService)
      idService.uuid.returns('poi-id-recherche')

      it("récupère le nombre total de recherches d'offres et l'autorisation de partage", async () => {
        // Given

        const rechercheOffreEmploi = uneRecherche({
          id: '219e8ba5-cd88-4027-9828-55e8ca99a236',
          type: Recherche.Type.OFFRES_EMPLOI,
          idJeune
        })
        const rechercheOffreAlternance = uneRecherche({
          id: '119e8ba5-cd88-4027-9828-55e8ca99a236',
          type: Recherche.Type.OFFRES_ALTERNANCE,
          idJeune
        })
        const rechercheOffreImmersion = uneRecherche({
          id: '339e8ba5-cd88-4027-9828-55e8ca99a236',
          type: Recherche.Type.OFFRES_IMMERSION,
          idJeune
        })
        const rechercheOffreServiceCivique = uneRecherche({
          id: '249e8ba5-cd88-4027-9828-55e8ca99a236',
          type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
          idJeune
        })
        await Promise.all([
          recherchesSauvegardeesRepository.save(rechercheOffreEmploi),
          recherchesSauvegardeesRepository.save(rechercheOffreAlternance),
          recherchesSauvegardeesRepository.save(rechercheOffreImmersion),
          recherchesSauvegardeesRepository.save(rechercheOffreServiceCivique)
        ])

        const query = {
          idJeune: idJeune
        }
        const expectedMetadonnees = {
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
              total: 4,
              nombreRecherchesOffresEmploi: 1,
              nombreRecherchesOffresAlternance: 1,
              nombreRecherchesOffresImmersion: 1,
              nombreRecherchesOffresServiceCivique: 1
            }
          }
        }

        // When
        const result = await getMetadonneesFavorisJeuneQueryHandler.handle(
          query
        )

        // Then
        expect(result).to.deep.equal(success(expectedMetadonnees))
      })
    })

    describe('authorize', () => {
      it("appelle l'authorizer pour le conseiller", async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })

        const query: GetMetadonneesFavorisJeuneQuery = {
          idJeune: 'id-jeune'
        }

        // When
        await getMetadonneesFavorisJeuneQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(
          conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
        ).to.have.been.calledWithExactly('id-jeune', utilisateur)
      })
    })
  })
})

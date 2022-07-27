import { expect, StubbedClass, stubClass } from '../../utils'
import { GetMetadonneesFavorisJeuneQueryHandler } from '../../../src/application/queries/get-metadonnees-favoris-jeune.query.handler'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { OffresImmersionHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-immersion-http-sql.repository.db'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-service-civique-http.repository.db'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository.db'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { success } from '../../../src/building-blocks/types/result'

describe('MetadonneesFavorisJeuneQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getMetadonneesFavorisJeuneQueryHandler: GetMetadonneesFavorisJeuneQueryHandler
  let serviceCiviqueClient: StubbedClass<EngagementClient>
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>

  beforeEach(async () => {
    serviceCiviqueClient = stubClass(EngagementClient)
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)

    getMetadonneesFavorisJeuneQueryHandler =
      new GetMetadonneesFavorisJeuneQueryHandler(conseillerForJeuneAuthorizer)
  })

  describe('handle', () => {
    const idJeune = 'poi-id-jeune'
    const partageFavorisJeune = true

    beforeEach(async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: 'poi-id-conseiller' })
      await ConseillerSqlModel.creer(conseillerDto)

      const jeuneDto = unJeuneDto({
        id: idJeune,
        idConseiller: conseillerDto.id,
        partageFavoris: partageFavorisJeune
      })
      await JeuneSqlModel.creer(jeuneDto)
    })

    it("récupère le nombre d'offres immersion et l'autorisation de partage", async () => {
      // Given
      const uneOffreImmersion = {
        id: 'poi-id-offre',
        metier: 'poi-metier',
        nomEtablissement: 'poi-etablissement',
        secteurActivite: 'poi-secteur-activite',
        ville: 'poi-ville'
      }
      const offreImmersionRepository = new OffresImmersionHttpSqlRepository()
      await offreImmersionRepository.saveAsFavori(idJeune, uneOffreImmersion)

      const query = {
        idJeune: idJeune
      }
      const expectedMetadonnees = {
        favoris: {
          autoriseLePartage: partageFavorisJeune,
          offres: {
            total: 1,
            nombreOffresAlternance: 0,
            nombreOffresEmploi: 0,
            nombreOffresImmersion: 1,
            nombreOffresServiceCivique: 0
          }
        }
      }

      // When
      const actual = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

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
        new OffreServiceCiviqueHttpSqlRepository(serviceCiviqueClient)
      await offreServiceCiviqueRepository.saveAsFavori(
        idJeune,
        uneOffreServiceCivique
      )

      const query = {
        idJeune: idJeune
      }
      const expectedMetadonnees = {
        favoris: {
          autoriseLePartage: partageFavorisJeune,
          offres: {
            total: 1,
            nombreOffresAlternance: 0,
            nombreOffresEmploi: 0,
            nombreOffresImmersion: 0,
            nombreOffresServiceCivique: 1
          }
        }
      }

      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

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
      const offreEmploiRepository = new OffresEmploiHttpSqlRepository()
      await offreEmploiRepository.saveAsFavori(idJeune, uneOffreAlternance)

      const query = {
        idJeune: idJeune
      }
      const expectedMetadonnees = {
        favoris: {
          autoriseLePartage: partageFavorisJeune,
          offres: {
            total: 1,
            nombreOffresAlternance: 1,
            nombreOffresEmploi: 0,
            nombreOffresImmersion: 0,
            nombreOffresServiceCivique: 0
          }
        }
      }
      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

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
      const offreEmploiRepository = new OffresEmploiHttpSqlRepository()
      await offreEmploiRepository.saveAsFavori(idJeune, uneOffreEmploi)

      const query = {
        idJeune: idJeune
      }
      const expectedMetadonnees = {
        favoris: {
          autoriseLePartage: partageFavorisJeune,
          offres: {
            total: 1,
            nombreOffresAlternance: 0,
            nombreOffresEmploi: 1,
            nombreOffresImmersion: 0,
            nombreOffresServiceCivique: 0
          }
        }
      }

      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

      // Then
      expect(result).to.deep.equal(success(expectedMetadonnees))
    })
  })
})

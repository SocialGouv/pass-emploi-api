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

describe('MetadonneesFavorisJeuneQueryHandler', () => {
  DatabaseForTesting.prepare()
  let getMetadonneesFavorisJeuneQueryHandler: GetMetadonneesFavorisJeuneQueryHandler
  let serviceCiviqueClient: StubbedClass<EngagementClient>

  beforeEach(async () => {
    getMetadonneesFavorisJeuneQueryHandler =
      new GetMetadonneesFavorisJeuneQueryHandler()

    serviceCiviqueClient = stubClass(EngagementClient)
  })

  describe('handle', () => {
    it("récupère le nombre d'offres immersion", async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: 'poi-id-conseiller' })
      await ConseillerSqlModel.creer(conseillerDto)

      const jeuneDto = unJeuneDto({ idConseiller: conseillerDto.id })
      await JeuneSqlModel.creer(jeuneDto)

      const uneOffreImmersion = {
        id: 'poi-id-offre',
        metier: 'poi-metier',
        nomEtablissement: 'poi-etablissement',
        secteurActivite: 'poi-secteur-activite',
        ville: 'poi-ville'
      }
      const offreImmersionRepository = new OffresImmersionHttpSqlRepository()
      await offreImmersionRepository.saveAsFavori(
        jeuneDto.id,
        uneOffreImmersion
      )

      const query = {
        idJeune: jeuneDto.id
      }

      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

      // Then
      expect(result.nombreOffresImmersion).to.equal(1)
    })
    it("récupère le nombre d'offres service civique", async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: 'poi-id-conseiller' })
      await ConseillerSqlModel.creer(conseillerDto)

      const jeuneDto = unJeuneDto({ idConseiller: conseillerDto.id })
      await JeuneSqlModel.creer(jeuneDto)

      const uneOffreServiceCivique = {
        id: 'poi-id-offre',
        domaine: 'poi-domaine',
        titre: 'poi-titre'
      }
      const offreServiceCiviqueRepository =
        new OffreServiceCiviqueHttpSqlRepository(serviceCiviqueClient)
      await offreServiceCiviqueRepository.saveAsFavori(
        jeuneDto.id,
        uneOffreServiceCivique
      )

      const query = {
        idJeune: jeuneDto.id
      }

      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

      // Then
      expect(result.nombreOffresServiceCivique).to.equal(1)
    })
    it("récupère le nombre d'offres alternance", async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: 'poi-id-conseiller' })
      await ConseillerSqlModel.creer(conseillerDto)

      const jeuneDto = unJeuneDto({ idConseiller: conseillerDto.id })
      await JeuneSqlModel.creer(jeuneDto)

      const uneOffreAlternance = {
        id: 'poi-id-offre',
        titre: 'poi-titre',
        typeContrat: 'poi-type-contrat',
        alternance: true
      }
      const offreEmploiRepository = new OffresEmploiHttpSqlRepository()
      await offreEmploiRepository.saveAsFavori(jeuneDto.id, uneOffreAlternance)

      const query = {
        idJeune: jeuneDto.id
      }

      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

      // Then
      expect(result.nombreOffresAlternance).to.equal(1)
    })
    it("récupère le nombre d'offres emploi", async () => {
      // Given
      const conseillerDto = unConseillerDto({ id: 'poi-id-conseiller' })
      await ConseillerSqlModel.creer(conseillerDto)

      const jeuneDto = unJeuneDto({ idConseiller: conseillerDto.id })
      await JeuneSqlModel.creer(jeuneDto)

      const uneOffreEmploi = {
        id: 'poi-id-offre',
        titre: 'poi-titre',
        typeContrat: 'poi-type-contrat'
      }
      const offreEmploiRepository = new OffresEmploiHttpSqlRepository()
      await offreEmploiRepository.saveAsFavori(jeuneDto.id, uneOffreEmploi)

      const query = {
        idJeune: jeuneDto.id
      }

      // When
      const result = await getMetadonneesFavorisJeuneQueryHandler.handle(query)

      // Then
      expect(result.nombreOffresEmploi).to.equal(1)
    })
  })
})

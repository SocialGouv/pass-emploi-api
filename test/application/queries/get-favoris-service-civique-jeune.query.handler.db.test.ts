import { DateTime } from 'luxon'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { GetFavorisServiceCiviqueJeuneQueryHandler } from '../../../src/application/queries/get-favoris-service-civique-jeune.query.handler.db'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unFavoriOffreEngagement } from '../../fixtures/sql-models/favoris.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

describe('GetFavorisServiceCiviqueJeuneQueryHandler', () => {
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getFavorisServiceCiviqueJeuneQueryHandler: GetFavorisServiceCiviqueJeuneQueryHandler

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    getFavorisServiceCiviqueJeuneQueryHandler =
      new GetFavorisServiceCiviqueJeuneQueryHandler(jeuneAuthorizer)
  })

  describe('authorize', () => {
    it('appelle le jeune authorizer', async () => {
      // Given
      const idJeune = '123'
      const utilisateur = unUtilisateurJeune()

      // When
      await getFavorisServiceCiviqueJeuneQueryHandler.authorize(
        { idJeune },
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWith(
        idJeune,
        utilisateur
      )
    })
  })

  describe('handle', () => {
    it('renvoie les favoris', async () => {
      const now = DateTime.now()
      const unJeune = unJeuneDto()
      const favori = unFavoriOffreEngagement({
        idJeune: unJeune.id,
        idOffre: '123',
        organisation: 'organisation',
        domaine: 'domaine',
        dateDeDebut: '2021-01-01',
        titre: 'titre',
        ville: 'ville',
        dateCandidature: now.toJSDate()
      })

      const conseillerDto = unConseillerDto()
      await ConseillerSqlModel.creer(conseillerDto)
      const jeuneDto: AsSql<JeuneDto> = {
        ...unJeune,
        idConseiller: conseillerDto.id
      }
      await JeuneSqlModel.creer(jeuneDto)
      await FavoriOffreEngagementSqlModel.create(favori)

      // When
      const result = await getFavorisServiceCiviqueJeuneQueryHandler.handle({
        idJeune: unJeune.id
      })

      // Then
      expect(result).to.deep.equal([
        { id: favori.idOffre, dateCandidature: now.toISO() }
      ])
    })
  })
})

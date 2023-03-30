import {
  GetRecherchesSauvegardeesQuery,
  GetRecherchesSauvegardeesQueryGetter
} from 'src/application/queries/query-getters/accueil/get-recherches-sauvegardees.query.getter.db'
import { fromSqlToRechercheQueryModel } from 'src/application/queries/query-mappers/recherche.mapper'
import { Recherche } from 'src/domain/offre/recherche/recherche'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from 'src/infrastructure/sequelize/models/recherche.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { uneRechercheDto } from 'test/fixtures/sql-models/recherche.sql-model'
import { expect } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'

describe('GetRecherchesSauvegardeesQueryGetter', () => {
  let getRecherchesSauvegardeesQueryGetter: GetRecherchesSauvegardeesQueryGetter

  beforeEach(async () => {
    await getDatabase().cleanPG()
    getRecherchesSauvegardeesQueryGetter =
      new GetRecherchesSauvegardeesQueryGetter()
  })

  describe('handle', () => {
    const query: GetRecherchesSauvegardeesQuery = {
      idJeune: 'idJeune'
    }
    it('renvoie les 3 recherches sauvegardées les plus récentes', async () => {
      const conseiller = unConseillerDto()
      const jeune = unJeuneDto({
        id: query.idJeune
      })
      const recherche_1 = uneRechercheDto({
        id: '219e8ba5-cd88-4027-9828-55e8ca99a236',
        type: Recherche.Type.OFFRES_ALTERNANCE,
        dateCreation: new Date('2022-01-22T10:00:00.000Z'),
        dateDerniereRecherche: new Date('2022-01-22T10:00:00.000Z'),
        idJeune: query.idJeune
      })
      const recherche_2 = uneRechercheDto({
        id: '319e8ba5-cd88-4027-9828-55e8ca99a237',
        type: Recherche.Type.OFFRES_ALTERNANCE,
        dateCreation: new Date('2022-02-22T10:00:00.000Z'),
        dateDerniereRecherche: new Date('2022-02-22T10:00:00.000Z'),
        idJeune: query.idJeune
      })
      const recherche_3 = uneRechercheDto({
        id: '219e8ba5-cd88-4027-9828-55e8ca99a23a',
        type: Recherche.Type.OFFRES_ALTERNANCE,
        dateCreation: new Date('2021-02-22T10:00:00.000Z'),
        dateDerniereRecherche: new Date('2021-02-22T10:00:00.000Z'),
        idJeune: query.idJeune
      })
      const recherche_4 = uneRechercheDto({
        id: '389e8ba5-cd88-4027-9838-55e8ca99a237',
        type: Recherche.Type.OFFRES_ALTERNANCE,
        dateCreation: new Date('2023-01-22T10:00:00.000Z'),
        dateDerniereRecherche: new Date('2023-01-22T10:00:00.000Z'),
        idJeune: query.idJeune
      })

      await ConseillerSqlModel.create(conseiller)
      await JeuneSqlModel.create(jeune)
      const recherche_1_sqlModel = await RechercheSqlModel.create(recherche_1)
      const recherche_2_sqlModel = await RechercheSqlModel.create(recherche_2)
      await RechercheSqlModel.create(recherche_3)
      const recherche_4_sqlModel = await RechercheSqlModel.create(recherche_4)

      const result = await getRecherchesSauvegardeesQueryGetter.handle(query)
      expect(result).to.be.deep.equal([
        fromSqlToRechercheQueryModel(recherche_4_sqlModel),
        fromSqlToRechercheQueryModel(recherche_2_sqlModel),
        fromSqlToRechercheQueryModel(recherche_1_sqlModel)
      ])
    })
  })
})

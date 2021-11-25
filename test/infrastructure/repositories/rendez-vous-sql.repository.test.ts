import { RendezVousConseillerQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-model'
import { RendezVousRepositorySql } from '../../../src/infrastructure/repositories/rendez-vous-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { DatabaseForTesting, expect, stubClass } from '../../utils'

describe('RendezVousRepositorySql', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepositorySql: RendezVousRepositorySql
  const maintenant = uneDatetime

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    rendezVousRepositorySql = new RendezVousRepositorySql(dateService)
  })

  describe('getAllQueryModelsByConseiller', () => {
    let rendezVous: RendezVousConseillerQueryModel
    let unRendezVousPasse: AsSql<RendezVousDto>
    let unRendezVousTresPasse: AsSql<RendezVousDto>
    let unRendezVousProche: AsSql<RendezVousDto>
    let unRendezVousTresFutur: AsSql<RendezVousDto>

    beforeEach(async () => {
      // Given
      const jeune = unJeune()
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: jeune.conseiller.id })
      )
      await JeuneSqlModel.creer(unJeuneDto())

      unRendezVousPasse = unRendezVousDto({
        idJeune: jeune.id,
        idConseiller: jeune.conseiller.id,
        date: maintenant.minus({ days: 2 }).toJSDate(),
        titre: 'UN RENDEZ VOUS PASSÉ'
      })
      unRendezVousTresPasse = unRendezVousDto({
        idJeune: jeune.id,
        idConseiller: jeune.conseiller.id,
        date: maintenant.minus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ VOUS TRES PASSÉ'
      })
      unRendezVousProche = unRendezVousDto({
        idJeune: jeune.id,
        idConseiller: jeune.conseiller.id,
        date: maintenant.plus({ days: 2 }).toJSDate(),
        titre: 'UN RENDEZ PROCHE'
      })
      unRendezVousTresFutur = unRendezVousDto({
        idJeune: jeune.id,
        idConseiller: jeune.conseiller.id,
        date: maintenant.plus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ TRES FUTUR'
      })

      await RendezVousSqlModel.bulkCreate([
        unRendezVousPasse,
        unRendezVousTresPasse,
        unRendezVousTresFutur,
        unRendezVousProche
      ])

      // When
      rendezVous = await rendezVousRepositorySql.getAllQueryModelsByConseiller(
        jeune.conseiller.id
      )
    })
    it('retourne les rendez-vous passés du conseiller', async () => {
      // Then
      expect(rendezVous.passes.length).to.equal(2)
      expect(rendezVous.passes[0].id).to.equal(unRendezVousPasse.id)
      expect(rendezVous.passes[1].id).to.equal(unRendezVousTresPasse.id)
    })

    it('retourne les rendez-vous à venir du conseiller', async () => {
      // Then
      expect(rendezVous.futurs.length).to.equal(2)
      expect(rendezVous.futurs[0].id).to.equal(unRendezVousProche.id)
      expect(rendezVous.futurs[1].id).to.equal(unRendezVousTresFutur.id)
    })
  })
})

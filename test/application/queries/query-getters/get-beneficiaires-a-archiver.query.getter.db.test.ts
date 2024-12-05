import { DateTime } from 'luxon'
import { GetBeneficiairesAArchiverQueryGetter } from 'src/application/queries/query-getters/get-beneficiaires-a-archiver.query.getter.db'
import { success } from 'src/building-blocks/types/result'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneMiloAArchiverSqlModel } from 'src/infrastructure/sequelize/models/jeune-milo-a-archiver.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from 'src/utils/date-service'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'

describe('GetBeneficiairesAArchiverQueryGetter', () => {
  let dateService: StubbedClass<DateService>
  let queryGetter: GetBeneficiairesAArchiverQueryGetter
  let database: DatabaseForTesting

  const now = DateTime.fromISO('2023-04-12')
  beforeEach(async () => {
    database = getDatabase()
    dateService = stubClass(DateService)
    queryGetter = new GetBeneficiairesAArchiverQueryGetter(
      dateService,
      database.sequelize
    )

    dateService.now.returns(now)
    await database.cleanPG()

    await ConseillerSqlModel.creer(unConseillerDto({ id: 'id-conseiller' }))
    await ConseillerSqlModel.creer(unConseillerDto({ id: 'id-conseiller-2' }))
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: 'id-jeune-1',
        nom: 'Curie',
        prenom: 'Marie',
        idConseiller: 'id-conseiller',
        dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
      })
    )
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: 'id-jeune-autre-conseiller',
        nom: 'Edison',
        prenom: 'Thomas',
        idConseiller: 'id-conseiller-2'
      })
    )
  })

  describe('handle', () => {
    it('renvoie les bénéficiaires avec une date de fin de CEJ de plus de 6 mois', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-2',
          nom: 'Lovelace',
          prenom: 'Ada',
          idConseiller: 'id-conseiller',
          dateFinCEJ: now.minus({ month: 6, day: 1 }).toJSDate(),
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        })
      )

      // When
      const actual = await queryGetter.handle('id-conseiller')

      // Then
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-2', nom: 'Lovelace', prenom: 'Ada' }])
      )
    })

    it('renvoie les bénéficiaires avec une date de dernière activité de plus de 6 mois', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-3',
          nom: 'Liskov',
          prenom: 'Barbara',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now
            .minus({ month: 6, day: 1 })
            .toJSDate()
        })
      )

      // When
      const actual = await queryGetter.handle('id-conseiller')

      // Then
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-3', nom: 'Liskov', prenom: 'Barbara' }])
      )
    })

    it('renvoie les bénéficiaires milo marqués à archiver', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-4',
          nom: 'Hopper',
          prenom: 'Grace',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        })
      )
      await JeuneMiloAArchiverSqlModel.create({
        idJeune: 'id-jeune-4'
      })

      // When
      const actual = await queryGetter.handle('id-conseiller')

      // Then
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-4', nom: 'Hopper', prenom: 'Grace' }])
      )
    })
  })

  describe('count', () => {
    it('compte les bénéficiaires à archiver', async () => {
      // Given
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({
          id: 'id-jeune-2',
          nom: 'Lovelace',
          prenom: 'Ada',
          idConseiller: 'id-conseiller',
          dateFinCEJ: now.minus({ month: 6, day: 1 }).toJSDate(),
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        }),
        unJeuneDto({
          id: 'id-jeune-3',
          nom: 'Liskov',
          prenom: 'Barbara',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now
            .minus({ month: 6, day: 1 })
            .toJSDate()
        }),
        unJeuneDto({
          id: 'id-jeune-4',
          nom: 'Hopper',
          prenom: 'Grace',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        })
      ])
      await JeuneMiloAArchiverSqlModel.create({
        idJeune: 'id-jeune-4'
      })

      // When
      const actual = await queryGetter.count('id-conseiller')

      // Then
      expect(actual).to.deep.equal(3)
    })
  })
})

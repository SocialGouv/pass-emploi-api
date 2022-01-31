import {
  RendezVousConseillerQueryModel,
  RendezVousQueryModel
} from '../../../src/application/queries/query-models/rendez-vous.query-models'
import { Jeune } from '../../../src/domain/jeune'
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

describe.only('RendezVousRepositorySql', () => {
  DatabaseForTesting.prepare()
  let rendezVousRepositorySql: RendezVousRepositorySql
  const maintenant = uneDatetime
  let unRendezVousPasse: AsSql<RendezVousDto>
  let unRendezVousTresPasse: AsSql<RendezVousDto>
  let unRendezVousProche: AsSql<RendezVousDto>
  let unRendezVousTresFutur: AsSql<RendezVousDto>
  let jeune: Jeune

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    rendezVousRepositorySql = new RendezVousRepositorySql(dateService)

    // Given
    jeune = unJeune()
    await ConseillerSqlModel.creer(unConseillerDto({ id: jeune.conseiller.id }))
    await JeuneSqlModel.creer(unJeuneDto())

    unRendezVousPasse = unRendezVousDto({
      idJeune: jeune.id,
      date: maintenant.minus({ days: 2 }).toJSDate(),
      titre: 'UN RENDEZ VOUS PASSÉ'
    })
    unRendezVousTresPasse = unRendezVousDto({
      idJeune: jeune.id,
      date: maintenant.minus({ days: 20 }).toJSDate(),
      titre: 'UN RENDEZ VOUS TRES PASSÉ'
    })
    unRendezVousProche = unRendezVousDto({
      idJeune: jeune.id,
      date: maintenant.plus({ days: 2 }).toJSDate(),
      titre: 'UN RENDEZ VOUS PROCHE'
    })
    unRendezVousTresFutur = unRendezVousDto({
      idJeune: jeune.id,
      date: maintenant.plus({ days: 20 }).toJSDate(),
      titre: 'UN RENDEZ TRES FUTUR'
    })

    await RendezVousSqlModel.bulkCreate([
      unRendezVousPasse,
      unRendezVousTresPasse,
      unRendezVousTresFutur,
      unRendezVousProche
    ])
  })

  describe('get', () => {
    describe("quand le rdv n'existe pas", () => {
      it('retourne undefined', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        // When
        const rendezVous = await rendezVousRepositorySql.get(idRdv)
        // Then
        expect(rendezVous).to.equal(undefined)
      })
    })
    describe('quand le rdv existe', () => {
      it('retourne le rendez-vous', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const unRendezVous = unRendezVousDto({
          id: idRdv,
          idJeune: jeune.id
        })
        await RendezVousSqlModel.create(unRendezVous)
        // When
        const rendezVous = await rendezVousRepositorySql.get(idRdv)
        // Then
        expect(rendezVous?.id).to.equal(unRendezVous.id)
        expect(rendezVous?.jeune.id).to.equal(jeune.id)
      })
    })
  })

  describe('getAllAVenir', () => {
    it('retourne le rendez-vous', async () => {
      // When
      const rendezVous = await rendezVousRepositorySql.getAllAVenir()
      // Then
      expect(rendezVous.length).to.equal(2)
      expect(rendezVous[0].id).to.equal(unRendezVousTresFutur.id)
      expect(rendezVous[0].jeune.id).to.equal(jeune.id)
      expect(rendezVous[1].id).to.equal(unRendezVousProche.id)
    })
  })

  describe('getAllQueryModelsByJeune', () => {
    let rendezVous: RendezVousQueryModel[]
    beforeEach(async () => {
      // When
      rendezVous = await rendezVousRepositorySql.getAllQueryModelsByJeune(
        jeune.id
      )
    })
    it('retourne les rendez-vous du jeune', async () => {
      // Then
      expect(rendezVous.length).to.equal(4)
      expect(rendezVous[0].id).to.equal(unRendezVousTresPasse.id)
      expect(rendezVous[1].id).to.equal(unRendezVousPasse.id)
      expect(rendezVous[2].id).to.equal(unRendezVousProche.id)
      expect(rendezVous[3].id).to.equal(unRendezVousTresFutur.id)
    })
  })

  describe('getAllQueryModelsByConseiller', () => {
    let rendezVous: RendezVousConseillerQueryModel

    beforeEach(async () => {
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

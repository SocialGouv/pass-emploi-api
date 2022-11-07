import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { uneDatetime, uneDatetimeMinuit } from '../../fixtures/date.fixture'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { unJeune } from '../../fixtures/jeune.fixture'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'
import { GetAllRendezVousConseillerQueryHandler } from '../../../src/application/queries/get-rendez-vous-conseiller.query.handler.db'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('GetRendezVousConseillerQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let dateService: StubbedClass<DateService>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getAllRendezVousConseillerQueryHandler: GetAllRendezVousConseillerQueryHandler
  let sandbox: SinonSandbox

  const maintenant = uneDatetime()
  const aujourdhuiMinuit = uneDatetimeMinuit()
  let unRendezVousPasse: AsSql<RendezVousDto>
  let unRendezVousTresPasse: AsSql<RendezVousDto>
  let unRendezVousProche: AsSql<RendezVousDto>
  let unRendezVousTresFuturPresenceConseillerFalse: AsSql<RendezVousDto>
  const jeune1 = unJeune({ id: 'jeune-1' })
  const jeune2 = unJeune({ id: 'jeune-2' })

  before(() => {
    sandbox = createSandbox()
    dateService = stubInterface(sandbox)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getAllRendezVousConseillerQueryHandler =
      new GetAllRendezVousConseillerQueryHandler(
        databaseForTesting.sequelize,
        dateService,
        conseillerAuthorizer
      )
  })

  beforeEach(async () => {
    // Given
    await ConseillerSqlModel.creer(unConseillerDto())
    await ConseillerSqlModel.creer(unConseillerDto({ id: '2' }))
    await JeuneSqlModel.creer(unJeuneDto({ id: jeune1.id }))
    await JeuneSqlModel.creer(unJeuneDto({ id: jeune2.id, idConseiller: '2' }))

    unRendezVousPasse = unRendezVousDto({
      date: maintenant.minus({ days: 2 }).toJSDate(),
      titre: 'UN RENDEZ VOUS PASSÉ'
    })
    unRendezVousTresPasse = unRendezVousDto({
      date: maintenant.minus({ days: 20 }).toJSDate(),
      titre: 'UN RENDEZ VOUS TRES PASSÉ'
    })
    unRendezVousProche = unRendezVousDto({
      date: maintenant.plus({ days: 2 }).toJSDate(),
      titre: 'UN RENDEZ VOUS PROCHE'
    })
    unRendezVousTresFuturPresenceConseillerFalse = unRendezVousDto({
      date: maintenant.plus({ days: 20 }).toJSDate(),
      titre: 'UN RENDEZ TRES FUTUR',
      presenceConseiller: false
    })

    await RendezVousSqlModel.bulkCreate([
      unRendezVousPasse,
      unRendezVousTresPasse,
      unRendezVousTresFuturPresenceConseillerFalse,
      unRendezVousProche
    ])
    await RendezVousJeuneAssociationSqlModel.bulkCreate([
      {
        idJeune: jeune1.id,
        idRendezVous: unRendezVousPasse.id
      },
      {
        idJeune: jeune2.id,
        idRendezVous: unRendezVousPasse.id
      },
      {
        idJeune: jeune1.id,
        idRendezVous: unRendezVousTresPasse.id
      },
      {
        idJeune: jeune2.id,
        idRendezVous: unRendezVousTresPasse.id
      },
      {
        idJeune: jeune1.id,
        idRendezVous: unRendezVousTresFuturPresenceConseillerFalse.id
      },
      {
        idJeune: jeune2.id,
        idRendezVous: unRendezVousTresFuturPresenceConseillerFalse.id
      },
      {
        idJeune: jeune1.id,
        idRendezVous: unRendezVousProche.id
      },
      {
        idJeune: jeune2.id,
        idRendezVous: unRendezVousProche.id
      }
    ])
  })

  describe('handle', () => {
    it('retourne les rendez-vous passés du conseiller', async () => {
      //When
      const rendezVous = await getAllRendezVousConseillerQueryHandler.handle({
        idConseiller: jeune1.conseiller.id
      })
      // Then
      expect(rendezVous.passes.length).to.equal(2)
      expect(rendezVous.passes[0].id).to.equal(unRendezVousPasse.id)
      expect(rendezVous.passes[0].jeunes[0].id).to.equal(jeune1.id)
      expect(rendezVous.passes[0].jeunes[1].id).to.equal(jeune2.id)
      expect(rendezVous.passes[1].id).to.equal(unRendezVousTresPasse.id)
      expect(rendezVous.passes[1].jeunes[0].id).to.equal(jeune1.id)
      expect(rendezVous.passes[1].jeunes[1].id).to.equal(jeune2.id)
    })
    it('retourne les rendez-vous à venir du conseiller', async () => {
      //When
      const rendezVous = await getAllRendezVousConseillerQueryHandler.handle({
        idConseiller: jeune1.conseiller.id
      })
      // Then
      expect(rendezVous.futurs.length).to.equal(2)
      expect(rendezVous.futurs[0].id).to.equal(unRendezVousProche.id)
      expect(rendezVous.futurs[1].id).to.equal(
        unRendezVousTresFuturPresenceConseillerFalse.id
      )
    })
    it('retourne les rendez-vous du conseiller avec presence conseiller false', async () => {
      //When
      const rendezVous = await getAllRendezVousConseillerQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        presenceConseiller: false
      })
      // Then
      expect(rendezVous.futurs.length).to.equal(1)
      expect(rendezVous.futurs[0].id).to.equal(
        unRendezVousTresFuturPresenceConseillerFalse.id
      )
    })
    it('retourne les rendez-vous du conseiller avec presence conseiller true', async () => {
      //When
      const rendezVous = await getAllRendezVousConseillerQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        presenceConseiller: true
      })
      // Then
      expect(rendezVous.futurs.length).to.equal(1)
      expect(rendezVous.futurs[0].id).to.equal(unRendezVousProche.id)

      expect(rendezVous.passes.length).to.equal(2)
      expect(rendezVous.passes[0].id).to.equal(unRendezVousPasse.id)
      expect(rendezVous.passes[1].id).to.equal(unRendezVousTresPasse.id)
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller', () => {
      // When
      getAllRendezVousConseillerQueryHandler.authorize(
        {
          idConseiller: 'idConseiller'
        },
        unUtilisateurConseiller()
      )

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller()
      )
    })
  })
})

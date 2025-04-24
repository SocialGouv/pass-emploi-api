import {
  GetRendezVousConseillerPaginesQueryHandler,
  TriRendezVous
} from 'src/application/queries/rendez-vous/get-rendez-vous-conseiller-pagines.query.handler.db'
import { isSuccess } from 'src/building-blocks/types/result'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetRendezVousConseillerPaginesQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getRendezVousConseillerPaginesQueryHandler: GetRendezVousConseillerPaginesQueryHandler

  const maintenant = uneDatetime()
  let unRendezVousPasse: AsSql<RendezVousDto>
  let unRendezVousTresPasse: AsSql<RendezVousDto>
  let unRendezVousFutur: AsSql<RendezVousDto>
  let unRendezVousPasAuConseiller: AsSql<RendezVousDto>
  let unRendezVousTresFuturPresenceConseillerFalse: AsSql<RendezVousDto>
  const jeune1 = unJeune({ id: 'jeune-1' })
  const jeune2 = unJeune({ id: 'jeune-2' })

  before(async () => {
    databaseForTesting = getDatabase()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getRendezVousConseillerPaginesQueryHandler =
      new GetRendezVousConseillerPaginesQueryHandler(
        databaseForTesting.sequelize,
        conseillerAuthorizer
      )
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    // Given
    await ConseillerSqlModel.creer(unConseillerDto())
    await ConseillerSqlModel.creer(unConseillerDto({ id: '2' }))
    await JeuneSqlModel.creer(unJeuneDto({ id: jeune1.id }))
    await JeuneSqlModel.creer(unJeuneDto({ id: jeune2.id, idConseiller: '2' }))

    unRendezVousPasAuConseiller = unRendezVousDto({})
    unRendezVousPasse = unRendezVousDto({
      date: maintenant.minus({ days: 2 }).toJSDate(),
      titre: 'UN RENDEZ VOUS PASSÉ'
    })
    unRendezVousTresPasse = unRendezVousDto({
      date: maintenant.minus({ days: 20 }).toJSDate(),
      titre: 'UN RENDEZ VOUS TRES PASSÉ'
    })
    unRendezVousFutur = unRendezVousDto({
      date: maintenant.plus({ days: 2 }).toJSDate(),
      titre: 'UN RENDEZ VOUS TURFU'
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
      unRendezVousFutur,
      unRendezVousPasAuConseiller
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
        idRendezVous: unRendezVousFutur.id
      },
      {
        idJeune: jeune2.id,
        idRendezVous: unRendezVousFutur.id
      },
      {
        idJeune: jeune2.id,
        idRendezVous: unRendezVousPasAuConseiller.id
      }
    ])
  })

  describe('handle', () => {
    it('retourne tous les rendez-vous du conseiller triés par date croissante par défaut', async () => {
      //When
      const result = await getRendezVousConseillerPaginesQueryHandler.handle({
        idConseiller: jeune1.conseiller.id
      })
      // Then
      expect(result._isSuccess).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.length).to.equal(4)
        expect(result.data[0].date).to.deep.equal(unRendezVousTresPasse.date)
        expect(result.data[1].date).to.deep.equal(unRendezVousPasse.date)
        expect(result.data[2].date).to.deep.equal(unRendezVousFutur.date)
        expect(result.data[3].date).to.deep.equal(
          unRendezVousTresFuturPresenceConseillerFalse.date
        )
      }
    })
    it('retourne les rendez-vous du conseiller avant une dateFin', async () => {
      //When
      const result = await getRendezVousConseillerPaginesQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        dateFin: maintenant.toJSDate()
      })
      // Then
      expect(result._isSuccess).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.length).to.equal(2)
        expect(result.data[0].date).to.deep.equal(unRendezVousTresPasse.date)
        expect(result.data[1].date).to.deep.equal(unRendezVousPasse.date)
      }
    })
    it('retourne les rendez-vous du conseiller après une dateDebut', async () => {
      //When
      const result = await getRendezVousConseillerPaginesQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        dateDebut: maintenant.toJSDate()
      })
      // Then
      expect(result._isSuccess).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.length).to.equal(2)
        expect(result.data[0].date).to.deep.equal(unRendezVousFutur.date)
        expect(result.data[1].date).to.deep.equal(
          unRendezVousTresFuturPresenceConseillerFalse.date
        )
      }
    })
    it('retourne les rendez-vous du conseiller entre dateDebut et dateFin', async () => {
      //When
      const result = await getRendezVousConseillerPaginesQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        dateDebut: maintenant.toJSDate(),
        dateFin: maintenant.plus({ days: 10 }).toJSDate()
      })
      // Then
      expect(result._isSuccess).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.length).to.equal(1)
        expect(result.data[0].date).to.deep.equal(unRendezVousFutur.date)
      }
    })
    it('retourne les rendez-vous du conseiller avec presence conseiller false', async () => {
      //When
      const result = await getRendezVousConseillerPaginesQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        presenceConseiller: false
      })
      // Then
      expect(result._isSuccess).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.length).to.equal(1)
        expect(result.data[0].id).to.deep.equal(
          unRendezVousTresFuturPresenceConseillerFalse.id
        )
      }
    })
    it('retourne les rendez-vous du conseiller avec presence conseiller true et tri decroissant', async () => {
      //When
      const result = await getRendezVousConseillerPaginesQueryHandler.handle({
        idConseiller: jeune1.conseiller.id,
        presenceConseiller: true,
        tri: TriRendezVous.DATE_DECROISSANTE
      })
      // Then
      expect(result._isSuccess).to.be.true()
      if (isSuccess(result)) {
        expect(result.data.length).to.equal(3)
        expect(result.data[0].date).to.deep.equal(unRendezVousFutur.date)
        expect(result.data[1].date).to.deep.equal(unRendezVousPasse.date)
        expect(result.data[2].date).to.deep.equal(unRendezVousTresPasse.date)
      }
    })
  })

  describe('authorize', () => {
    it('autorise un conseiller', () => {
      // When
      getRendezVousConseillerPaginesQueryHandler.authorize(
        {
          idConseiller: 'idConseiller'
        },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller()
      )
    })
  })
})

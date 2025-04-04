import { Core } from 'src/domain/core'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { GetRendezVousJeuneQueryHandler } from '../../../../src/application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('GetRendezVousJeuneQueryHandler', () => {
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getRendezVousQueryHandler: GetRendezVousJeuneQueryHandler

  const utilisateurJeune = unUtilisateurJeune()
  const dateDebut = uneDatetime()
  const dateFin = dateDebut.plus({ days: 7 })
  const unRendezVousAvant = unRendezVousDto({
    date: dateDebut.minus({ days: 2 }).toJSDate()
  })
  const unRendezVousApres = unRendezVousDto({
    date: dateFin.plus({ days: 2 }).toJSDate()
  })
  const unRendezVousPendant = unRendezVousDto({
    date: dateDebut.plus({ days: 2 }).toJSDate()
  })
  const unAutreRendezVousPendant = unRendezVousDto({
    date: dateDebut.plus({ days: 3 }).toJSDate()
  })
  const jeune1 = unJeune({ id: 'jeune-1' })
  const jeune2 = unJeune({ id: 'jeune-2' })

  before(async () => {
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()

    getRendezVousQueryHandler = new GetRendezVousJeuneQueryHandler(
      conseillerAgenceAuthorizer
    )
  })

  describe('handle', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto())
      await JeuneSqlModel.creer(unJeuneDto({ id: jeune1.id }))
      await JeuneSqlModel.creer(unJeuneDto({ id: jeune2.id }))

      await RendezVousSqlModel.bulkCreate([
        unRendezVousAvant,
        unRendezVousApres,
        unAutreRendezVousPendant,
        unRendezVousPendant
      ])
      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousAvant.id
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousPendant.id,
          present: true
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unAutreRendezVousPendant.id,
          present: false
        },
        {
          idJeune: jeune2.id,
          idRendezVous: unAutreRendezVousPendant.id
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousApres.id,
          present: false
        },
        {
          idJeune: jeune2.id,
          idRendezVous: unRendezVousApres.id
        }
      ])
    })

    it('retourne uniquement les rendez-vous du jeune dans la période', async () => {
      // When
      const result = await getRendezVousQueryHandler.handle(
        {
          idJeune: jeune1.id,
          dateDebut: dateDebut.toISO(),
          dateFin: dateFin.toISO()
        },
        utilisateurJeune
      )

      // Then
      expect(result._isSuccess).to.equal(true)

      if (result._isSuccess) {
        expect(result.data.length).to.equal(2)
        expect(result.data[0]).to.deep.include({
          id: unRendezVousPendant.id,
          futPresent: true
        })
        expect(result.data[1]).to.deep.include({
          id: unAutreRendezVousPendant.id,
          futPresent: false
        })
      }
    })
  })

  describe('authorize', () => {
    it('appelle l’authorizer idoine pour un conseiller', async () => {
      // Given
      const conseiller = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      // When
      await getRendezVousQueryHandler.authorize(
        {
          idJeune: jeune1.id,
          dateDebut: dateDebut.toISO(),
          dateFin: dateFin.toISO()
        },
        conseiller
      )

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
      ).to.have.been.calledWithExactly(jeune1.id, conseiller)
    })
  })
})

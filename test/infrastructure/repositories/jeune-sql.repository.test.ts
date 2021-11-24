import { Conseiller } from 'src/domain/conseiller'
import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  listeDetailJeuneQueryModel,
  unResumeActionDUnJeune
} from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('JeuneSqlRepository', () => {
  const databaseForTesting: DatabaseForTesting = DatabaseForTesting.prepare()
  let jeuneSqlRepository: JeuneSqlRepository

  beforeEach(async () => {
    jeuneSqlRepository = new JeuneSqlRepository(databaseForTesting.sequelize)
  })

  describe('get', () => {
    let jeune: Jeune
    beforeEach(async () => {
      // Given
      jeune = unJeune()
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: jeune.conseiller.id })
      )
      await JeuneSqlModel.creer(unJeuneDto({ ...jeune }))
    })
    describe('quand le jeune existe', () => {
      it('retourne le jeune', async () => {
        // When
        const jeune = await jeuneSqlRepository.get('ABCDE')

        // Then
        expect(jeune).to.deep.equal(jeune)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne undefined', async () => {
        // When
        const jeune = await jeuneSqlRepository.get('ZIZOU')

        // Then
        expect(jeune).to.equal(undefined)
      })
    })
  })

  describe('getAllQueryModelsByConseiller', () => {
    it("retourne les jeunes d'un conseiller", async () => {
      const idConseiller: Conseiller.Id = '1'
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller }))

      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      expect(actual).to.deep.equal(listeDetailJeuneQueryModel())
    })

    it("retourne tableau vide quand le conseiller n'existe pas", async () => {
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        'id-inexistant'
      )

      expect(actual).to.deep.equal([])
    })
  })

  describe('.getResumeActionsDesJeunesDuConseiller(idConseiller)', () => {
    it('renvoie les resumés des actions des jeunes du conseiller', async () => {
      // Given
      const idConseiller = '1'
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ id: 'ABCDE', idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ id: 'FGHIJ', idConseiller }))
      await ActionSqlModel.creer(
        uneActionDto({ idJeune: 'ABCDE', statut: Action.Statut.PAS_COMMENCEE })
      )
      await ActionSqlModel.creer(
        uneActionDto({ idJeune: 'ABCDE', statut: Action.Statut.EN_COURS })
      )
      await ActionSqlModel.creer(
        uneActionDto({ idJeune: 'FGHIJ', statut: Action.Statut.TERMINEE })
      )

      // When
      const actual =
        await jeuneSqlRepository.getResumeActionsDesJeunesDuConseiller(
          idConseiller
        )

      // Then
      expect(actual).to.have.deep.members([
        unResumeActionDUnJeune({
          jeuneId: 'ABCDE',
          todoActionsCount: 1,
          inProgressActionsCount: 1,
          doneActionsCount: 0
        }),
        unResumeActionDUnJeune({
          jeuneId: 'FGHIJ',
          todoActionsCount: 0,
          doneActionsCount: 1
        })
      ])
    })
  })
})

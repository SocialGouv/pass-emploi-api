import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { ActionSqlRepository } from '../../../src/infrastructure/repositories/action-sql.repository.db'
import { ConseillerSqlRepository } from '../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository.db'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { uneAction } from '../../fixtures/action.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { expect } from '../../utils'
import { IdService } from 'src/utils/id-service'
import { DateService } from 'src/utils/date-service'
import { useDatabase } from '../../utils/database-for-testing'

describe('ActionSqlRepository', () => {
  const databaseForTesting = useDatabase()
  let jeune: Jeune
  let actionSqlRepository: ActionSqlRepository
  let idService: IdService
  let dateService: DateService

  beforeEach(async () => {
    jeune = unJeune()

    actionSqlRepository = new ActionSqlRepository()
    const conseillerRepository = new ConseillerSqlRepository()
    await conseillerRepository.save(unConseiller())
    const jeuneRepository = new JeuneSqlRepository(
      databaseForTesting.sequelize,
      idService,
      dateService
    )
    await jeuneRepository.save(jeune)
  })

  describe('.save(action)', () => {
    it("modifie l'action existante", async () => {
      // Given
      const idAction = '9a3aacad-5161-4b83-b16f-ef8108902202'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actionModifiee = uneAction({
        id: idAction,
        statut: Action.Statut.TERMINEE,
        idJeune: jeune.id
      })
      await actionSqlRepository.save(actionModifiee)

      // Then
      const actual = await ActionSqlModel.findByPk(idAction)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(ActionSqlRepository.actionFromSqlModel(actual!)).to.deep.equal(
        actionModifiee
      )
    })

    describe("Quand l'action n'existe pas", () => {
      it("crée et sauvegarde l'action", async () => {
        // Given
        const idAction = '646d8992-91a5-498c-922b-ffaaf09b73f8'
        const nouvelleAction = uneAction({
          id: idAction,
          statut: Action.Statut.TERMINEE,
          idJeune: jeune.id
        })

        // When
        await actionSqlRepository.save(nouvelleAction)

        // Then

        const actual = await ActionSqlModel.findByPk(idAction)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(ActionSqlRepository.actionFromSqlModel(actual!)).to.deep.equal(
          nouvelleAction
        )
      })
    })
  })

  describe('.get(id)', () => {
    it("récupère l'action", async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actual = await actionSqlRepository.get(idAction)

      // Then
      expect(actual).to.deep.equal(
        ActionSqlRepository.actionFromSqlModel(actionDto)
      )
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })

  describe('.getConseillerEtJeune(id)', () => {
    it('récupère les id des conseillers et jeunes', async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actual = await actionSqlRepository.getConseillerEtJeune(idAction)

      // Then
      expect(actual).to.deep.equal({
        idConseiller: jeune.conseiller?.id,
        idJeune: jeune.id
      })
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })

  describe('.delete(id)', () => {
    it("supprime l'action", async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      // When
      await actionSqlRepository.delete(idAction)

      // Then
      const actual = await ActionSqlModel.findByPk(idAction)
      expect(actual).to.be.equal(null)
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })
})

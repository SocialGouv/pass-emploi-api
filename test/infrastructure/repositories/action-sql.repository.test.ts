import { DateTime } from 'luxon'
import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { ActionSqlRepository } from '../../../src/infrastructure/repositories/action-sql.repository'
import { ConseillerSqlEmailRepository } from '../../../src/infrastructure/repositories/conseiller-sql-email-repository.service'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { uneAction } from '../../fixtures/action.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  uneActionQueryModelFromDomain,
  uneActionQueryModelWithJeuneFromDomain
} from '../../fixtures/query-models/action.query-model.fixtures'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { expect, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils'
import { MailSendinblueClient } from '../../../src/infrastructure/repositories/mail-sendinblue.client'

describe('ActionSqlRepository', () => {
  let jeune: Jeune
  let actionSqlRepository: ActionSqlRepository
  const databaseForTesting = DatabaseForTesting.prepare()

  beforeEach(async () => {
    jeune = unJeune()

    actionSqlRepository = new ActionSqlRepository()
    const mailSendinblueClient: MailSendinblueClient =
      stubClass(MailSendinblueClient)
    const conseillerRepository = new ConseillerSqlEmailRepository(
      mailSendinblueClient
    )
    await conseillerRepository.save(unConseiller())
    const jeuneRepository = new JeuneSqlRepository(databaseForTesting.sequelize)
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
        idConseiller: jeune.conseiller.id,
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

  describe('.getQueryModelById(id)', () => {
    let action: Action
    beforeEach(async () => {
      action = uneAction({ idJeune: jeune.id })
      await actionSqlRepository.save(action)
    })

    describe("quand l'action existe", () => {
      it('retourne le query model', async () => {
        // When
        const actionQueryModel = await actionSqlRepository.getQueryModelById(
          action.id
        )

        // Then
        expect(actionQueryModel).to.deep.equal(
          uneActionQueryModelWithJeuneFromDomain(action, jeune)
        )
      })
    })

    describe("quand l'action n'existe pas", () => {
      it('renvoie une erreur', async () => {
        // When
        const result = await actionSqlRepository.getQueryModelById(
          'b11e5d7b-a046-4e2a-9f78-ac54411593e9'
        )

        // Then
        expect(result).to.equal(undefined)
      })
    })
  })

  describe('.getQueryModelByJeuneId(id)', () => {
    describe("quand aucune action n'existe", () => {
      it('retourne un tableau vide', async () => {
        // When
        const actionsQueryModel =
          await actionSqlRepository.getQueryModelByJeuneId(jeune.id)

        // Then
        expect(actionsQueryModel).to.deep.equal([])
      })
    })
    describe('quand il existe uniquement des actions terminées', () => {
      it('renvoie les actions triées par la plus récente', async () => {
        // Given
        const actionTerminee1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-12T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee3 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-10T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionTerminee1)
        await actionSqlRepository.save(actionTerminee2)
        await actionSqlRepository.save(actionTerminee3)

        // When
        const actionsQueryModel =
          await actionSqlRepository.getQueryModelByJeuneId(jeune.id)

        // Then
        expect(actionsQueryModel).to.deep.equal([
          uneActionQueryModelFromDomain(actionTerminee2),
          uneActionQueryModelFromDomain(actionTerminee3),
          uneActionQueryModelFromDomain(actionTerminee1)
        ])
      })
    })
    describe('quand il existe des actions avec des statuts differents', () => {
      it('renvoie les actions triées par la plus récente', async () => {
        // Given
        const actionPasCommencee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.PAS_COMMENCEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-10T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionEnCours1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionEnCours2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-12T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionPasCommencee)
        await actionSqlRepository.save(actionEnCours1)
        await actionSqlRepository.save(actionEnCours2)

        // When
        const actionsQueryModel =
          await actionSqlRepository.getQueryModelByJeuneId(jeune.id)

        // Then
        expect(actionsQueryModel).to.deep.equal([
          uneActionQueryModelFromDomain(actionEnCours2),
          uneActionQueryModelFromDomain(actionPasCommencee),
          uneActionQueryModelFromDomain(actionEnCours1)
        ])
      })
    })
    describe('quand il existe uniquement des actions pas commencées et en cours', () => {
      it('renvoie les actions triées par la plus récente avec le statut terminé en dernier', async () => {
        // Given
        const actionPasCommencee = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120001',
          idJeune: jeune.id,
          statut: Action.Statut.PAS_COMMENCEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-05T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionEnCours = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120002',
          idJeune: jeune.id,
          statut: Action.Statut.EN_COURS,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-06T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee1 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120003',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-07T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        const actionTerminee2 = uneAction({
          id: '02b3710e-7779-11ec-90d6-0242ac120004',
          idJeune: jeune.id,
          statut: Action.Statut.TERMINEE,
          dateDerniereActualisation: DateTime.fromISO(
            '2020-04-08T12:00:00.000Z'
          )
            .toUTC()
            .toJSDate()
        })
        await actionSqlRepository.save(actionPasCommencee)
        await actionSqlRepository.save(actionEnCours)
        await actionSqlRepository.save(actionTerminee1)
        await actionSqlRepository.save(actionTerminee2)

        // When
        const actionsQueryModel =
          await actionSqlRepository.getQueryModelByJeuneId(jeune.id)

        // Then
        expect(actionsQueryModel).to.deep.equal([
          uneActionQueryModelFromDomain(actionEnCours),
          uneActionQueryModelFromDomain(actionPasCommencee),
          uneActionQueryModelFromDomain(actionTerminee2),
          uneActionQueryModelFromDomain(actionTerminee1)
        ])
      })
    })
  })
})

import { Authentification } from 'src/domain/authentification'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { Action } from '../../../src/domain/action'
import { Jeune } from '../../../src/domain/jeune'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  uneDatetime,
  uneDatetimeMoinsRecente
} from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import {
  unDetailJeuneQueryModel,
  unResumeActionDUnJeune
} from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe.only('JeuneSqlRepository', () => {
  const databaseForTesting: DatabaseForTesting = DatabaseForTesting.prepare()
  let jeuneSqlRepository: JeuneSqlRepository

  beforeEach(async () => {
    jeuneSqlRepository = new JeuneSqlRepository(databaseForTesting.sequelize)
  })

  describe('get', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = { ...unJeune(), tokenLastUpdate: uneDatetime }
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: jeune.conseiller.id,
          prenom: jeune.conseiller.firstName,
          nom: jeune.conseiller.lastName
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate()
        })
      )
    })
    describe('quand le jeune existe', () => {
      it('retourne le jeune', async () => {
        // When
        const result = await jeuneSqlRepository.get('ABCDE')

        // Then
        expect(result).to.deep.equal(jeune)
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

  describe('getByEmail', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = { ...unJeune(), tokenLastUpdate: uneDatetime }
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: jeune.conseiller.id,
          prenom: jeune.conseiller.firstName,
          nom: jeune.conseiller.lastName
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate()
        })
      )
    })

    describe('quand un jeune existe avec cet email', () => {
      it('retourne le jeune', async () => {
        // When
        const result = await jeuneSqlRepository.getByEmail('john.doe@plop.io')

        // Then
        expect(result).to.deep.equal(jeune)
      })
    })

    describe("quand aucun jeune n'existe avec cet email", () => {
      it('retourne undefined', async () => {
        // When
        const jeune = await jeuneSqlRepository.getByEmail('noreply@plop.io')

        // Then
        expect(jeune).to.equal(undefined)
      })
    })
  })

  describe('getAllQueryModelsByConseiller', () => {
    it("retourne les jeunes d'un conseiller", async () => {
      const idConseiller = '1'
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller }))

      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      expect(actual).to.deep.equal([unDetailJeuneQueryModel()])
    })
    it("retourne les jeunes d'un conseiller avec la date d'evenement d'engagement", async () => {
      const idConseiller = '1'
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenement = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement
      })

      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneQueryModel(),
          lastActivity: dateEvenement.toISOString()
        }
      ])
    })
    it("retourne les jeunes d'un conseiller avec la date du DERNIER evenement d'engagement", async () => {
      const idConseiller = '1'
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenementRecent = uneDatetime.toJSDate()
      const dateEvenementAncien = uneDatetimeMoinsRecente.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement: dateEvenementAncien
      })
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement: dateEvenementRecent
      })

      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneQueryModel(),
          lastActivity: dateEvenementRecent.toISOString()
        }
      ])
    })
    it("retourne les jeunes d'un conseiller sans la date d'evenement d'engagement", async () => {
      const idConseiller = '1'
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenement = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: 'faux-id',
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement
      })

      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      expect(actual).to.deep.equal([unDetailJeuneQueryModel()])
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
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'FGHIJ',
          idConseiller
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'ABCDE',
          statut: Action.Statut.PAS_COMMENCEE
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'ABCDE',
          statut: Action.Statut.EN_COURS
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'FGHIJ',
          statut: Action.Statut.TERMINEE
        })
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

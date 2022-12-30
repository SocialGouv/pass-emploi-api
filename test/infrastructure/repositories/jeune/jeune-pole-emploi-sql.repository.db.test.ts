import { Core } from '../../../../src/domain/core'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect } from '../../../utils'
import { JeunePoleEmploiSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-pole-emploi-sql.repository.db'
import { getDatabase } from '../../../utils/database-for-testing'

describe('JeunePoleEmploiSqlRepository', () => {
  let jeunePoleEmploiSqlRepository: JeunePoleEmploiSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()
    jeunePoleEmploiSqlRepository = new JeunePoleEmploiSqlRepository()
  })

  describe('findAll', () => {
    const conseillerDto = unConseillerDto({
      structure: Core.Structure.POLE_EMPLOI
    })
    const idJeunePE1 = 'ABCDE'
    const idJeunePE2 = 'FGHIJ'
    const idJeunePE3 = 'KLMNO'
    const jeuneDto1 = unJeuneDto({
      id: idJeunePE1,
      idConseiller: conseillerDto.id,
      structure: Core.Structure.POLE_EMPLOI
    })
    const jeuneDto2 = unJeuneDto({
      id: idJeunePE2,
      idConseiller: conseillerDto.id,
      structure: Core.Structure.POLE_EMPLOI
    })
    const jeuneDto3 = unJeuneDto({
      id: idJeunePE3,
      idConseiller: conseillerDto.id,
      structure: Core.Structure.POLE_EMPLOI
    })
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(jeuneDto1)
      await JeuneSqlModel.creer(jeuneDto2)
      await JeuneSqlModel.creer(jeuneDto3)
    })
    it('retourne les jeunes pole emploi', async () => {
      // When
      const jeunesPoleEmploiObtenus =
        await jeunePoleEmploiSqlRepository.findAll(0, 1)

      // Then
      const jeunePoleEmploi1: Jeune.PoleEmploi = {
        id: jeuneDto1.id,
        pushNotificationToken: jeuneDto1.pushNotificationToken!,
        idAuthentification: jeuneDto1.idAuthentification!
      }
      expect(jeunesPoleEmploiObtenus).to.deep.equal([jeunePoleEmploi1])
    })
    it('retourne les jeunes de la page demandée', async () => {
      // When
      const jeunesPoleEmploiObtenus =
        await jeunePoleEmploiSqlRepository.findAll(2, 2)

      // Then
      expect(jeunesPoleEmploiObtenus.map(jeune => jeune.id)).to.deep.equal([
        idJeunePE3
      ])
    })
  })
})

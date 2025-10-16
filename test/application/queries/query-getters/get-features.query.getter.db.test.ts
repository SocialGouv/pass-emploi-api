import { getDatabase } from '../../../utils/database-for-testing'
import { GetFeaturesQueryGetter } from '../../../../src/application/queries/query-getters/get-features.query.getter.db'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import {
  FeatureFlipSqlModel,
  FeatureFlipTag
} from '../../../../src/infrastructure/sequelize/models/feature-flip.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { expect } from '../../../utils'

describe('GetFeaturesQueryGetter', () => {
  let getFeaturesQueryGetter: GetFeaturesQueryGetter

  before(async () => {
    await getDatabase().cleanPG()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    getFeaturesQueryGetter = new GetFeaturesQueryGetter()

    const conseillerDto = unConseillerDto({ id: 'id-conseiller' })
    const jeuneDtoJ1 = unJeuneDto({
      id: 'j1',
      idConseiller: 'id-conseiller'
    })
    const jeuneDtoJ2 = unJeuneDto({
      id: 'j2',
      idConseiller: 'id-conseiller'
    })
    await ConseillerSqlModel.creer(conseillerDto)
    await JeuneSqlModel.bulkCreate([jeuneDtoJ1, jeuneDtoJ2])

    const j1Migration: AsSql<FeatureFlipSqlModel> = {
      id: 0,
      featureTag: FeatureFlipTag.MIGRATION,
      idJeune: 'j1'
    }
    const j2demarchesIA: AsSql<FeatureFlipSqlModel> = {
      id: 1,
      featureTag: FeatureFlipTag.DEMARCHES_IA,
      idJeune: 'j2'
    }
    await FeatureFlipSqlModel.bulkCreate([j1Migration, j2demarchesIA])
  })

  describe('handle', () => {
    it("renvoie true si l'id jeune existe pour cette feature", async () => {
      // When
      const featureExiste = await getFeaturesQueryGetter.handle({
        idJeune: 'j1',
        featureTag: FeatureFlipTag.MIGRATION
      })

      // Then
      expect(featureExiste).to.be.true()
    })
    it("renvoie false si l'id jeune existe mais pour une autre feature", async () => {
      // When
      const featureExiste = await getFeaturesQueryGetter.handle({
        idJeune: 'j2',
        featureTag: FeatureFlipTag.MIGRATION
      })

      // Then
      expect(featureExiste).to.be.false()
    })
    it("renvoie false si l'id jeune n'existe pas", async () => {
      // When
      const featureExiste = await getFeaturesQueryGetter.handle({
        idJeune: 'id-inexistant',
        featureTag: FeatureFlipTag.MIGRATION
      })

      // Then
      expect(featureExiste).to.be.false()
    })
  })
})

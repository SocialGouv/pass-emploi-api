import { DateTime } from 'luxon'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import { GetMonSuiviPoleEmploiQueryHandler } from '../../../../src/application/queries/milo/get-mon-suivi-jeune.pole-emploi.query.handler.db'
import { GetDemarchesQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-demarches.query.getter'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import { MonSuiviPoleEmploiQueryModel } from '../../../../src/application/queries/query-models/jeunes.pole-emploi.query-model'
import { NonTrouveError } from '../../../../src/building-blocks/types/domain-error'
import { Cached } from '../../../../src/building-blocks/types/query'
import {
  emptySuccess,
  failure,
  isSuccess,
  Result,
  success
} from '../../../../src/building-blocks/types/result'
import { Core } from '../../../../src/domain/core'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { uneDemarcheQueryModel } from '../../../fixtures/query-models/demarche.query-model.fixtures'
import { unRendezVousQueryModel } from '../../../fixtures/query-models/rendez-vous.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { FeatureFlipTag } from '../../../../src/infrastructure/sequelize/models/feature-flip.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../../utils/database-for-testing'
import { GetFeaturesQueryGetter } from '../../../../src/application/queries/query-getters/get-features.query.getter.db'
import Structure = Core.Structure

describe('GetMonSuiviPoleEmploiQueryHandler', () => {
  let getRendezVousJeuneQueryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let getDemarchesQueryGetter: StubbedClass<GetDemarchesQueryGetter>
  let getFeaturesQueryGetter: StubbedClass<GetFeaturesQueryGetter>
  let handler: GetMonSuiviPoleEmploiQueryHandler
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  const utilisateurJeunePE = unUtilisateurJeune({
    structure: Structure.POLE_EMPLOI
  })
  const dateDebut = DateTime.fromISO('2024-01-14T12:00:00Z', {
    setZone: true
  })

  beforeEach(async () => {
    getRendezVousJeuneQueryGetter = stubClass(
      GetRendezVousJeunePoleEmploiQueryGetter
    )
    getDemarchesQueryGetter = stubClass(GetDemarchesQueryGetter)
    getFeaturesQueryGetter = stubClass(GetFeaturesQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    handler = new GetMonSuiviPoleEmploiQueryHandler(
      jeuneAuthorizer,
      getRendezVousJeuneQueryGetter,
      getDemarchesQueryGetter,
      getFeaturesQueryGetter
    )
  })

  describe('handle', () => {
    const rdv = unRendezVousQueryModel({
      date: dateDebut.plus({ hour: 1 }).toJSDate()
    })
    const demarche = uneDemarcheQueryModel()

    let result: Result<Cached<MonSuiviPoleEmploiQueryModel>>
    beforeEach(async () => {
      await getDatabase().cleanPG()
      getRendezVousJeuneQueryGetter.handle.resolves(
        success({
          queryModel: [rdv]
        })
      )
      getDemarchesQueryGetter.handle.resolves(
        success({
          queryModel: [demarche]
        })
      )
      getFeaturesQueryGetter.handle
        .withArgs({
          idJeune: 'id-jeune',
          featureTag: FeatureFlipTag.DEMARCHES_IA
        })
        .resolves(false)

      result = await handler.handle({
        idJeune: 'id-jeune',
        dateDebut,
        accessToken: 'accessToken'
      })
    })

    it('renvoie les rendez-vous', async () => {
      // Then
      expect(
        getRendezVousJeuneQueryGetter.handle
      ).to.have.been.calledOnceWithExactly({
        idJeune: 'id-jeune',
        dateDebut,
        accessToken: 'accessToken'
      })
      expect(
        isSuccess(result) && result.data.queryModel.rendezVous
      ).to.deep.equal([rdv])
      expect(
        isSuccess(result) && result.data.queryModel.eligibleDemarchesIA
      ).to.be.false()
    })

    it('renvoie les démarches', async () => {
      expect(getDemarchesQueryGetter.handle).to.have.been.calledOnceWithExactly(
        {
          idJeune: 'id-jeune',
          tri: GetDemarchesQueryGetter.Tri.parDateFin,
          dateDebut,
          accessToken: 'accessToken'
        }
      )
      expect(
        isSuccess(result) && result.data.queryModel.demarches
      ).to.deep.equal([demarche])
    })

    it('renvoie dateCache quand les démarches sont KO', async () => {
      await JeuneSqlModel.create(
        unJeuneDto({ id: 'id-jeune', idConseiller: undefined })
      )
      getFeaturesQueryGetter.handle
        .withArgs({
          idJeune: 'id-jeune',
          featureTag: FeatureFlipTag.DEMARCHES_IA
        })
        .resolves(true)
      getDemarchesQueryGetter.handle.resolves(
        failure(new NonTrouveError('Démarches KO'))
      )

      result = await handler.handle({
        idJeune: 'id-jeune',
        dateDebut,
        accessToken: 'accessToken'
      })
      expect(isSuccess(result) && result.data.dateDuCache).not.to.be.undefined()
      expect(
        isSuccess(result) && result.data.queryModel.rendezVous
      ).to.deep.equal([rdv])
      expect(
        isSuccess(result) && result.data.queryModel.demarches
      ).to.deep.equal([])
      expect(
        isSuccess(result) && result.data.queryModel.eligibleDemarchesIA
      ).to.be.true()
    })
  })

  describe('authorize', () => {
    it('appelle l’authorizer idoine', async () => {
      // Given
      jeuneAuthorizer.autoriserLeJeune.resolves(emptySuccess())

      // When
      const result = await handler.authorize(
        {
          idJeune: 'id-jeune',
          dateDebut,
          accessToken: 'token'
        },
        utilisateurJeunePE
      )

      // Then
      expect(
        jeuneAuthorizer.autoriserLeJeune
      ).to.have.been.calledOnceWithExactly('id-jeune', utilisateurJeunePE, true)
      expect(result).to.deep.equal(emptySuccess())
    })
  })
})

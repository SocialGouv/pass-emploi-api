import {
  AnimationCollectiveResumeQueryModel,
  GetAnimationCollectiveV2QueryModel
} from 'src/application/queries/query-models/rendez-vous.query-model'
import { Core } from 'src/domain/core'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'
import { GetAnimationsCollectivesV2QueryHandler } from '../../../../src/application/queries/rendez-vous/get-animations-collectives-v2.query.handler.db'
import { CodeTypeRendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import {
  AgenceDto,
  AgenceSqlModel
} from '../../../../src/infrastructure/sequelize/models/agence.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../../src/utils/date-service'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { uneDate, uneDatetime } from '../../../fixtures/date.fixture'
import { uneAgenceDto } from '../../../fixtures/sql-models/agence.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetAnimationsCollectivesACloreQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let queryHandler: GetAnimationsCollectivesV2QueryHandler
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let dateService: StubbedClass<DateService>

  const datetimeDeBase = uneDatetime()

  let agence1Dto: AsSql<AgenceDto>
  let agence2Dto: AsSql<AgenceDto>
  let evenementCollectifAClore1Dto: AsSql<RendezVousDto>
  let evenementCollectifAClore2Dto: AsSql<RendezVousDto>
  let evenementCollectifAClore3Dto: AsSql<RendezVousDto>
  let evenementIndividuel1Dto: AsSql<RendezVousDto>
  let evenementCollectifANePasClore1Dto: AsSql<RendezVousDto>
  let evenementCollectifANePasClore3Dto: AsSql<RendezVousDto>

  before(() => {
    dateService = stubClass(DateService)
    dateService.nowJs.returns(datetimeDeBase.toJSDate())
    databaseForTesting = getDatabase()
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    queryHandler = new GetAnimationsCollectivesV2QueryHandler(
      conseillerAgenceAuthorizer,
      dateService
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller sur son établissement', () => {
      // When
      queryHandler.authorize(
        { idEtablissement: 'paris' },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerPourUneAgence
      ).to.have.been.calledWithExactly('paris', unUtilisateurConseiller())
    })
  })

  describe('handle', () => {
    before(async () => {
      await databaseForTesting.cleanPG()

      agence1Dto = uneAgenceDto({
        id: '1',
        nomAgence: 'Paris',
        nomRegion: 'Île-de-France',
        codeDepartement: '75',
        structure: Core.Structure.MILO
      })

      agence2Dto = uneAgenceDto({
        id: '2',
        nomAgence: 'Paris',
        nomRegion: 'Île-de-France',
        codeDepartement: '75',
        structure: Core.Structure.MILO
      })

      evenementCollectifAClore1Dto = unRendezVousDto({
        id: '196e32b5-4d66-46cb-8485-77c92bd00553',
        titre: 'Rendez-vous collectif établissement 1',
        date: datetimeDeBase.minus({ days: 2 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        dateCloture: null,
        idAgence: '1'
      })

      evenementCollectifAClore2Dto = unRendezVousDto({
        id: '296e32b5-4d66-46cb-8485-77c92bd00554',
        titre: 'Rendez-vous collectif établissement 1',
        date: datetimeDeBase.minus({ days: 1 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        dateCloture: null,
        idAgence: '1'
      })

      evenementIndividuel1Dto = unRendezVousDto({
        id: '896e32b5-4d66-46cb-8485-77c92bd00552',
        titre: 'Rendez-vous individuel',
        date: datetimeDeBase.minus({ days: 1 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        dateCloture: null
      })

      evenementCollectifANePasClore1Dto = unRendezVousDto({
        id: '596e32b5-4d66-46cb-8482-77c92bd00754',
        titre: 'Rendez-vous collectif établissement 1 à ne pas clore',
        date: datetimeDeBase.plus({ days: 3 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        dateCloture: null,
        idAgence: '1'
      })

      evenementCollectifANePasClore3Dto = unRendezVousDto({
        id: '996e32b5-4d66-26cb-8482-76c92bd00754',
        titre: 'Rendez-vous collectif établissement 1 à ne pas clore',
        date: datetimeDeBase.plus({ days: 4 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        dateCloture: uneDate(),
        idAgence: '1'
      })

      evenementCollectifAClore3Dto = unRendezVousDto({
        id: '396e32b5-4d66-46cb-8485-77c92bd00559',
        titre: 'Rendez-vous collectif établissement 2',
        date: datetimeDeBase.minus({ days: 1 }).toJSDate(),
        type: CodeTypeRendezVous.ATELIER,
        dateCloture: null,
        idAgence: '2'
      })

      await AgenceSqlModel.bulkCreate([agence1Dto, agence2Dto])
      await RendezVousSqlModel.bulkCreate([
        evenementCollectifAClore1Dto,
        evenementCollectifAClore2Dto,
        evenementCollectifAClore3Dto,
        evenementCollectifANePasClore1Dto,
        evenementCollectifANePasClore3Dto,
        evenementIndividuel1Dto
      ])
    })

    describe('handle', () => {
      it('retourne uniquement les évènements à clore du bon établissement sans paramètres', async () => {
        // Given
        const query = { idEtablissement: agence1Dto.id, aClore: true }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetAnimationCollectiveV2QueryModel = {
          pagination: {
            page: 1,
            limit: 10,
            total: 2
          },
          resultats: [
            mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore1Dto),
            mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore2Dto)
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })

      it('retourne uniquement les évènements à clore du bon établissement avec les paramètres page et limite', async () => {
        // Given
        const query = {
          idEtablissement: agence1Dto.id,
          aClore: true,
          page: 1,
          limit: 1
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetAnimationCollectiveV2QueryModel = {
          pagination: {
            page: 1,
            limit: 1,
            total: 2
          },
          resultats: [
            mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore1Dto)
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })

      it('retourne uniquement les évènements à clore du bon établissement de la deuxième page avec les paramètres page et limite', async () => {
        // Given
        const query = {
          idEtablissement: agence1Dto.id,
          aClore: true,
          page: 2,
          limit: 1
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetAnimationCollectiveV2QueryModel = {
          pagination: {
            page: 2,
            limit: 1,
            total: 2
          },
          resultats: [
            mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore2Dto)
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })

      it("retourne toutes les animations collectives d'un établissement", async () => {
        // Given
        const query = {
          idEtablissement: agence1Dto.id
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetAnimationCollectiveV2QueryModel = {
          pagination: {
            page: 1,
            limit: 10,
            total: 4
          },
          resultats: [
            mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore1Dto),
            mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore2Dto),
            mapRdvSqlToACACloreResumeQueryModel(
              evenementCollectifANePasClore1Dto
            ),
            mapRdvSqlToACACloreResumeQueryModel(
              evenementCollectifANePasClore3Dto
            )
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
    })
  })
})

function mapRdvSqlToACACloreResumeQueryModel(
  rdvSql: AsSql<RendezVousDto>
): AnimationCollectiveResumeQueryModel {
  return {
    id: rdvSql.id,
    titre: rdvSql.titre,
    date: rdvSql.date.toISOString(),
    nombreInscrits: 0
  }
}

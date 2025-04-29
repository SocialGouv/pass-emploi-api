import {
  GetRendezVousACloreQueryModel,
  RdvResumeQueryModel
} from 'src/application/queries/query-models/rendez-vous.query-model'
import { Core } from 'src/domain/core'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'
import { GetRendezVousACloreQueryHandler } from '../../../../src/application/queries/rendez-vous/get-rendez-vous-a-clore.query.handler.db'
import { CodeTypeRendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import {
  AgenceDto,
  AgenceSqlModel
} from '../../../../src/infrastructure/sequelize/models/agence.sql-model'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../../src/utils/date-service'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { uneDate, uneDatetime } from '../../../fixtures/date.fixture'
import { uneAgenceDto } from '../../../fixtures/sql-models/agence.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import { uneStructureMiloDto } from '../../../fixtures/sql-models/structureMilo.sql-model'
import {
  StructureMiloDto,
  StructureMiloSqlModel
} from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'

describe('GetRendezVousACloreQueryHandler', () => {
  let queryHandler: GetRendezVousACloreQueryHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  let database: DatabaseForTesting

  const datetimeDeBase = uneDatetime()

  let structureMiloDto: AsSql<StructureMiloDto>
  let agence1Dto: AsSql<AgenceDto>
  let agence2Dto: AsSql<AgenceDto>
  let evenementCollectifAClore1Dto: AsSql<RendezVousDto>
  let evenementCollectifAClore2Dto: AsSql<RendezVousDto>
  let evenementCollectifAClore3Dto: AsSql<RendezVousDto>
  let evenementIndividuelACloreDto: AsSql<RendezVousDto>
  let evenementIndividuelClosDto: AsSql<RendezVousDto>
  let evenementCollectifANePasClore1Dto: AsSql<RendezVousDto>
  let evenementCollectifANePasClore3Dto: AsSql<RendezVousDto>
  let conseillerDto: AsSql<ConseillerDto>
  let jeuneDuConseillerDto: AsSql<JeuneDto>

  before(() => {
    database = getDatabase()
    dateService = stubClass(DateService)
    dateService.nowJs.returns(datetimeDeBase.toJSDate())
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    queryHandler = new GetRendezVousACloreQueryHandler(
      conseillerAuthorizer,
      dateService,
      database.sequelize
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller', () => {
      // When
      queryHandler.authorize(
        { idConseiller: 'paris' },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly('paris', unUtilisateurConseiller())
    })
  })

  describe('handle', () => {
    before(async () => {
      await database.cleanPG()
      agence1Dto = uneAgenceDto({
        id: '1',
        nomAgence: 'Paris',
        nomRegion: 'Île-de-France',
        codeDepartement: '75',
        structure: Core.Structure.MILO
      })

      structureMiloDto = uneStructureMiloDto({
        id: '1'
      })

      agence2Dto = uneAgenceDto({
        id: '2',
        nomAgence: 'Paris',
        nomRegion: 'Île-de-France',
        codeDepartement: '75',
        structure: Core.Structure.MILO
      })

      conseillerDto = unConseillerDto({
        idStructureMilo: structureMiloDto.id,
        idAgence: agence1Dto.id
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

      evenementIndividuelACloreDto = unRendezVousDto({
        id: '896e32b5-4d66-46cb-8485-77c92bd00552',
        titre: 'Rendez-vous individuel',
        date: datetimeDeBase.minus({ hours: 1 }).toJSDate(),
        type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
        dateCloture: null
      })

      evenementIndividuelClosDto = unRendezVousDto({
        id: '896e32b5-4d66-46cb-8485-77c92bd00553',
        titre: 'Rendez-vous individuel',
        date: datetimeDeBase.minus({ hours: 2 }).toJSDate(),
        type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
        dateCloture: uneDate()
      })

      jeuneDuConseillerDto = unJeuneDto({ idConseiller: conseillerDto.id })

      await StructureMiloSqlModel.create(structureMiloDto)
      await AgenceSqlModel.bulkCreate([agence1Dto, agence2Dto])
      await ConseillerSqlModel.create(conseillerDto)
      await JeuneSqlModel.create(jeuneDuConseillerDto)
      await RendezVousSqlModel.bulkCreate([
        evenementCollectifAClore1Dto,
        evenementCollectifAClore2Dto,
        evenementCollectifAClore3Dto,
        evenementCollectifANePasClore1Dto,
        evenementCollectifANePasClore3Dto,
        evenementIndividuelACloreDto,
        evenementIndividuelClosDto
      ])
      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        {
          idJeune: jeuneDuConseillerDto.id,
          idRendezVous: evenementIndividuelACloreDto.id
        },
        {
          idJeune: jeuneDuConseillerDto.id,
          idRendezVous: evenementIndividuelClosDto.id
        }
      ])
    })

    it('retourne acs structure conseiller + rdvs indiv', async () => {
      // Given
      const query = { idConseiller: conseillerDto.id }

      // When
      const result = await queryHandler.handle(query)

      // Then
      const queryModelAttendu: GetRendezVousACloreQueryModel = {
        pagination: {
          page: 1,
          limit: 10,
          total: 3
        },
        resultats: [
          mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore1Dto),
          mapRdvSqlToACACloreResumeQueryModel(evenementCollectifAClore2Dto),
          mapRdvSqlToACACloreResumeQueryModel(evenementIndividuelACloreDto)
        ]
      }
      expect(result._isSuccess && result.data).to.deep.equal(queryModelAttendu)
    })
    it('retourne rdvs', async () => {
      // Given
      await ConseillerSqlModel.update(
        { idStructureMilo: null, idAgence: null },
        { where: { id: conseillerDto.id } }
      )
      const query = { idConseiller: conseillerDto.id }

      // When
      const result = await queryHandler.handle(query)

      // Then
      const queryModelAttendu: GetRendezVousACloreQueryModel = {
        pagination: {
          page: 1,
          limit: 10,
          total: 1
        },
        resultats: [
          mapRdvSqlToACACloreResumeQueryModel(evenementIndividuelACloreDto)
        ]
      }
      expect(result._isSuccess && result.data).to.deep.equal(queryModelAttendu)
    })
  })
})

function mapRdvSqlToACACloreResumeQueryModel(
  rdvSql: AsSql<RendezVousDto>
): RdvResumeQueryModel {
  return {
    id: rdvSql.id,
    titre: rdvSql.titre,
    date: rdvSql.date.toISOString(),
    nombreInscrits:
      rdvSql.type === CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
        ? 1
        : 0,
    type: rdvSql.type
  }
}

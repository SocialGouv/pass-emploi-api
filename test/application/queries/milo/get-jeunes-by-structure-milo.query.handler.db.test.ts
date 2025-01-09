import { ConseillerInterStructureMiloAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-structure-milo-authorizer'
import {
  GetJeunesByStructureMiloQueryHandler,
  GetJeunesByStructureMiloQueryModel
} from '../../../../src/application/queries/milo/get-jeunes-by-structure-milo.query.handler.db'
import { JeuneMiloResumeQueryModel } from '../../../../src/application/queries/query-models/jeunes.query-model'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  SituationsMiloDto,
  SituationsMiloSqlModel
} from '../../../../src/infrastructure/sequelize/models/situations-milo.sql-model'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { DateService } from '../../../../src/utils/date-service'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { uneDate, uneDatetime } from '../../../fixtures/date.fixture'
import { uneSituationsMiloDto } from '../../../fixtures/milo.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { uneStructureMiloDto } from '../../../fixtures/sql-models/structureMilo.sql-model'
import { StubbedClass, expect, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('GetJeunesByStructureMiloQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let queryHandler: GetJeunesByStructureMiloQueryHandler
  let authorizer: StubbedClass<ConseillerInterStructureMiloAuthorizer>
  let dateService: StubbedClass<DateService>

  const datetimeDeBase = uneDatetime()

  before(() => {
    dateService = stubClass(DateService)
    dateService.nowJs.returns(datetimeDeBase.toJSDate())
    databaseForTesting = getDatabase()
    authorizer = stubClass(ConseillerInterStructureMiloAuthorizer)
    queryHandler = new GetJeunesByStructureMiloQueryHandler(
      authorizer,
      databaseForTesting.sequelize
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller sur son établissement', () => {
      // When
      queryHandler.authorize(
        { idStructureMilo: 'paris', q: 'un-nom' },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        authorizer.autoriserConseillerPourUneStructureMilo
      ).to.have.been.calledWithExactly('paris', unUtilisateurConseiller())
    })
  })

  describe('handle', () => {
    const structure1Dto = uneStructureMiloDto({
      id: '1',
      nomOfficiel: 'Paris',
      timezone: 'Europe/Paris'
    })
    const structure2Dto = uneStructureMiloDto({
      id: '2',
      nomOfficiel: 'Tunis',
      timezone: 'Africa/Tunis'
    })

    const conseiller1Dto = unConseillerDto({
      id: '1',
      nom: 'Nom premier conseiller',
      prenom: 'Prenom premier conseiller'
    })
    const conseiller2Dto = unConseillerDto({
      id: '2',
      nom: 'Nom deuxième conseiller',
      prenom: 'Prenom deuxième conseiller'
    })

    const jeune1Dto = unJeuneDto({
      id: '1',
      nom: 'Jean',
      prenom: 'Dupont',
      idConseiller: '1',
      dateDerniereActualisationToken: uneDate(),
      idStructureMilo: structure1Dto.id
    })
    const jeune2Dto = unJeuneDto({
      id: '2',
      nom: 'Jeanne',
      prenom: 'Claude Van Damme',
      idConseiller: '1',
      dateDerniereActualisationToken: uneDate(),
      idStructureMilo: structure1Dto.id
    })
    const jeune3Dto = unJeuneDto({
      id: '3',
      nom: 'Jean',
      prenom: 'Dupont',
      idConseiller: '2',
      dateDerniereActualisationToken: uneDate(),
      idStructureMilo: structure2Dto.id
    })

    const situationJeune1Dto = uneSituationsMiloDto({
      id: 1,
      idJeune: jeune1Dto.id
    })
    const situationJeune2Dto = uneSituationsMiloDto({
      id: 2,
      idJeune: jeune2Dto.id
    })
    const situationJeune3Dto = uneSituationsMiloDto({
      id: 3,
      idJeune: jeune3Dto.id
    })

    before(async () => {
      await databaseForTesting.cleanPG()
      await StructureMiloSqlModel.bulkCreate([structure1Dto, structure2Dto])
      await ConseillerSqlModel.bulkCreate([conseiller1Dto, conseiller2Dto])
      await JeuneSqlModel.bulkCreate([jeune1Dto, jeune2Dto, jeune3Dto])
      await SituationsMiloSqlModel.bulkCreate([
        situationJeune1Dto,
        situationJeune2Dto,
        situationJeune3Dto
      ])
    })

    describe('quand on demande le nom ou le prénom', () => {
      it('recherche avec pagination et correspondance texuelle', async () => {
        // Given
        const query = {
          idStructureMilo: structure1Dto.id,
          page: 1,
          limit: 1,
          q: 'Jean'
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetJeunesByStructureMiloQueryModel = {
          pagination: {
            page: 1,
            limit: 1,
            total: 2
          },
          resultats: [
            mapJeuneMiloResume(jeune1Dto, situationJeune1Dto, conseiller1Dto)
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
      it('recherche avec structure uniquement', async () => {
        // Given
        const query = {
          idStructureMilo: structure1Dto.id
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        // const queryModelAttendu: GetJeunesByStructureMiloQueryModel = {
        //   pagination: {
        //     page: 1,
        //     limit: 2,
        //     total: 2
        //   },
        //   resultats: [
        //     mapJeuneMiloResume(jeune1Dto, situationJeune1Dto, conseiller1Dto),
        //     mapJeuneMiloResume(jeune2Dto, situationJeune2Dto, conseiller1Dto)
        //   ]
        // }
        expect(result._isSuccess && result.data.pagination).to.deep.equal({
          page: 1,
          limit: 2,
          total: 2
        })
        expect(result._isSuccess && result.data.resultats.length).to.equal(2)
      })
    })
  })
})

function mapJeuneMiloResume(
  jeune: AsSql<JeuneDto>,
  situation: AsSql<SituationsMiloDto>,
  referent: AsSql<ConseillerDto>
): JeuneMiloResumeQueryModel {
  return {
    jeune: {
      id: jeune.id,
      nom: jeune.nom,
      prenom: jeune.prenom
    },
    referent: {
      id: referent.id,
      prenom: referent.prenom,
      nom: referent.nom
    },
    situation: situation.situationCourante?.categorie,
    dateDerniereActivite: jeune.dateDerniereActualisationToken?.toISOString()
  }
}

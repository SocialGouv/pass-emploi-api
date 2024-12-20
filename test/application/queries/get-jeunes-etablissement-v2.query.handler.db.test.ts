import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  SituationsMiloDto,
  SituationsMiloSqlModel
} from '../../../src/infrastructure/sequelize/models/situations-milo.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import {
  AgenceDto,
  AgenceSqlModel
} from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { uneAgenceDto } from '../../fixtures/sql-models/agence.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { JeuneMiloResumeQueryModel } from '../../../src/application/queries/query-models/jeunes.query-model'
import { uneDate, uneDatetime } from '../../fixtures/date.fixture'
import { Core } from '../../../src/domain/core'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'
import { uneSituationsMiloDto } from '../../fixtures/milo.fixture'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { GetJeunesEtablissementV2QueryModel } from '../../../src/application/queries/query-models/agence.query-model'
import { DateService } from '../../../src/utils/date-service'
import { GetJeunesEtablissementV2QueryHandler } from '../../../src/application/queries/get-jeunes-etablissement-v2.query.handler.db'
import { ConseillerInterAgenceAuthorizer } from '../../../src/application/authorizers/conseiller-inter-agence-authorizer'

describe('GetJeuneEtablissementV2QueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let queryHandler: GetJeunesEtablissementV2QueryHandler
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let dateService: StubbedClass<DateService>

  const datetimeDeBase = uneDatetime()

  let agence1Dto: AsSql<AgenceDto>
  let agence2Dto: AsSql<AgenceDto>

  let conseillerAgence1Dto: AsSql<ConseillerDto>
  let conseillerAgence2Dto: AsSql<ConseillerDto>

  let jeuneAgence1Dto: AsSql<JeuneDto>
  let jeuneAgence2Dto: AsSql<JeuneDto>
  let jeuneEtablissement3Dto: AsSql<JeuneDto>

  let situationJeune1Dto: AsSql<SituationsMiloDto>
  let situationJeune2Dto: AsSql<SituationsMiloDto>
  let situationJeune3Dto: AsSql<SituationsMiloDto>

  before(() => {
    dateService = stubClass(DateService)
    dateService.nowJs.returns(datetimeDeBase.toJSDate())
    databaseForTesting = getDatabase()
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    queryHandler = new GetJeunesEtablissementV2QueryHandler(
      conseillerAgenceAuthorizer,
      databaseForTesting.sequelize
    )
  })

  describe('authorize', () => {
    it('autorise un conseiller sur son établissement', () => {
      // When
      queryHandler.authorize(
        { idEtablissement: 'paris', q: 'un-nom' },
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

      conseillerAgence1Dto = unConseillerDto({
        id: '1',
        nom: 'Nom premier conseiller',
        prenom: 'Prenom premier conseiller',
        idAgence: '1'
      })

      conseillerAgence2Dto = unConseillerDto({
        id: '2',
        nom: 'Nom deuxième conseiller',
        prenom: 'Prenom deuxième conseiller',
        idAgence: '2'
      })

      jeuneAgence1Dto = unJeuneDto({
        id: '1',
        nom: 'Jean',
        prenom: 'Dupont',
        idConseiller: '1',
        dateDerniereActualisationToken: uneDate()
      })

      jeuneAgence2Dto = unJeuneDto({
        id: '2',
        nom: 'Jeanne',
        prenom: 'Claude Van Damme',
        idConseiller: '1',
        dateDerniereActualisationToken: uneDate()
      })

      jeuneEtablissement3Dto = unJeuneDto({
        id: '3',
        nom: 'Jean',
        prenom: 'Dupont',
        idConseiller: '2',
        dateDerniereActualisationToken: uneDate()
      })

      situationJeune1Dto = uneSituationsMiloDto({
        id: 1,
        idJeune: jeuneAgence1Dto.id
      })

      situationJeune2Dto = uneSituationsMiloDto({
        id: 2,
        idJeune: jeuneAgence2Dto.id
      })

      situationJeune3Dto = uneSituationsMiloDto({
        id: 3,
        idJeune: jeuneEtablissement3Dto.id
      })

      await AgenceSqlModel.bulkCreate([agence1Dto, agence2Dto])

      await ConseillerSqlModel.bulkCreate([
        conseillerAgence1Dto,
        conseillerAgence2Dto
      ])

      await JeuneSqlModel.bulkCreate([
        jeuneAgence1Dto,
        jeuneAgence2Dto,
        jeuneEtablissement3Dto
      ])

      await SituationsMiloSqlModel.bulkCreate([
        situationJeune1Dto,
        situationJeune2Dto,
        situationJeune3Dto
      ])
    })

    describe('quand on demande le nom ou le prénom', () => {
      it('ne retourne pas de doublon quand le nom et le prénom ont le même préfixe', async () => {
        // Given
        const query = {
          idEtablissement: agence1Dto.id,
          page: 1,
          limit: 1,
          q: 'Jean'
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetJeunesEtablissementV2QueryModel = {
          pagination: {
            page: 1,
            limit: 1,
            total: 2
          },
          resultats: [
            mapJeuneMiloResume(
              jeuneAgence1Dto,
              situationJeune1Dto,
              conseillerAgence1Dto
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

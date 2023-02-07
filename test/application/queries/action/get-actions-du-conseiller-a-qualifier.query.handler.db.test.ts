import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { GetActionsDuConseillerAQualifierQueryHandler } from '../../../../src/application/queries/action/get-actions-du-conseiller-a-qualifier.query.handler.db'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/authorize-conseiller'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import {
  ActionDto,
  ActionSqlModel
} from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import { Action } from '../../../../src/domain/action/action'
import { GetActionsDuConseillerAQualifierQueryModel } from '../../../../src/application/queries/query-models/conseillers.query-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { uneDate } from '../../../fixtures/date.fixture'
import { Qualification } from '../../../../src/domain/action/qualification'
import Code = Qualification.Code
import { AsSql } from '../../../../src/infrastructure/sequelize/types'

describe('GetActionsDuConseillerAQualifierQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let queryHandler: GetActionsDuConseillerAQualifierQueryHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'
  const idAutreConseiller = 'id-autre-conseiller'
  const idAutreJeune = 'id-autre-jeune'
  const dateFinReelle = uneDate()

  let conseillerDto: AsSql<ConseillerDto>
  let autreConseillerDto: AsSql<ConseillerDto>
  let jeuneDto: AsSql<JeuneDto>
  let autreJeuneDto: AsSql<JeuneDto>
  let actionAQualifier1Page1Dto: AsSql<ActionDto>
  let actionAQualifier2Page1Dto: AsSql<ActionDto>
  let actionAQualifier1Page2Dto: AsSql<ActionDto>
  let actionNonTermineeDto: AsSql<ActionDto>
  let actionQualifieeDto: AsSql<ActionDto>
  let actionAutreConseillerDto: AsSql<ActionDto>

  before(() => {
    databaseForTesting = getDatabase()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    queryHandler = new GetActionsDuConseillerAQualifierQueryHandler(
      conseillerAuthorizer
    )
  })

  describe('authorize', () => {
    it('autorise le conseiller', async () => {
      // Given
      const utilisateurConseiller = unUtilisateurConseiller({
        id: idConseiller
      })
      const query = { idConseiller, page: 1, limit: 10 }

      // When
      await queryHandler.authorize(query, utilisateurConseiller)

      // Then
      expect(conseillerAuthorizer.authorize).to.have.been.calledOnceWithExactly(
        idConseiller,
        utilisateurConseiller
      )
    })
  })

  describe('handle', () => {
    before(async () => {
      await databaseForTesting.cleanPG()

      // Given
      conseillerDto = unConseillerDto({ id: idConseiller })
      jeuneDto = unJeuneDto({ id: idJeune, idConseiller })
      actionAQualifier1Page1Dto = uneActionDto({
        id: '9c84a1ab-96e2-4841-935a-16d69fe2e7ff',
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateFinReelle
      })
      actionAQualifier2Page1Dto = uneActionDto({
        id: '8c84a1ab-96e2-4841-935a-16d69fe2e7ee',
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateFinReelle
      })
      actionAQualifier1Page2Dto = uneActionDto({
        id: '7c84a1ab-96e2-4841-935a-16d69fe2e444',
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateFinReelle
      })
      actionNonTermineeDto = uneActionDto({
        idJeune,
        statut: Action.Statut.EN_COURS,
        dateFinReelle
      })
      actionQualifieeDto = uneActionDto({
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateFinReelle,
        codeQualification: Code.SANTE
      })

      autreConseillerDto = unConseillerDto({ id: idAutreConseiller })
      autreJeuneDto = unJeuneDto({
        id: idAutreJeune,
        idConseiller: idAutreConseiller
      })
      actionAutreConseillerDto = uneActionDto({
        idJeune: idAutreJeune,
        statut: Action.Statut.TERMINEE,
        dateFinReelle
      })

      await ConseillerSqlModel.bulkCreate([conseillerDto, autreConseillerDto])
      await JeuneSqlModel.bulkCreate([jeuneDto, autreJeuneDto])
      await ActionSqlModel.bulkCreate([
        actionAQualifier1Page1Dto,
        actionAQualifier2Page1Dto,
        actionAQualifier1Page2Dto,
        actionNonTermineeDto,
        actionQualifieeDto,
        actionAutreConseillerDto
      ])
    })

    it('récupère toutes les actions à qualifier (non terminées) de la première page', async () => {
      // Given
      const query = { idConseiller, page: 1, limit: 2 }

      // When
      const result = await queryHandler.handle(query)

      // Then
      const queryModelAttendu: GetActionsDuConseillerAQualifierQueryModel = {
        pagination: { page: query.page, limit: query.limit, total: 3 },
        resultats: [
          {
            id: actionAQualifier1Page1Dto.id,
            titre: actionAQualifier1Page1Dto.contenu,
            jeune: {
              id: idJeune,
              nom: jeuneDto.nom,
              prenom: jeuneDto.prenom
            },
            dateFinReelle: dateFinReelle.toDateString()
          },
          {
            id: actionAQualifier2Page1Dto.id,
            titre: actionAQualifier2Page1Dto.contenu,
            jeune: {
              id: idJeune,
              nom: jeuneDto.nom,
              prenom: jeuneDto.prenom
            },
            dateFinReelle: dateFinReelle.toDateString()
          }
        ]
      }
      expect(result._isSuccess && result.data).to.deep.equal(queryModelAttendu)
    })
    it('récupère toutes les actions à qualifier de la deuxième page', async () => {
      // Given
      const query = { idConseiller, page: 2, limit: 2 }

      // When
      const result = await queryHandler.handle(query)

      // Then
      const queryModelAttendu: GetActionsDuConseillerAQualifierQueryModel = {
        pagination: { page: query.page, limit: query.limit, total: 3 },
        resultats: [
          {
            id: actionAQualifier1Page2Dto.id,
            titre: actionAQualifier1Page2Dto.contenu,
            jeune: {
              id: idJeune,
              nom: jeuneDto.nom,
              prenom: jeuneDto.prenom
            },
            dateFinReelle: dateFinReelle.toDateString()
          }
        ]
      }
      expect(result._isSuccess && result.data).to.deep.equal(queryModelAttendu)
    })
  })
})

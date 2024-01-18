import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import {
  GetActionsConseillerV2Query,
  GetActionsConseillerV2QueryHandler
} from 'src/application/queries/action/get-actions-conseiller-v2.query.handler.db'
import { GetActionsConseillerV2QueryModel } from 'src/application/queries/query-models/conseillers.query-model'
import { Action } from 'src/domain/action/action'
import {
  ActionDto,
  ActionSqlModel
} from 'src/infrastructure/sequelize/models/action.sql-model'
import {
  ConseillerDto,
  ConseillerSqlModel
} from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { AsSql } from 'src/infrastructure/sequelize/types'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'

describe('GetActionsDuConseillerAQualifierQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let queryHandler: GetActionsConseillerV2QueryHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  const idConseiller = 'id-conseiller'
  const idJeune = 'id-jeune'
  const idAutreConseiller = 'id-autre-conseiller'
  const idAutreJeune = 'id-autre-jeune'
  const datetimeDeBase = uneDatetime()

  let conseillerDto: AsSql<ConseillerDto>
  let autreConseillerDto: AsSql<ConseillerDto>
  let jeuneDto: AsSql<JeuneDto>
  let autreJeuneDto: AsSql<JeuneDto>
  let actionAQualifier1Dto: AsSql<ActionDto>
  let actionAQualifier2Dto: AsSql<ActionDto>
  let actionAQualifier3Dto: AsSql<ActionDto>
  let actionNonTermineeDto: AsSql<ActionDto>
  let actionQualifieeDto: AsSql<ActionDto>
  let actionAutreConseillerDto: AsSql<ActionDto>

  before(() => {
    databaseForTesting = getDatabase()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    queryHandler = new GetActionsConseillerV2QueryHandler(conseillerAuthorizer)
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
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledOnceWithExactly(idConseiller, utilisateurConseiller)
    })
  })

  describe('handle', () => {
    before(async () => {
      await databaseForTesting.cleanPG()

      // Given
      conseillerDto = unConseillerDto({ id: idConseiller })
      jeuneDto = unJeuneDto({ id: idJeune, idConseiller })

      // Tri par date creation numérotées par ordre de date d'échéance
      actionNonTermineeDto = uneActionDto({
        idJeune,
        statut: Action.Statut.EN_COURS,
        dateCreation: datetimeDeBase.toJSDate()
      })
      actionAQualifier1Dto = uneActionDto({
        id: '9c84a1ab-96e2-4841-935a-16d69fe2e7ff',
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateCreation: datetimeDeBase.plus({ days: 1 }).toJSDate(),
        dateFinReelle: datetimeDeBase.toJSDate(),
        codeQualification: Action.Qualification.Code.CITOYENNETE
      })
      actionAQualifier3Dto = uneActionDto({
        id: '8c84a1ab-96e2-4841-935a-16d69fe2e7ee',
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateCreation: datetimeDeBase.plus({ days: 2 }).toJSDate(),
        dateFinReelle: datetimeDeBase.plus({ days: 2 }).toJSDate()
      })
      actionAQualifier2Dto = uneActionDto({
        id: '7c84a1ab-96e2-4841-935a-16d69fe2e444',
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateCreation: datetimeDeBase.plus({ days: 3 }).toJSDate(),
        dateFinReelle: datetimeDeBase.plus({ days: 1 }).toJSDate(),
        codeQualification: Action.Qualification.Code.SANTE
      })
      actionQualifieeDto = uneActionDto({
        idJeune,
        statut: Action.Statut.TERMINEE,
        dateCreation: datetimeDeBase.plus({ days: 4 }).toJSDate(),
        codeQualification: Action.Qualification.Code.SANTE,
        heuresQualifiees: 5
      })

      autreConseillerDto = unConseillerDto({ id: idAutreConseiller })
      autreJeuneDto = unJeuneDto({
        id: idAutreJeune,
        idConseiller: idAutreConseiller
      })
      actionAutreConseillerDto = uneActionDto({
        idJeune: idAutreJeune,
        statut: Action.Statut.TERMINEE,
        dateFinReelle: datetimeDeBase.toJSDate()
      })

      await ConseillerSqlModel.bulkCreate([conseillerDto, autreConseillerDto])
      await JeuneSqlModel.bulkCreate([jeuneDto, autreJeuneDto])
      await ActionSqlModel.bulkCreate([
        actionAQualifier1Dto,
        actionAQualifier2Dto,
        actionAQualifier3Dto,
        actionNonTermineeDto,
        actionQualifieeDto,
        actionAutreConseillerDto
      ])
    })

    describe('quand pas de filtre', () => {
      const limit = 3
      it('récupère toutes les actions de la première page', async () => {
        // Given
        const query = { idConseiller, page: 1, limit }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page, limit: query.limit, total: 5 },
          resultats: [
            {
              id: actionNonTermineeDto.id,
              titre: actionNonTermineeDto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionNonTermineeDto.dateFinReelle?.toISOString(),
              categorie: undefined
            },
            {
              id: actionAQualifier1Dto.id,
              titre: actionAQualifier1Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier1Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.CITOYENNETE,
                libelle: 'Citoyenneté'
              }
            },
            {
              id: actionAQualifier3Dto.id,
              titre: actionAQualifier3Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier3Dto.dateFinReelle?.toISOString(),
              categorie: undefined
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
      it('récupère toutes les actions à qualifier de la deuxième page', async () => {
        // Given
        const query = { idConseiller, page: 2, limit }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page, limit: query.limit, total: 5 },
          resultats: [
            {
              id: actionAQualifier2Dto.id,
              titre: actionAQualifier2Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier2Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            },
            {
              id: actionQualifieeDto.id,
              titre: actionQualifieeDto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionQualifieeDto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
    })

    describe('quand filtre a qualifier', () => {
      const limit = 2
      it('récupère toutes les actions de la première page', async () => {
        // Given
        const query = { idConseiller, page: 1, limit, aQualifier: true }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page, limit: query.limit, total: 3 },
          resultats: [
            {
              id: actionAQualifier1Dto.id,
              titre: actionAQualifier1Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier1Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.CITOYENNETE,
                libelle: 'Citoyenneté'
              }
            },
            {
              id: actionAQualifier2Dto.id,
              titre: actionAQualifier2Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier2Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
      it('récupère toutes les actions à qualifier de la deuxième page', async () => {
        // Given
        const query = { idConseiller, page: 2, limit, aQualifier: true }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page, limit: query.limit, total: 3 },
          resultats: [
            {
              id: actionAQualifier3Dto.id,
              titre: actionAQualifier3Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier3Dto.dateFinReelle?.toISOString(),
              categorie: undefined
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
    })

    describe('quand filtre catégories', () => {
      it('récupère toutes les actions avec une catégorie', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller,
          page: 1,
          limit: 2,
          codesCategories: [Action.Qualification.Code.SANTE]
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page!, limit: query.limit!, total: 2 },
          resultats: [
            {
              id: actionAQualifier2Dto.id,
              titre: actionAQualifier2Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier2Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            },
            {
              id: actionQualifieeDto.id,
              titre: actionQualifieeDto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionQualifieeDto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })

      it('récupère toutes les actions avec plusieurs catégories', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller,
          page: 1,
          limit: 3,
          codesCategories: [
            Action.Qualification.Code.SANTE,
            Action.Qualification.Code.CITOYENNETE
          ]
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page!, limit: query.limit!, total: 3 },
          resultats: [
            {
              id: actionAQualifier1Dto.id,
              titre: actionAQualifier1Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier1Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.CITOYENNETE,
                libelle: 'Citoyenneté'
              }
            },
            {
              id: actionAQualifier2Dto.id,
              titre: actionAQualifier2Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier2Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            },
            {
              id: actionQualifieeDto.id,
              titre: actionQualifieeDto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionQualifieeDto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
    })

    describe('quand tous les filtres', () => {
      it('récupère toutes les actions à qualifier avec une catégorie', async () => {
        // Given
        const query: GetActionsConseillerV2Query = {
          idConseiller,
          page: 1,
          limit: 2,
          codesCategories: [Action.Qualification.Code.SANTE],
          aQualifier: true
        }

        // When
        const result = await queryHandler.handle(query)

        // Then
        const queryModelAttendu: GetActionsConseillerV2QueryModel = {
          pagination: { page: query.page!, limit: query.limit!, total: 1 },
          resultats: [
            {
              id: actionAQualifier2Dto.id,
              titre: actionAQualifier2Dto.contenu,
              jeune: {
                id: idJeune,
                nom: jeuneDto.nom,
                prenom: jeuneDto.prenom
              },
              dateFinReelle: actionAQualifier2Dto.dateFinReelle?.toISOString(),
              categorie: {
                code: Action.Qualification.Code.SANTE,
                libelle: 'Santé'
              }
            }
          ]
        }
        expect(result._isSuccess && result.data).to.deep.equal(
          queryModelAttendu
        )
      })
    })
  })
})

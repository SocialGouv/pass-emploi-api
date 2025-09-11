import { HttpStatus, INestApplication } from '@nestjs/common'
import { GetTypesQualificationsQueryHandler } from 'src/application/queries/action/get-types-qualifications.query.handler'
import {
  ActionPredefinieQueryModel,
  TypeQualificationQueryModel
} from 'src/application/queries/query-models/actions.query-model'
import { Action } from 'src/domain/action/action'
import * as request from 'supertest'
import { GetActionsPredefiniesQueryHandler } from '../../../src/application/queries/action/get-actions-predefinies.query.handler'
import { GetAgencesQueryHandler } from '../../../src/application/queries/get-agences.query.handler.db'
import { GetCatalogueDemarchesQueryHandler } from '../../../src/application/queries/get-catalogue-demarches.query.handler'
import { GetCommunesEtDepartementsQueryHandler } from '../../../src/application/queries/get-communes-et-departements.query.handler.db'
import { GetMetiersRomeQueryHandler } from '../../../src/application/queries/get-metiers-rome.query.handler.db'
import { GetMotifsSuppressionJeuneQueryHandler } from '../../../src/application/queries/get-motifs-suppression-jeune.query.handler'
import { CommuneOuDepartementType } from '../../../src/application/queries/query-models/communes-et-departements.query-model'
import { success } from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import { unHeaderAuthorization } from '../../fixtures/authentification.fixture'
import { StubbedClass, stubClass } from '../../utils'
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'
import { getApplicationWithStubbedDependencies } from '../../utils/module-for-testing'
import Structure = Core.Structure

let getCommunesEtDepartementsQueryHandler: StubbedClass<GetCommunesEtDepartementsQueryHandler>
let getAgencesQueryHandler: StubbedClass<GetAgencesQueryHandler>
let getMotifsSuppressionQueryHandler: StubbedClass<GetMotifsSuppressionJeuneQueryHandler>
let getTypesQualificationsQueryHandler: StubbedClass<GetTypesQualificationsQueryHandler>
let getActionsPredefiniesQueryHandler: StubbedClass<GetActionsPredefiniesQueryHandler>
let getMetiersRomeQueryHandler: StubbedClass<GetMetiersRomeQueryHandler>
let getCatalogueDemarchesQueryHandler: StubbedClass<GetCatalogueDemarchesQueryHandler>

describe('ReferentielsController', () => {
  getCommunesEtDepartementsQueryHandler = stubClass(
    GetCommunesEtDepartementsQueryHandler
  )
  getAgencesQueryHandler = stubClass(GetAgencesQueryHandler)
  getMotifsSuppressionQueryHandler = stubClass(
    GetMotifsSuppressionJeuneQueryHandler
  )
  getTypesQualificationsQueryHandler = stubClass(
    GetTypesQualificationsQueryHandler
  )
  getMetiersRomeQueryHandler = stubClass(GetMetiersRomeQueryHandler)
  getActionsPredefiniesQueryHandler = stubClass(
    GetActionsPredefiniesQueryHandler
  )
  getCatalogueDemarchesQueryHandler = stubClass(
    GetCatalogueDemarchesQueryHandler
  )

  let app: INestApplication

  before(async () => {
    app = await getApplicationWithStubbedDependencies()
    getCommunesEtDepartementsQueryHandler = app.get(
      GetCommunesEtDepartementsQueryHandler
    )
    getAgencesQueryHandler = app.get(GetAgencesQueryHandler)

    getMotifsSuppressionQueryHandler = app.get(
      GetMotifsSuppressionJeuneQueryHandler
    )
    getTypesQualificationsQueryHandler = app.get(
      GetTypesQualificationsQueryHandler
    )
    getMetiersRomeQueryHandler = app.get(GetMetiersRomeQueryHandler)
    getActionsPredefiniesQueryHandler = app.get(
      GetActionsPredefiniesQueryHandler
    )
    getCatalogueDemarchesQueryHandler = app.get(
      GetCatalogueDemarchesQueryHandler
    )
  })

  describe('GET /referentiels/communes-et-departements?recherche=abcde', () => {
    it('renvoie les communes et departements demandés', () => {
      // Given
      getCommunesEtDepartementsQueryHandler.execute
        .withArgs({ recherche: 'abcde', villesOnly: false })
        .resolves([
          {
            libelle: 'abcde',
            code: '5',
            codePostal: '78907',
            type: CommuneOuDepartementType.COMMUNE,
            score: 0.3
          },
          {
            libelle: 'abcd',
            code: '4',
            type: CommuneOuDepartementType.DEPARTEMENT,
            score: 0.2
          }
        ])

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/communes-et-departements?recherche=abcde')
        .set('Authorization', 'Bearer ceci-est-un-jwt')
        .expect(HttpStatus.OK)
        .expect([
          {
            code: '5',
            codePostal: '78907',
            libelle: 'abcde',
            score: 0.3,
            type: 'COMMUNE'
          },
          {
            code: '4',
            libelle: 'abcd',
            score: 0.2,
            type: 'DEPARTEMENT'
          }
        ])
    })

    it('renvoie les communes seulement', () => {
      // Given
      getCommunesEtDepartementsQueryHandler.execute
        .withArgs({
          recherche: 'abcde',
          villesOnly: true
        })
        .resolves([
          {
            libelle: 'abcde',
            code: '5',
            codePostal: '78907',
            type: CommuneOuDepartementType.COMMUNE,
            score: 0.3
          }
        ])

      // When - Then
      return request(app.getHttpServer())
        .get(
          '/referentiels/communes-et-departements?recherche=abcde&villesOnly=true'
        )
        .set('Authorization', 'Bearer ceci-est-un-jwt')
        .expect(HttpStatus.OK)
        .expect([
          {
            code: '5',
            codePostal: '78907',
            libelle: 'abcde',
            score: 0.3,
            type: 'COMMUNE'
          }
        ])
    })
  })

  describe('GET /referentiels/metiers?recherche=boulanger', () => {
    it('renvoie les codes rome', () => {
      // Given
      getMetiersRomeQueryHandler.execute
        .withArgs({ recherche: 'boulanger' })
        .resolves([
          {
            libelle: 'Boulanger',
            code: 'D1104',
            score: 0.3
          }
        ])

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/metiers?recherche=boulanger')
        .set('Authorization', 'Bearer ceci-est-un-jwt')
        .expect(HttpStatus.OK)
        .expect([
          {
            code: 'D1104',
            libelle: 'Boulanger',
            score: 0.3
          }
        ])
    })
  })

  describe('GET /referentiels/agences', () => {
    describe('avec le query param POLE_EMPLOI', () => {
      it('renvoie les agences Pôle emploi', () => {
        // Given
        getAgencesQueryHandler.execute
          .withArgs({ structure: Structure.POLE_EMPLOI })
          .resolves([
            {
              id: 'jean michel id',
              nom: 'Agence Batman',
              codeDepartement: 'aa'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves',
              codeDepartement: 'aa'
            }
          ])

        // When - Then
        return request(app.getHttpServer())
          .get('/referentiels/agences?structure=POLE_EMPLOI')
          .set('Authorization', 'Bearer ceci-est-un-jwt')
          .expect(HttpStatus.OK)
          .expect([
            {
              id: 'jean michel id',
              nom: 'Agence Batman',
              codeDepartement: 'aa'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves',
              codeDepartement: 'aa'
            }
          ])
      })
    })

    describe('avec le query param POLE_EMPLOI MILO', () => {
      it('renvoie les agences milo', () => {
        // Given
        getAgencesQueryHandler.execute
          .withArgs({ structure: Structure.MILO })
          .resolves([
            {
              id: 'jean michel id',
              nom: 'Agence Batman',
              codeDepartement: 'aa'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves',
              codeDepartement: 'aa'
            }
          ])

        // When - Then
        return request(app.getHttpServer())
          .get('/referentiels/agences?structure=MILO')
          .set('Authorization', 'Bearer ceci-est-un-jwt')
          .expect(HttpStatus.OK)
          .expect([
            {
              id: 'jean michel id',
              nom: 'Agence Batman',
              codeDepartement: 'aa'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves',
              codeDepartement: 'aa'
            }
          ])
      })
    })

    describe('sans structure en query param', () => {
      it('renvoie une 400 ', () => {
        // When - Then
        return request(app.getHttpServer())
          .get('/referentiels/agences')
          .set('Authorization', 'Bearer ceci-est-un-jwt')
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    describe('avec une structure bidon', () => {
      it('renvoie une 400 ', () => {
        // When - Then
        return request(app.getHttpServer())
          .get('/referentiels/agences?structure=PLOP')
          .set('Authorization', 'Bearer ceci-est-un-jwt')
          .expect(HttpStatus.BAD_REQUEST)
      })
    })
  })

  describe('GET /referentiels/catalogue-demarches', () => {
    describe('quand PE est UP', () => {
      it('renvoie le catalogue de démarches', () => {
        // Given
        getCatalogueDemarchesQueryHandler.execute.resolves([])

        // When - Then
        return request(app.getHttpServer())
          .get('/referentiels/pole-emploi/catalogue-demarches')
          .set('Authorization', 'Bearer ceci-est-un-jwt')
          .expect(HttpStatus.OK)
      })
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/referentiels/pole-emploi/catalogue-demarches'
    )
  })

  describe('GET /referentiels/motifs-suppression-jeune', () => {
    it("renvoie les motifs de suppression d'un compte jeune", () => {
      // Given
      getMotifsSuppressionQueryHandler.execute.resolves(success([]))

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/motifs-suppression-jeune')
        .set('authorization', unHeaderAuthorization())
        .expect(HttpStatus.OK)
    })
  })

  describe('GET /qualifications-actions/types', () => {
    it('renvoie les types de qualifications des actions', () => {
      // Given
      const types: TypeQualificationQueryModel[] = [
        { code: Action.Qualification.Code.SANTE, label: 'aa', heures: 0 }
      ]

      getTypesQualificationsQueryHandler.execute.resolves(types)

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/qualifications-actions/types')
        .set('authorization', unHeaderAuthorization())
        .expect([
          { code: Action.Qualification.Code.SANTE, label: 'aa', heures: 0 }
        ])
        .expect(HttpStatus.OK)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/referentiels/qualifications-actions/types'
    )
  })

  describe('GET /actions-predefinies', () => {
    it('renvoie le référentiel des actions prédéfinies', () => {
      // Given
      const actionsPredefinies: ActionPredefinieQueryModel[] = [
        {
          id: 'action-predefinie-1',
          titre: 'Identifier ses atouts et ses compétences'
        }
      ]

      getActionsPredefiniesQueryHandler.execute.resolves(actionsPredefinies)

      // When - Then
      return request(app.getHttpServer())
        .get('/referentiels/actions-predefinies')
        .set('authorization', unHeaderAuthorization())
        .expect([
          {
            id: 'action-predefinie-1',
            titre: 'Identifier ses atouts et ses compétences'
          }
        ])
        .expect(HttpStatus.OK)
    })

    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/referentiels/actions-predefinies'
    )
  })
})

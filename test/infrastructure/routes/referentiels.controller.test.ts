import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { GetCommunesEtDepartementsQueryHandler } from '../../../src/application/queries/get-communes-et-departements.query.handler.db'
import { CommuneOuDepartementType } from '../../../src/application/queries/query-models/communes-et-departements.query-model'
import {
  buildTestingModuleForHttpTesting,
  StubbedClass,
  stubClass
} from '../../utils'
import { GetAgencesQueryHandler } from '../../../src/application/queries/get-agences.query.handler'
import { Core } from '../../../src/domain/core'
import { RechercherTypesDemarcheQueryHandler } from '../../../src/application/queries/rechercher-types-demarche.query.handler'
import { unUtilisateurDecode } from '../../fixtures/authentification.fixture'
import { TypesDemarcheQueryModel } from '../../../src/application/queries/query-models/types-demarche.query-model'
import Structure = Core.Structure
import { ensureUserAuthenticationFailsIfInvalid } from '../../utils/ensure-user-authentication-fails-if-invalid'

let getCommunesEtDepartementsQueryHandler: StubbedClass<GetCommunesEtDepartementsQueryHandler>
let getAgencesQueryHandler: StubbedClass<GetAgencesQueryHandler>
let rechercherTypesDemarcheQueryHandler: StubbedClass<RechercherTypesDemarcheQueryHandler>

describe('ReferentielsController', () => {
  getCommunesEtDepartementsQueryHandler = stubClass(
    GetCommunesEtDepartementsQueryHandler
  )
  getAgencesQueryHandler = stubClass(GetAgencesQueryHandler)
  rechercherTypesDemarcheQueryHandler = stubClass(
    RechercherTypesDemarcheQueryHandler
  )
  let app: INestApplication
  before(async () => {
    const testingModule = await buildTestingModuleForHttpTesting()
      .overrideProvider(GetCommunesEtDepartementsQueryHandler)
      .useValue(getCommunesEtDepartementsQueryHandler)
      .overrideProvider(GetAgencesQueryHandler)
      .useValue(getAgencesQueryHandler)
      .overrideProvider(RechercherTypesDemarcheQueryHandler)
      .useValue(rechercherTypesDemarcheQueryHandler)
      .compile()
    app = testingModule.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  after(async () => {
    await app.close()
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

  describe('GET /referentiels/agences', () => {
    describe('avec le query param POLE_EMPLOI', () => {
      it('renvoie les agences Pôle emploi', () => {
        // Given
        getAgencesQueryHandler.execute
          .withArgs({ structure: Structure.POLE_EMPLOI })
          .resolves([
            {
              id: 'jean michel id',
              nom: 'Agence Batman'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves'
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
              nom: 'Agence Batman'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves'
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
              nom: 'Agence Batman'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves'
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
              nom: 'Agence Batman'
            },
            {
              id: 'el yolo de la muerte',
              nom: 'Agence des chauves'
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

  describe('GET /referentiels/types-demarche', () => {
    describe('sans query param', () => {
      it('rejette', () => {
        // When - Then
        return request(app.getHttpServer())
          .get('/referentiels/pole-emploi/types-demarches')
          .set('Authorization', 'Bearer ceci-est-un-jwt')
          .expect(HttpStatus.BAD_REQUEST)
      })
    })

    describe('avec un query param', () => {
      describe('quand PE est UP', () => {
        it('renvoie les types de démarches', () => {
          // Given
          const desTypesDemarcheQueryModel: TypesDemarcheQueryModel[] = [
            {
              codePourquoi: 'FAKE-P03',
              codeQuoi: 'FAKE-Q12',
              libellePourquoi: 'FAKE-Mes candidatures',
              libelleQuoi: "Recherche d'offres d'emploi ou d'entreprises",
              commentObligatoire: false,
              comment: [
                {
                  code: 'FAKE-C12.06',
                  label: 'FAKE-Par un autre moyen'
                }
              ]
            }
          ]
          rechercherTypesDemarcheQueryHandler.execute
            .withArgs({ recherche: 'salon' }, unUtilisateurDecode())
            .resolves(desTypesDemarcheQueryModel)

          // When - Then
          return request(app.getHttpServer())
            .get('/referentiels/pole-emploi/types-demarches?recherche=salon')
            .set('Authorization', 'Bearer ceci-est-un-jwt')
            .expect(HttpStatus.OK)
            .expect(desTypesDemarcheQueryModel)
        })
      })
    })
    ensureUserAuthenticationFailsIfInvalid(
      'get',
      '/referentiels/pole-emploi/types-demarches'
    )
  })
})

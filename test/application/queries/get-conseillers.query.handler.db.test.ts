import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  GetConseillersQuery,
  GetConseillersQueryHandler
} from '../../../src/application/queries/get-conseillers.query.handler.db'
import { success } from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { StubbedClass, expect, stubClass } from '../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'

describe('GetConseillersQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getConseillersQueryHandler: GetConseillersQueryHandler

  before(() => {
    databaseForTesting = getDatabase()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getConseillersQueryHandler = new GetConseillersQueryHandler(
      conseillerAuthorizer,
      databaseForTesting.sequelize
    )
  })
  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  describe('handle', () => {
    let conseillerDto: AsSql<ConseillerDto>

    beforeEach(async () => {
      // Given
      conseillerDto = unConseillerDto({
        prenom: 'toto',
        nom: 'tata',
        email: 'conseiller@email.fr'
      })
      await ConseillerSqlModel.creer(conseillerDto)
    })

    it('retourne le conseiller quand le conseiller existe avec email', async () => {
      // When
      const actual = await getConseillersQueryHandler.handle({
        recherche: 'cOnSeIlLeR@eMaIl.fR',
        structureUtilisateur: Core.Structure.PASS_EMPLOI
      })

      expect(actual).to.deep.equal(
        success([
          {
            id: conseillerDto.id,
            prenom: 'toto',
            nom: 'tata',
            email: 'conseiller@email.fr'
          }
        ])
      )
    })

    it('retourne le conseiller quand le conseiller existe avec email approchant', async () => {
      const actual = await getConseillersQueryHandler.handle({
        recherche: 'inexistant@email.com',
        structureUtilisateur: Core.Structure.PASS_EMPLOI
      })

      expect(actual).to.deep.equal(
        success([
          {
            id: conseillerDto.id,
            prenom: 'toto',
            nom: 'tata',
            email: 'conseiller@email.fr'
          }
        ])
      )
    })

    it("retourne un échec quand le conseiller n'existe pas avec cette structure", async () => {
      const actual = await getConseillersQueryHandler.handle({
        recherche: 'cOnSeIlLeR@eMaIl.fR',
        structureUtilisateur: Core.Structure.MILO
      })

      expect(actual).to.deep.equal(success([]))
    })

    it('retourne les conseillers classés par pertinence', async () => {
      // Given

      await ConseillerSqlModel.bulkCreate([
        unConseillerDto({
          id: '2',
          prenom: 'Jean',
          nom: 'Dupont'
        }),
        unConseillerDto({
          id: '3',
          prenom: 'Bruno',
          nom: 'Dumont'
        }),
        unConseillerDto({
          id: '4',
          prenom: 'Dudu',
          nom: 'Labiche'
        })
      ])

      // When
      const actual = await getConseillersQueryHandler.handle({
        recherche: 'du',
        structureUtilisateur: Core.Structure.PASS_EMPLOI
      })

      expect(actual).to.deep.equal(
        success([
          {
            id: '4',
            prenom: 'Dudu',
            nom: 'Labiche',
            email: 'nils.tavernier@passemploi.com'
          },
          {
            id: '2',
            prenom: 'Jean',
            nom: 'Dupont',
            email: 'nils.tavernier@passemploi.com'
          },
          {
            id: '3',
            prenom: 'Bruno',
            nom: 'Dumont',
            email: 'nils.tavernier@passemploi.com'
          }
        ])
      )
    })
  })

  describe('authorize', () => {
    it('interdit le conseiller non superviseur', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ roles: [] })
      const query: GetConseillersQuery = {
        recherche: 'whatever@email.fr',
        structureUtilisateur: Core.Structure.POLE_EMPLOI
      }

      // When
      await getConseillersQueryHandler.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserConseillerSuperviseur
      ).to.have.been.calledWith(utilisateur)
    })
  })
})

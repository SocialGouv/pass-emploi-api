import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  GetConseillersEtablissementQuery,
  GetConseillersEtablissementQueryHandler
} from 'src/application/queries/get-conseillers-etablissement.query.handler.db'
import { success } from '../../../src/building-blocks/types/result'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { detailConseillerQueryModel } from '../../fixtures/query-models/conseiller.query-model.fixtures'
import { expect, StubbedClass, stubClass } from '../../utils'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  ConseillerDto,
  ConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { getDatabase } from '../../utils/database-for-testing'
import Structure = Core.Structure
import { AgenceSqlModel } from 'src/infrastructure/sequelize/models/agence.sql-model'
import { uneAgenceDto } from 'test/fixtures/sql-models/agence.sql-model'

describe('GetConseillerEtablissementQueryHandler', () => {
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getConseillersEtablissement: GetConseillersEtablissementQueryHandler

  beforeEach(async () => {
    await getDatabase().cleanPG()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getConseillersEtablissement = new GetConseillersEtablissementQueryHandler(
      conseillerAuthorizer
    )
  })

  describe('handle', () => {
    let idAgence: string
    let idFakeAgence: string

    let conseillerAgence1,
      conseillerAgence2,
      conseillerAutreAgence: AsSql<ConseillerDto>

    beforeEach(async () => {
      // Given
      idAgence = '1'
      idFakeAgence = 'wrong-id'

      conseillerAgence1 = unConseillerDto({
        id: '1',
        prenom: 'toto',
        nom: 'tata',
        structure: Structure.MILO,
        idAgence: idAgence,
        email: 'toto@gmail.com'
      })
      conseillerAgence2 = unConseillerDto({
        id: '2',
        prenom: 'Albert',
        nom: 'Reportaire',
        structure: Structure.MILO,
        idAgence: idAgence,
        email: 'albert@gmail.com'
      })
      conseillerAutreAgence = unConseillerDto({
        id: '3',
        prenom: 'M',
        nom: 'LeMaudit',
        structure: Structure.MILO,
        idAgence: idFakeAgence,
        email: 'm@gmail.com'
      })

      await AgenceSqlModel.create(
        uneAgenceDto({
          id: idAgence,
          nomAgence: 'youpi'
        })
      )

      await AgenceSqlModel.create(
        uneAgenceDto({
          id: idFakeAgence,
          nomAgence: 'boarf'
        })
      )

      await ConseillerSqlModel.creer(conseillerAgence1)
      await ConseillerSqlModel.creer(conseillerAgence2)
      await ConseillerSqlModel.creer(conseillerAutreAgence)
    })

    it('retourne les conseillers d’une agence quand ils existent', async () => {
      // When
      const actual = await getConseillersEtablissement.handle({
        idAgence: '1'
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          detailConseillerQueryModel({
            id: '1',
            firstName: 'toto',
            lastName: 'tata',
            agence: {
              id: '1',
              nom: 'youpi'
            },
            email: 'toto@gmail.com'
          }),
          detailConseillerQueryModel({
            id: '2',
            firstName: 'Albert',
            lastName: 'Reportaire',
            agence: {
              id: '1',
              nom: 'youpi'
            },
            email: 'albert@gmail.com'
          })
        ])
      )
    })

    it('retourne une liste vide quand aucun conseiller existe avec cet id d’agence', async () => {
      const actual = await getConseillersEtablissement.handle({
        idAgence: 'idInexistant'
      })

      expect(actual).to.deep.equal(success([]))
    })
  })

  describe('authorize', () => {
    it('interdit le conseiller non superviseur', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ roles: [] })
      const query: GetConseillersEtablissementQuery = {
        idAgence: '1'
      }

      // When
      await getConseillersEtablissement.authorize(query, utilisateur)

      // Then
      expect(
        conseillerAuthorizer.autoriserConseillerSuperviseurDeLEtablissement
      ).to.have.been.calledWith(utilisateur, query.idAgence)
    })
  })
})

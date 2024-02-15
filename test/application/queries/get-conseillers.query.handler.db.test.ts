import { ConseillerAuthorizer } from '../../../src/application/authorizers/conseiller-authorizer'
import {
  GetConseillersQuery,
  GetConseillersQueryHandler
} from '../../../src/application/queries/get-conseillers.query.handler.db'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
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
import { testConfig } from '../../utils/module-for-testing'

describe('GetConseillersQueryHandler', () => {
  let databaseForTesting: DatabaseForTesting
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getConseillersQueryHandler: GetConseillersQueryHandler

  before(() => {
    databaseForTesting = getDatabase()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)

    getConseillersQueryHandler = new GetConseillersQueryHandler(
      conseillerAuthorizer,
      databaseForTesting.sequelize,
      testConfig()
    )
  })
  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  describe('handle', () => {
    let conseillerDto: AsSql<ConseillerDto>

    beforeEach(async () => {
      // Given
      conseillerDto = unConseillerDto()
      await ConseillerSqlModel.bulkCreate([
        conseillerDto,
        unConseillerDto({
          id: 'autre-conseiller',
          prenom: 'toto',
          nom: 'tata',
          email: 'conseiller@passemploi.com'
        }),
        unConseillerDto({
          id: 'autre-conseiller-pe',
          prenom: 'toto',
          nom: 'tata',
          email: 'nils.tavernier@pole-emploi.fr'
        })
      ])
    })

    describe("quand aucune structure différente n'est demandée", () => {
      it('retourne le conseiller seul quand le mail est exacte', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.PASS_EMPLOI
        })
        // When
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'nils.tavernier@passemploi.com'
          },
          utilisateur
        )

        expect(actual).to.deep.equal(
          success([
            {
              id: conseillerDto.id,
              nom: conseillerDto.nom,
              prenom: conseillerDto.prenom,
              email: conseillerDto.email
            }
          ])
        )
      })
      it('retourne le conseiller seul quand le mail est exact PE France Travail', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.PASS_EMPLOI
        })
        // When
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'nils.tavernier@francetravail.fr'
          },
          utilisateur
        )

        expect(actual).to.deep.equal(
          success([
            {
              id: 'autre-conseiller-pe',
              prenom: 'toto',
              nom: 'tata',
              email: 'nils.tavernier@pole-emploi.fr'
            }
          ])
        )
      })

      it('retourne plusieurs conseillers quand le conseiller existe avec email approchant', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.PASS_EMPLOI
        })
        // When
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'nIlS.tAverNnier@passemploi.fr'
          },
          utilisateur
        )

        expect(actual).to.deep.equal(
          success([
            {
              id: conseillerDto.id,
              prenom: conseillerDto.prenom,
              nom: conseillerDto.nom,
              email: conseillerDto.email
            },
            {
              id: 'autre-conseiller-pe',
              prenom: 'toto',
              nom: 'tata',
              email: 'nils.tavernier@pole-emploi.fr'
            },
            {
              id: 'autre-conseiller',
              prenom: 'toto',
              nom: 'tata',
              email: 'conseiller@passemploi.com'
            }
          ])
        )
      })

      it("retourne un échec quand le conseiller n'existe pas avec cette structure", async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.MILO
        })
        // When
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'cOnSeIlLeR@eMaIl.fR'
          },
          utilisateur
        )

        expect(actual).to.deep.equal(success([]))
      })

      it('retourne les conseillers classés par pertinence', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.PASS_EMPLOI
        })

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
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'du'
          },
          utilisateur
        )

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

    describe('quand une structure différente est demandée', () => {
      it("failure quand le conseiller n'est pas SUPERVISEUR_PE_BRSA", async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.POLE_EMPLOI
        })
        // When
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'nils.tavernier@passemploi.com',
            structureDifferenteRecherchee: Core.Structure.POLE_EMPLOI_BRSA
          },
          utilisateur
        )

        expect(actual).to.deep.equal(failure(new DroitsInsuffisants()))
      })
      it('retourne les conseillers de la structure demandée uniquement quand le conseiller est SUPERVISEUR_PE_BRSA', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          structure: Core.Structure.POLE_EMPLOI,
          roles: [Authentification.Role.SUPERVISEUR_PE_BRSA]
        })
        await ConseillerSqlModel.bulkCreate([
          unConseillerDto({
            id: '2',
            prenom: 'Jean',
            nom: 'Dupont',
            structure: Core.Structure.POLE_EMPLOI
          }),
          unConseillerDto({
            id: '3',
            prenom: 'Bruno',
            nom: 'Dumont',
            structure: Core.Structure.POLE_EMPLOI
          }),
          unConseillerDto({
            id: '4',
            prenom: 'Dudu',
            nom: 'Labiche',
            structure: Core.Structure.POLE_EMPLOI_BRSA
          })
        ])

        // When
        const actual = await getConseillersQueryHandler.handle(
          {
            recherche: 'du',
            structureDifferenteRecherchee: Core.Structure.POLE_EMPLOI_BRSA
          },
          utilisateur
        )

        // Then
        expect(actual).to.deep.equal(
          success([
            {
              id: '4',
              prenom: 'Dudu',
              nom: 'Labiche',
              email: 'nils.tavernier@passemploi.com'
            }
          ])
        )
      })
    })
  })

  describe('authorize', () => {
    it('interdit le conseiller non superviseur', async () => {
      // Given
      const utilisateur = unUtilisateurConseiller({ roles: [] })
      const query: GetConseillersQuery = {
        recherche: 'whatever@email.fr'
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

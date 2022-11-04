import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { GetJeunesByEtablissementQueryHandler } from 'src/application/queries/get-jeunes-by-conseiller.query.handler.db'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'

import { unDetailJeuneConseillerQueryModel } from 'test/fixtures/query-models/jeunes.query-model.fixtures'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { uneAgenceMiloDTO } from '../../fixtures/sql-models/agence.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'

describe('GetJeunesByEtablissementQueryHandler', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let conseillersRepository: StubbedType<Conseiller.Repository>
  let getJeunesByEtablissementQueryHandler: GetJeunesByEtablissementQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    conseillersRepository = stubInterface(sandbox)

    getJeunesByEtablissementQueryHandler =
      new GetJeunesByEtablissementQueryHandler(
        databaseForTesting.sequelize,
        conseillersRepository
      )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idEtablissement = 'etablissement'

    it("retourne les jeunes d'un établissement", async () => {
      // Given
      await AgenceSqlModel.create(uneAgenceMiloDTO({ id: idEtablissement }))
      await AgenceSqlModel.create(
        uneAgenceMiloDTO({ id: 'autre-etablissement' })
      )

      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '1', idAgence: idEtablissement })
      )
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller: '1' }))
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '2', idAgence: idEtablissement })
      )
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller: '2' }))
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: '3', idAgence: 'autre-etablissement' })
      )
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller: '3' }))

      // When
      const actual = await getJeunesByEtablissementQueryHandler.handle({
        idEtablissement
      })

      // Then
      expect(actual).to.deep.equal(
        success([
          unDetailJeuneConseillerQueryModel({ id: 'jeune-conseiller-1' }),
          unDetailJeuneConseillerQueryModel({ id: 'jeune-conseiller-2' })
        ])
      )
    })
    it("retourne tableau vide quand l’établissement n'existe pas", async () => {
      const actual = await getJeunesByEtablissementQueryHandler.handle({
        idConseiller: 'id-inexistant'
      })

      expect(actual).to.deep.equal(success([]))
    })
  })

  describe('authorize', () => {
    const query = {
      idConseiller: 'idConseiller'
    }

    describe("quand le conseiller concerné est l'utilisateur", () => {
      it('autorise le conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: query.idConseiller })
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller
          })
        )
        // When
        const result = await getJeunesByEtablissementQueryHandler.authorize(
          query,
          utilisateur
        )
        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe("quand le conseiller concerné n'existe pas", () => {
      it('renvoie un échec NonTrouve', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller()
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id
          })
        )

        // When
        const result = await getJeunesByEtablissementQueryHandler.authorize(
          { idConseiller: 'un-autre-id' },
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur n'est pas le conseiller concerné", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: 'au-autre-id' })
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id
          })
        )
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller
          })
        )

        // When
        const result = await getJeunesByEtablissementQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })

    describe("quand l'utilisateur est un superviseur", () => {
      it('retourne les jeunes du conseiller', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.POLE_EMPLOI,
          roles: [Authentification.Role.SUPERVISEUR]
        })
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id,
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller,
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const result = await getJeunesByEtablissementQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })

    describe("quand l'utilisateur est un superviseur d'une autre structure", () => {
      it('renvoie un échec DroitsInsuffisants', async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({
          id: 'un-autre-id',
          structure: Core.Structure.MILO,
          roles: [Authentification.Role.SUPERVISEUR]
        })
        conseillersRepository.get.withArgs(utilisateur.id).resolves(
          unConseiller({
            id: utilisateur.id,
            structure: Core.Structure.POLE_EMPLOI
          })
        )
        conseillersRepository.get.withArgs(query.idConseiller).resolves(
          unConseiller({
            id: query.idConseiller,
            structure: Core.Structure.POLE_EMPLOI
          })
        )

        // When
        const result = await getJeunesByEtablissementQueryHandler.authorize(
          query,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})

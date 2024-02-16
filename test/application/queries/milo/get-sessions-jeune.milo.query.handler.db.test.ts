import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from 'src/application/authorizers/jeune-authorizer'
import {
  GetSessionsJeuneMiloQuery,
  GetSessionsJeuneMiloQueryHandler
} from 'src/application/queries/milo/get-sessions-jeune.milo.query.handler.db'
import { GetSessionsJeuneMiloQueryGetter } from 'src/application/queries/query-getters/milo/get-sessions-jeune.milo.query.getter.db'
import {
  JeuneMiloSansIdDossier,
  NonTrouveError
} from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from 'test/fixtures/authentification.fixture'
import { uneSessionJeuneMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { testConfig } from 'test/utils/module-for-testing'
import { ConseillerInterStructureMiloAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-structure-milo-authorizer'
import { Core } from '../../../../src/domain/core'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { getDatabase } from '../../../utils/database-for-testing'

describe('GetSessionsJeuneMiloQueryHandler', () => {
  const query: GetSessionsJeuneMiloQuery = {
    idJeune: 'idJeune',
    accessToken: 'token'
  }
  const utilisateur = unUtilisateurJeune()

  let getSessionsQueryHandler: GetSessionsJeuneMiloQueryHandler
  let getSessionsQueryGetter: StubbedClass<GetSessionsJeuneMiloQueryGetter>
  let conseillerAuthorizer: StubbedClass<ConseillerInterStructureMiloAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    await ConseillerSqlModel.creer(unConseillerDto())

    getSessionsQueryGetter = stubClass(GetSessionsJeuneMiloQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    conseillerAuthorizer = stubClass(ConseillerInterStructureMiloAuthorizer)

    getSessionsQueryHandler = new GetSessionsJeuneMiloQueryHandler(
      getSessionsQueryGetter,
      jeuneAuthorizer,
      conseillerAuthorizer,
      testConfig()
    )
  })

  after(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un jeune Milo', () => {
      // When
      getSessionsQueryHandler.authorize(query, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idJeune',
        utilisateur,
        true
      )
    })

    it('autorise le conseiller d’un jeune Milo', () => {
      // Given
      const utilisateurConseiller = unUtilisateurConseiller()

      // When
      getSessionsQueryHandler.authorize(query, utilisateurConseiller)

      // Then
      expect(
        conseillerAuthorizer.autoriserConseillerAvecLaMemeStructureQueLeJeune
      ).to.have.been.calledWithExactly('idJeune', utilisateurConseiller)
    })
  })

  describe('handle', () => {
    describe("quand le jeune n'existe pas", () => {
      it('renvoie une failure ', async () => {
        // When
        const result = await getSessionsQueryHandler.handle(query, utilisateur)

        // Then
        expect(result).to.deep.equal(
          failure(new NonTrouveError('Jeune', query.idJeune))
        )
      })
    })

    describe('quand le jeune existe sans ID partenaire', () => {
      it('renvoie une failure ', async () => {
        // Given
        await JeuneSqlModel.creer({
          ...unJeuneDto({
            id: 'idJeune',
            structure: Core.Structure.MILO,
            instanceId: 'instanceId'
          }),
          idPartenaire: null
        })

        // When
        const result = await getSessionsQueryHandler.handle(query, utilisateur)

        // Then
        expect(result).to.deep.equal(
          failure(new JeuneMiloSansIdDossier(query.idJeune))
        )
      })
    })

    describe('quand le query getter renvoie une failure', () => {
      it('renvoie la même failure ', async () => {
        // Given
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: 'idJeune',
            idPartenaire: 'idDossier',
            structure: Core.Structure.MILO,
            instanceId: 'instanceId'
          })
        )

        const uneFailure = failure(new NonTrouveError('Jeune', query.idJeune))
        getSessionsQueryGetter.handle
          .withArgs('idJeune', 'idDossier', 'token')
          .resolves(uneFailure)

        // When
        const result = await getSessionsQueryHandler.handle(query, utilisateur)

        // Then
        expect(result).to.deep.equal(uneFailure)
      })
    })

    describe('quand le query getter renvoie un success', () => {
      describe('quand on ne passe pas de filtre en query param', () => {
        it('renvoie le même success', async () => {
          // Given
          await JeuneSqlModel.creer(
            unJeuneDto({
              id: 'idJeune',
              idPartenaire: 'idDossier',
              structure: Core.Structure.MILO,
              instanceId: 'instanceId'
            })
          )

          const unSuccess = success([uneSessionJeuneMiloQueryModel()])
          getSessionsQueryGetter.handle
            .withArgs('idJeune', 'idDossier', 'token')
            .resolves(unSuccess)

          // When
          const result = await getSessionsQueryHandler.handle(
            query,
            utilisateur
          )

          // Then
          expect(result).to.deep.equal(unSuccess)
        })
      })

      describe('quand on passe un filtre pour ne récupérer que les sessions ou le jeune est inscrit', () => {
        it('renvoie le même success', async () => {
          const queryAvecFiltre = {
            idJeune: 'idJeune',
            accessToken: 'token',
            filtrerEstInscrit: true
          }

          // Given
          await JeuneSqlModel.creer(
            unJeuneDto({
              id: 'idJeune',
              idPartenaire: 'idDossier',
              structure: Core.Structure.MILO,
              instanceId: 'instanceId'
            })
          )

          const unSuccess = success([
            uneSessionJeuneMiloQueryModel({
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            })
          ])
          getSessionsQueryGetter.handle
            .withArgs('idJeune', 'idDossier', 'token', {
              periode: {
                debut: undefined,
                fin: undefined
              },
              filtrerEstInscrit: true,
              pourConseiller: false
            })
            .resolves(unSuccess)

          // When
          const result = await getSessionsQueryHandler.handle(
            queryAvecFiltre,
            utilisateur
          )

          // Then
          expect(result).to.deep.equal(unSuccess)
        })
      })

      describe('permet au conseiller de récupérer les sessions du jeune', () => {
        it('renvoie le même success', async () => {
          const queryAvecFiltre = {
            idJeune: 'idJeune',
            accessToken: 'token'
          }

          // Given
          await JeuneSqlModel.creer(
            unJeuneDto({
              id: 'idJeune',
              idPartenaire: 'idDossier',
              structure: Core.Structure.MILO,
              instanceId: 'instanceId'
            })
          )

          const unSuccess = success([
            uneSessionJeuneMiloQueryModel({
              inscription: SessionMilo.Inscription.Statut.INSCRIT
            })
          ])
          getSessionsQueryGetter.handle
            .withArgs('idJeune', 'idDossier', 'token', {
              periode: {
                debut: undefined,
                fin: undefined
              },
              filtrerEstInscrit: undefined,
              pourConseiller: true
            })
            .resolves(unSuccess)

          // When
          const result = await getSessionsQueryHandler.handle(
            queryAvecFiltre,
            unUtilisateurConseiller()
          )

          // Then
          expect(result).to.deep.equal(unSuccess)
        })
      })
    })
  })
})

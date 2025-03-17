import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import {
  GetSessionsConseillerMiloQuery,
  GetSessionsConseillerMiloQueryHandler
} from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, Success, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo.db'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { PlanificateurService } from 'src/domain/planificateur'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { DateService } from 'src/utils/date-service'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import { unDetailSessionConseillerDto } from 'test/fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { getDatabase } from 'test/utils/database-for-testing'
import { testConfig } from '../../../utils/module-for-testing'

describe('GetSessionsConseillerMiloQueryHandler', () => {
  const maintenantEn2023 = DateTime.local(2023)

  let getSessionsQueryHandler: GetSessionsConseillerMiloQueryHandler
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let miloClient: StubbedClass<MiloClient>
  let oidcClient: StubbedClass<OidcClient>
  let dateService: StubbedClass<DateService>
  let planificateurService: StubbedClass<PlanificateurService>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    miloClient = stubClass(MiloClient)
    oidcClient = stubClass(OidcClient)
    dateService = stubClass(DateService)
    planificateurService = stubClass(PlanificateurService)

    dateService.now.returns(maintenantEn2023)

    getSessionsQueryHandler = new GetSessionsConseillerMiloQueryHandler(
      testConfig(),
      conseillerRepository,
      oidcClient,
      miloClient,
      dateService,
      planificateurService,
      conseillerAuthorizer
    )
  })

  afterEach(async () => {
    await getDatabase().cleanPG()
  })

  after(() => {
    sandbox.restore()
  })

  describe('authorize', () => {
    it('autorise un conseiller Milo', () => {
      // When
      const query: GetSessionsConseillerMiloQuery = {
        idConseiller: 'idConseiller',
        accessToken: 'bearer un-token'
      }
      getSessionsQueryHandler.authorize(query, unUtilisateurConseiller())

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller(),
        true
      )
    })
  })

  describe('handle', () => {
    describe("quand le conseiller n'existe pas", () => {
      it('renvoie une failure ', async () => {
        // Given
        const query = {
          idConseiller: 'idConseiller-1',
          accessToken: 'bearer un-token'
        }
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(
            failure(new ConseillerMiloSansStructure(query.idConseiller))
          )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          failure(new ConseillerMiloSansStructure(query.idConseiller))
        )
      })
    })

    describe('quand le conseiller existe', () => {
      const conseiller = unConseillerMilo({
        structure: { id: '1', timezone: 'America/Cayenne' }
      })
      const query: GetSessionsConseillerMiloQuery = {
        idConseiller: conseiller.id,
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const idpToken = 'idpToken'

      beforeEach(async () => {
        await StructureMiloSqlModel.create({
          id: conseiller.structure.id,
          nomOfficiel: 'Structure Milo',
          timezone: conseiller.structure.timezone
        })
        await SessionMiloSqlModel.create({
          id: unDetailSessionConseillerDto.session.id,
          estVisible: true,
          idStructureMilo: conseiller.structure.id,
          dateModification: DateTime.now().toJSDate()
        })
        conseillerRepository.get.resolves(success(conseiller))
        oidcClient.exchangeTokenConseillerMilo.resolves(idpToken)
      })

      it('récupère la liste des sessions de sa structure Milo avec une visibilité', async () => {
        // Given
        miloClient.getSessionsConseillerParStructure.resolves(
          success([unDetailSessionConseillerDto])
        )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(
          oidcClient.exchangeTokenConseillerMilo
        ).to.have.been.calledOnceWithExactly('bearer un-token')
        expect(
          miloClient.getSessionsConseillerParStructure
        ).to.have.been.calledOnceWithExactly(
          idpToken,
          conseiller.structure.id,
          conseiller.structure.timezone,
          {
            periode: {
              debut: DateTime.fromISO('2023-04-12T00:00:00Z'),
              fin: DateTime.fromISO('2023-04-13T00:00:00Z')
            }
          }
        )
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionConseillerMiloQueryModel,
              nombreMaxParticipants: 10,
              nombreParticipants: 0,
              estVisible: true
            }
          ])
        )
      })

      it('affecte une visibilité à false si la session n’existe pas en base', async () => {
        // Given
        miloClient.getSessionsConseillerParStructure.resolves(
          success([
            {
              ...unDetailSessionConseillerDto,
              session: { ...unDetailSessionConseillerDto.session, id: 2 }
            }
          ])
        )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionConseillerMiloQueryModel,
              id: '2',
              nombreMaxParticipants: 10,
              nombreParticipants: 0,
              estVisible: false
            }
          ])
        )
      })

      it('retourne uniquement la liste des sessions a clore lorsque le query param est a TRUE', async () => {
        // Given
        miloClient.getSessionsConseillerParStructure.resolves(
          success([unDetailSessionConseillerDto])
        )

        // When
        const result = await getSessionsQueryHandler.handle({
          ...query,
          filtrerAClore: true
        })

        // Then
        expect(
          miloClient.getSessionsConseillerParStructure
        ).to.have.been.calledWith(
          idpToken,
          conseiller.structure.id,
          conseiller.structure.timezone,
          { periode: { debut: maintenantEn2023.minus({ months: 3 }) } }
        )
        expect(result).to.deep.equal(success([]))
      })

      it('déclenche la cloture des sessions émargées', async () => {
        // Given
        miloClient.getSessionsConseillerParStructure.resolves(
          success([unDetailSessionConseillerDto])
        )

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(
          planificateurService.ajouterJobClotureSessions
        ).to.have.been.calledOnceWithExactly(
          ['1'],
          conseiller.structure.id,
          maintenantEn2023,
          sandbox.match.object
        )
        expect((result as Success<never>).data[0]).to.deep.include({
          statut: SessionMilo.Statut.CLOTUREE
        })
      })
    })
  })
})

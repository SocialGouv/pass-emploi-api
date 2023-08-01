import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-sessions-conseiller.milo.query.handler.db'
import { ConseillerMiloSansStructure } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess, success } from 'src/building-blocks/types/result'
import { ConseillerMilo } from 'src/domain/milo/conseiller.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerMilo } from 'test/fixtures/conseiller-milo.fixture'
import {
  unDetailSessionConseillerDto,
  uneListeSessionsConseillerDto,
  uneOffreDto,
  uneSessionDto
} from 'test/fixtures/milo-dto.fixture'
import { uneSessionConseillerMiloQueryModel } from 'test/fixtures/sessions.fixture'
import { expect, StubbedClass, stubClass } from 'test/utils'
import { SessionMiloSqlModel } from 'src/infrastructure/sequelize/models/session-milo.sql-model'
import { DateTime } from 'luxon'
import { StructureMiloSqlModel } from 'src/infrastructure/sequelize/models/structure-milo.sql-model'
import { getDatabase } from 'test/utils/database-for-testing'
import { DateService } from 'src/utils/date-service'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { SessionConseillerDetailDto } from 'src/infrastructure/clients/dto/milo.dto'

describe('GetSessionsConseillerMiloQueryHandler', () => {
  const maintenantEn2023 = DateTime.local(2023)
  const uneDateStrEn2022 = '2022-01-01 10:20:00'
  const uneDateStrEn2024 = '2024-01-01 10:20:00'

  let getSessionsQueryHandler: GetSessionsConseillerMiloQueryHandler
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let conseillerRepository: StubbedType<ConseillerMilo.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let dateService: StubbedClass<DateService>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    conseillerRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenantEn2023)
    getSessionsQueryHandler = new GetSessionsConseillerMiloQueryHandler(
      miloClient,
      conseillerRepository,
      conseillerAuthorizer,
      keycloakClient,
      dateService
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
      const query = {
        idConseiller: 'idConseiller',
        token: 'bearer un-token'
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
          token: 'bearer un-token'
        }
        const idpToken = 'idpToken'
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.token)
          .resolves(idpToken)
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
      const query = {
        idConseiller: 'idConseiller-1',
        token: 'bearer un-token',
        dateDebut: DateTime.fromISO('2023-04-12T00:00:00Z'),
        dateFin: DateTime.fromISO('2023-04-13T00:00:00Z')
      }
      const idpToken = 'idpToken'
      const conseiller = unConseillerMilo({
        structure: { id: '1', timezone: 'America/Cayenne' }
      })

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
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(query.token)
          .resolves(idpToken)
        conseillerRepository.get
          .withArgs(query.idConseiller)
          .resolves(success(conseiller))
      })

      it('récupère la liste des sessions de sa structure Milo avec une visibilité', async () => {
        // Given
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            query.dateDebut,
            query.dateFin
          )
          .resolves(success(uneListeSessionsConseillerDto))

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([{ ...uneSessionConseillerMiloQueryModel, estVisible: true }])
        )
      })

      it('affecte une visibilité à false si la session n’existe pas en base', async () => {
        // Given
        retourneUnDetailSessionDto({
          ...unDetailSessionConseillerDto,
          session: { ...unDetailSessionConseillerDto.session, id: 2 }
        })

        // When
        const result = await getSessionsQueryHandler.handle(query)

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionConseillerMiloQueryModel,
              id: '2',
              estVisible: false
            }
          ])
        )
      })

      describe('affecte le statut ', () => {
        it('CLOTUREE si la session a une de date de clôture', async () => {
          // Given
          retourneUnDetailSessionDto(unDetailSessionConseillerDto)

          await SessionMiloSqlModel.update(
            { dateCloture: DateTime.now().toJSDate() },
            { where: { id: unDetailSessionConseillerDto.session.id } }
          )

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data[0].statut).to.deep.equal(
              SessionMilo.Statut.CLOTUREE
            )
          }
        })

        it('A_VENIR si elle n’est pas encore passée et qu’elle n’a pas de date de clôture', async () => {
          // Given
          retourneUnDetailSessionDto({
            session: { ...uneSessionDto, dateHeureFin: uneDateStrEn2024 },
            offre: uneOffreDto
          })

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data[0].statut).to.deep.equal(
              SessionMilo.Statut.A_VENIR
            )
          }
        })

        it('A_CLOTURER si elle est passée et qu’elle n’a pas de date de clôture', async () => {
          // Given
          retourneUnDetailSessionDto({
            session: { ...uneSessionDto, dateHeureFin: uneDateStrEn2022 },
            offre: uneOffreDto
          })

          // When
          const result = await getSessionsQueryHandler.handle(query)

          // Then
          expect(isSuccess(result)).to.be.true()
          if (isSuccess(result)) {
            expect(result.data[0].statut).to.deep.equal(
              SessionMilo.Statut.A_CLOTURER
            )
          }
        })
      })

      function retourneUnDetailSessionDto(
        unDetailSession: SessionConseillerDetailDto
      ): void {
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            query.dateDebut,
            query.dateFin
          )
          .resolves(
            success({
              page: 1,
              nbSessions: 1,
              sessions: [unDetailSession]
            })
          )
      }
    })
  })
})

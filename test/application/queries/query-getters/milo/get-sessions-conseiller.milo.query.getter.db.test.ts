import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { isSuccess, success } from 'src/building-blocks/types/result'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
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
import {
  DATE_DEBUT_SESSIONS_A_CLORE,
  GetSessionsConseillerMiloQueryGetter
} from '../../../../../src/application/queries/query-getters/milo/get-sessions-conseiller.milo.query.getter.db'

describe('GetSessionsConseillerMiloQueryHandler', () => {
  const maintenantEn2023 = DateTime.local(2023)
  const uneDateStrEn2022 = '2022-01-01 10:20:00'
  const uneDateStrEn2024 = '2024-01-01 10:20:00'

  let getSessionsQueryGetter: GetSessionsConseillerMiloQueryGetter
  let miloClient: StubbedClass<MiloClient>
  let keycloakClient: StubbedClass<KeycloakClient>
  let dateService: StubbedClass<DateService>
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
  })

  beforeEach(async () => {
    miloClient = stubClass(MiloClient)
    keycloakClient = stubClass(KeycloakClient)
    dateService = stubClass(DateService)
    dateService.now.returns(maintenantEn2023)
    getSessionsQueryGetter = new GetSessionsConseillerMiloQueryGetter(
      keycloakClient,
      miloClient,
      dateService
    )
  })

  afterEach(async () => {
    await getDatabase().cleanPG()
  })

  after(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    describe('récupère la liste des session de la structure du conseiller MILO', () => {
      const query = {
        accessToken: 'bearer un-token',
        idStructureMilo: 'idStructure-1',
        timezoneStructure: 'America/Cayenne',
        options: {
          periode: {
            debut: DateTime.fromISO('2023-04-12T00:00:00Z'),
            fin: DateTime.fromISO('2023-04-13T00:00:00Z')
          },
          filtreAClore: true
        }
      }
      const idpToken = 'idpToken'
      const conseiller = unConseillerMilo({
        structure: {
          id: query.idStructureMilo,
          timezone: query.timezoneStructure
        }
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
          .withArgs(query.accessToken)
          .resolves(idpToken)
      })

      it('récupère la liste des sessions de sa structure Milo avec une visibilité', async () => {
        // Given
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: query.options.periode.debut,
                dateFin: query.options.periode.fin
              }
            }
          )
          .resolves(success(uneListeSessionsConseillerDto))

        // When
        const result = await getSessionsQueryGetter.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {
            periode: {
              debut: query.options.periode.debut,
              fin: query.options.periode.fin
            }
          }
        )

        // Then
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
        retourneUnDetailSessionDto({
          ...unDetailSessionConseillerDto,
          session: { ...unDetailSessionConseillerDto.session, id: 2 }
        })

        // When
        const result = await getSessionsQueryGetter.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {
            periode: {
              debut: query.options.periode.debut,
              fin: query.options.periode.fin
            }
          }
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              ...uneSessionConseillerMiloQueryModel,

              nombreMaxParticipants: 10,
              nombreParticipants: 0,
              id: '2',
              estVisible: false
            }
          ])
        )
      })

      it('retourne uniquement la liste des sessions a clore lorsque le query param est a TRUE', async () => {
        // Given
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: DateTime.fromISO(DATE_DEBUT_SESSIONS_A_CLORE),
                dateFin: undefined
              }
            }
          )
          .resolves(success(uneListeSessionsConseillerDto))

        // When
        const result = await getSessionsQueryGetter.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {
            periode: {
              debut: undefined,
              fin: undefined
            },
            filtrerAClore: query.options.filtreAClore
          }
        )

        // Then
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
        expect(miloClient.getSessionsConseiller).to.have.been.calledWith(
          idpToken,
          conseiller.structure.id,
          conseiller.structure.timezone,
          {
            periode: {
              dateDebut: DateTime.fromISO(DATE_DEBUT_SESSIONS_A_CLORE),
              dateFin: undefined
            }
          }
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
          const result = await getSessionsQueryGetter.handle(
            query.accessToken,
            query.idStructureMilo,
            query.timezoneStructure,
            {
              periode: {
                debut: query.options.periode.debut,
                fin: query.options.periode.fin
              }
            }
          )

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
          const result = await getSessionsQueryGetter.handle(
            query.accessToken,
            query.idStructureMilo,
            query.timezoneStructure,
            {
              periode: {
                debut: query.options.periode.debut,
                fin: query.options.periode.fin
              }
            }
          )

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
          const result = await getSessionsQueryGetter.handle(
            query.accessToken,
            query.idStructureMilo,
            query.timezoneStructure,
            {
              periode: {
                debut: query.options.periode.debut,
                fin: query.options.periode.fin
              }
            }
          )

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
            {
              periode: {
                dateDebut: query.options.periode.debut,
                dateFin: query.options.periode.fin
              }
            }
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

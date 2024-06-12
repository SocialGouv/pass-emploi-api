import { describe } from 'mocha'
import { DateTime } from 'luxon'
import { expect, StubbedClass, stubClass } from '../../../../../utils'
import { MiloClient } from '../../../../../../src/infrastructure/clients/milo-client'
import { KeycloakClient } from '../../../../../../src/infrastructure/clients/keycloak-client.db'
import { DateService } from '../../../../../../src/utils/date-service'
import { createSandbox, SinonSandbox } from 'sinon'
import { getDatabase } from '../../../../../utils/database-for-testing'
import { unConseillerMilo } from '../../../../../fixtures/conseiller-milo.fixture'
import { StructureMiloSqlModel } from '../../../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { SessionMiloSqlModel } from '../../../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import {
  unDetailSessionConseillerDto,
  uneListeSessionsConseillerDto,
  uneOffreDto,
  uneSessionDto
} from '../../../../../fixtures/milo-dto.fixture'
import {
  isSuccess,
  success
} from '../../../../../../src/building-blocks/types/result'
import { uneSessionConseillerMiloQueryModel } from '../../../../../fixtures/sessions.fixture'
import { SessionMilo } from '../../../../../../src/domain/milo/session.milo'
import { SessionConseillerDetailDto } from '../../../../../../src/infrastructure/clients/dto/milo.dto'
import { GetSessionsConseillerMiloV2QueryGetter } from '../../../../../../src/application/queries/query-getters/milo/v2/get-sessions-conseiller.milo.v2.query.getter.db'

describe('GetSessionsConseillerMiloV2QueryHandler', () => {
  const maintenantEn2023 = DateTime.local(2023)
  const uneDateStrEn2022 = '2022-01-01 10:20:00'
  const uneDateStrEn2024 = '2024-01-01 10:20:00'

  let getSessionsQueryGetterV2: GetSessionsConseillerMiloV2QueryGetter
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
    getSessionsQueryGetterV2 = new GetSessionsConseillerMiloV2QueryGetter(
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
    describe('récupère la liste des sessions de la structure du conseiller MILO', () => {
      const query = {
        accessToken: 'bearer un-token',
        idStructureMilo: 'idStructure-1',
        timezoneStructure: 'America/Cayenne',
        options: {
          filtreAClore: true
        }
      }
      const dateDebut = DateTime.fromISO('2023-08-01')

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
                dateDebut: dateDebut
              }
            }
          )
          .resolves(success(uneListeSessionsConseillerDto))

        // When
        const result = await getSessionsQueryGetterV2.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {}
        )

        // Then
        expect(result).to.deep.equal(
          success([{ ...uneSessionConseillerMiloQueryModel, estVisible: true }])
        )
      })

      it('récupère et retourne toutes les sessions de la structure du conseiller', async () => {
        // Given
        const NB_SESSIONS_STRUCTURE = 151
        const listeSessionsConseillerDto1: SessionConseillerDetailDto[] = []
        const listeSessionsConseillerDto2: SessionConseillerDetailDto[] = []

        for (let i = 1; i <= 150; i++) {
          listeSessionsConseillerDto1.push({
            ...unDetailSessionConseillerDto,
            session: { ...uneSessionDto, id: i }
          })
        }

        listeSessionsConseillerDto2.push({
          ...unDetailSessionConseillerDto,
          session: { ...uneSessionDto, id: 151 }
        })

        const resultListeSessionsConseillerDto1 = {
          page: 1,
          nbSessions: NB_SESSIONS_STRUCTURE,
          sessions: [...listeSessionsConseillerDto1]
        }

        const resultListeSessionsConseillerDto2 = {
          page: 2,
          nbSessions: NB_SESSIONS_STRUCTURE,
          sessions: [...listeSessionsConseillerDto2]
        }

        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: dateDebut
              }
            }
          )
          .resolves(success(resultListeSessionsConseillerDto1))

        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: dateDebut
              },
              page: 2
            }
          )
          .resolves(success(resultListeSessionsConseillerDto2))

        // When
        const result = await getSessionsQueryGetterV2.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {}
        )

        // Then
        expect(miloClient.getSessionsConseiller).to.have.been.callCount(2)
        if (result._isSuccess) {
          expect(result.data.length).to.be.equal(NB_SESSIONS_STRUCTURE)
        }
      })

      it('récupère et retourne toutes les sessions A CLORE de la structure du conseiller', async () => {
        // Given
        const NB_SESSIONS_STRUCTURE = 300
        const NB_SESSIONS_STRUCTURE_A_CLORE = 150
        const listeSessionsConseillerDto1: SessionConseillerDetailDto[] = []
        const listeSessionsConseillerDto2: SessionConseillerDetailDto[] = []

        for (let i = 1; i < 151; i++) {
          listeSessionsConseillerDto1.push({
            ...unDetailSessionConseillerDto,
            session: {
              ...uneSessionDto,
              id: i,
              dateHeureDebut: '2024-04-06 10:20:00',
              dateHeureFin: '2024-04-08 10:20:00'
            }
          })
        }

        for (let i = 151; i < 301; i++) {
          listeSessionsConseillerDto2.push({
            ...unDetailSessionConseillerDto,
            session: { ...uneSessionDto, id: i }
          })
        }

        const resultListeSessionsConseillerDto1 = {
          page: 1,
          nbSessions: NB_SESSIONS_STRUCTURE,
          sessions: [...listeSessionsConseillerDto1]
        }

        const resultListeSessionsConseillerDto2 = {
          page: 2,
          nbSessions: NB_SESSIONS_STRUCTURE,
          sessions: [...listeSessionsConseillerDto2]
        }

        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: dateDebut
              }
            }
          )
          .resolves(success(resultListeSessionsConseillerDto1))

        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: dateDebut
              },
              page: 2
            }
          )
          .resolves(success(resultListeSessionsConseillerDto2))

        // When
        const result = await getSessionsQueryGetterV2.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {
            filtrerAClore: true
          }
        )

        // Then
        expect(miloClient.getSessionsConseiller).to.have.been.callCount(2)
        if (result._isSuccess) {
          expect(result.data.length).to.be.equal(NB_SESSIONS_STRUCTURE_A_CLORE)
        }
      })

      it('affecte une visibilité à false si la session n’existe pas en base', async () => {
        // Given
        retourneUnDetailSessionDto({
          ...unDetailSessionConseillerDto,
          session: { ...unDetailSessionConseillerDto.session, id: 2 }
        })

        // When
        const result = await getSessionsQueryGetterV2.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {}
        )

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

      it('retourne uniquement la liste des sessions a clore lorsque le query param est a TRUE', async () => {
        // Given
        miloClient.getSessionsConseiller
          .withArgs(
            idpToken,
            conseiller.structure.id,
            conseiller.structure.timezone,
            {
              periode: {
                dateDebut: dateDebut
              }
            }
          )
          .resolves(success(uneListeSessionsConseillerDto))

        // When
        const result = await getSessionsQueryGetterV2.handle(
          query.accessToken,
          query.idStructureMilo,
          query.timezoneStructure,
          {
            filtrerAClore: query.options.filtreAClore
          }
        )

        // Then
        expect(result).to.deep.equal(
          success([{ ...uneSessionConseillerMiloQueryModel, estVisible: true }])
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
          const result = await getSessionsQueryGetterV2.handle(
            query.accessToken,
            query.idStructureMilo,
            query.timezoneStructure,
            {}
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
          const result = await getSessionsQueryGetterV2.handle(
            query.accessToken,
            query.idStructureMilo,
            query.timezoneStructure,
            {}
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
          const result = await getSessionsQueryGetterV2.handle(
            query.accessToken,
            query.idStructureMilo,
            query.timezoneStructure,
            {}
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
                dateDebut: dateDebut
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

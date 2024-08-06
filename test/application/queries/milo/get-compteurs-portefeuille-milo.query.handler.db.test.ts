import { DateTime } from 'luxon'
import { describe } from 'mocha'
import { createSandbox, SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetAgendaSessionsConseillerMiloQueryHandler } from 'src/application/queries/milo/get-agenda-sessions-conseiller.milo.query.handler.db'
import { GetCompteursBeneficiaireMiloQueryHandler } from 'src/application/queries/milo/get-compteurs-portefeuille-milo.query.handler.db'
import { success } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Core } from 'src/domain/core'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client.db'
import { MiloClient } from 'src/infrastructure/clients/milo-client'
import { ActionSqlModel } from 'src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unAgendaConseillerMiloSessionListItemQueryModel } from 'test/fixtures/sessions.fixture'
import { uneActionDto } from 'test/fixtures/sql-models/action.sql-model'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from 'test/fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'
import Structure = Core.Structure
import Statut = SessionMilo.Inscription.Statut

describe('GetCompteursPortefeuilleMiloQueryHandler', () => {
  let getCompteursPortefeuilleMiloQueryHandler: GetCompteursBeneficiaireMiloQueryHandler
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>
  let getAgendaSessionsConseillerMiloQueryHandler: StubbedClass<GetAgendaSessionsConseillerMiloQueryHandler>
  let keycloakClient: StubbedClass<KeycloakClient>
  let miloClient: StubbedClass<MiloClient>
  let databaseForTesting: DatabaseForTesting
  let sandbox: SinonSandbox

  before(async () => {
    sandbox = createSandbox()
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    keycloakClient = stubClass(KeycloakClient)
    miloClient = stubClass(MiloClient)
    getAgendaSessionsConseillerMiloQueryHandler = stubClass(
      GetAgendaSessionsConseillerMiloQueryHandler
    )
    getCompteursPortefeuilleMiloQueryHandler =
      new GetCompteursBeneficiaireMiloQueryHandler(
        getAgendaSessionsConseillerMiloQueryHandler,
        conseillerAuthorizer,
        keycloakClient,
        miloClient,
        databaseForTesting.sequelize
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
      //Given
      const query = {
        idConseiller: 'idConseiller',
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2024-07-01'),
        dateFin: DateTime.fromISO('2024-07-26')
      }

      // When
      getCompteursPortefeuilleMiloQueryHandler.authorize(
        query,
        unUtilisateurConseiller({ structure: Structure.MILO })
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        'idConseiller',
        unUtilisateurConseiller({ structure: Structure.MILO }),
        true
      )
    })
  })

  describe('handle', () => {
    let query: {
      idConseiller: string
      accessToken: string
      dateDebut: DateTime
      dateFin: DateTime
    }

    let user: Authentification.Utilisateur

    beforeEach(async () => {
      await ConseillerSqlModel.creer(
        unConseillerDto({ structure: Structure.MILO })
      )

      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'beneficiaire-id',
          structure: Core.Structure.MILO,
          instanceId: 'instanceId'
        })
      )

      query = {
        idConseiller: 'idConseiller',
        accessToken: 'bearer un-token',
        dateDebut: DateTime.fromISO('2024-07-01'),
        dateFin: DateTime.fromISO('2024-07-26')
      }

      keycloakClient.exchangeTokenConseillerMilo
        .withArgs(query.accessToken)
        .resolves('idpToken')

      user = unUtilisateurConseiller({ structure: Structure.MILO })
    })
    describe('quand le bénéficiaire a des actions', () => {
      it('les compte et les retourne', async () => {
        // Given
        await ActionSqlModel.creer(
          uneActionDto({
            idJeune: 'beneficiaire-id',
            dateCreation: new Date('2024-07-01'),
            idCreateur: 'beneficiaire-id'
          })
        )
        await ActionSqlModel.creer(
          uneActionDto({
            idJeune: 'beneficiaire-id',
            dateCreation: new Date('2024-07-02'),
            idCreateur: 'beneficiaire-id'
          })
        )
        await ActionSqlModel.creer(
          uneActionDto({
            idJeune: 'beneficiaire-id',
            dateCreation: new Date('2024-07-03'),
            idCreateur: 'beneficiaire-id'
          })
        )

        getAgendaSessionsConseillerMiloQueryHandler.handle.resolves(success([]))

        // When
        const result = await getCompteursPortefeuilleMiloQueryHandler.handle(
          query,
          user
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              idBeneficiaire: 'beneficiaire-id',
              actions: 3,
              rdvs: 0,
              sessions: 0
            }
          ])
        )
      })
    })

    describe('quand le bénéficiaire a des rdvs', () => {
      it('les compte et les retourne', async () => {
        // Given
        await RendezVousSqlModel.creer(
          unRendezVousDto({
            id: '196e32b5-4d66-46cb-8485-77c92bd00553',
            date: new Date('2024-07-01')
          })
        )

        await RendezVousSqlModel.creer(
          unRendezVousDto({
            id: '296e32b5-4d66-46cb-8485-77c92bd00554',
            date: new Date('2024-07-02')
          })
        )

        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: 'beneficiaire-id',
          idRendezVous: '196e32b5-4d66-46cb-8485-77c92bd00553'
        })

        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: 'beneficiaire-id',
          idRendezVous: '296e32b5-4d66-46cb-8485-77c92bd00554'
        })

        getAgendaSessionsConseillerMiloQueryHandler.handle.resolves(success([]))

        // When
        const result = await getCompteursPortefeuilleMiloQueryHandler.handle(
          query,
          user
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              idBeneficiaire: 'beneficiaire-id',
              actions: 0,
              rdvs: 2,
              sessions: 0
            }
          ])
        )
      })
    })

    describe('quand le bénéficiaire est inscrit à une session', () => {
      it('les compte et les retourne', async () => {
        // Given
        getAgendaSessionsConseillerMiloQueryHandler.handle.resolves(
          success([
            unAgendaConseillerMiloSessionListItemQueryModel({
              beneficiaires: [
                {
                  idJeune: 'beneficiaire-id',
                  nom: 'Le Pou',
                  prenom: 'Loulou',
                  statut: Statut.INSCRIT
                }
              ]
            })
          ])
        )

        // When
        const result = await getCompteursPortefeuilleMiloQueryHandler.handle(
          query,
          user
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              idBeneficiaire: 'beneficiaire-id',
              actions: 0,
              rdvs: 0,
              sessions: 1
            }
          ])
        )
      })
    })

    describe('quand le bénéficiaire a des actions, des rdvs et des sessions', () => {
      it('les compte et les retourne', async () => {
        // Given
        await RendezVousSqlModel.creer(
          unRendezVousDto({
            id: '196e32b5-4d66-46cb-8485-77c92bd00553',
            date: new Date('2024-07-01')
          })
        )

        await RendezVousSqlModel.creer(
          unRendezVousDto({
            id: '296e32b5-4d66-46cb-8485-77c92bd00554',
            date: new Date('2024-07-02')
          })
        )

        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: 'beneficiaire-id',
          idRendezVous: '196e32b5-4d66-46cb-8485-77c92bd00553'
        })

        await RendezVousJeuneAssociationSqlModel.create({
          idJeune: 'beneficiaire-id',
          idRendezVous: '296e32b5-4d66-46cb-8485-77c92bd00554'
        })

        await ActionSqlModel.creer(
          uneActionDto({
            idJeune: 'beneficiaire-id',
            dateCreation: new Date('2024-07-01'),
            idCreateur: 'beneficiaire-id'
          })
        )
        await ActionSqlModel.creer(
          uneActionDto({
            idJeune: 'beneficiaire-id',
            dateCreation: new Date('2024-07-02'),
            idCreateur: 'beneficiaire-id'
          })
        )

        getAgendaSessionsConseillerMiloQueryHandler.handle.resolves(
          success([
            unAgendaConseillerMiloSessionListItemQueryModel({
              beneficiaires: [
                {
                  idJeune: 'beneficiaire-id',
                  nom: 'Le Pou',
                  prenom: 'Loulou',
                  statut: Statut.INSCRIT
                }
              ]
            })
          ])
        )

        // When
        const result = await getCompteursPortefeuilleMiloQueryHandler.handle(
          query,
          user
        )

        // Then
        expect(result).to.deep.equal(
          success([
            {
              idBeneficiaire: 'beneficiaire-id',
              actions: 2,
              rdvs: 2,
              sessions: 1
            }
          ])
        )
      })
    })

    describe('quand le bénéficiaire n’a ni actions ni rdvs', () => {
      it('les compte et les retourne', async () => {
        // When
        getAgendaSessionsConseillerMiloQueryHandler.handle.resolves(success([]))

        const result = await getCompteursPortefeuilleMiloQueryHandler.handle(
          query,
          user
        )

        // Then
        expect(result).to.deep.equal(success([]))
      })
    })
  })
})

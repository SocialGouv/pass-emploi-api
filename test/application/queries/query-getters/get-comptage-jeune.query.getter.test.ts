import {
  GetComptageJeuneQuery,
  GetComptageJeuneQueryGetter
} from '../../../../src/application/queries/query-getters/get-comptage-jeune.query.getter'
import { success } from '../../../../src/building-blocks/types/result'
import { Action } from '../../../../src/domain/action/action'
import { Qualification } from '../../../../src/domain/action/qualification'
import { Core } from '../../../../src/domain/core'
import { CodeTypeRendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import {
  MILO_INSCRIT,
  MILO_PRESENT,
  MILO_REFUS_JEUNE
} from '../../../../src/infrastructure/clients/dto/milo.dto'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { OidcClient } from '../../../../src/infrastructure/clients/oidc-client.db'
import { ActionSqlModel } from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { uneOffreDto, uneSessionDto } from '../../../fixtures/milo-dto.fixture'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

const conseiller = unConseillerDto()
const jeune = unJeuneDto({ idConseiller: conseiller.id })

describe('GetComptageJeuneQueryGetter', () => {
  beforeEach(async () => {
    await getDatabase().cleanPG()
  })

  let oidcClient: StubbedClass<OidcClient>
  let miloClient: StubbedClass<MiloClient>
  let getComptageJeuneQueryGetter: GetComptageJeuneQueryGetter
  let databaseForTesting: DatabaseForTesting
  before(async () => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    oidcClient = stubClass(OidcClient)
    miloClient = stubClass(MiloClient)

    getComptageJeuneQueryGetter = new GetComptageJeuneQueryGetter(
      databaseForTesting.sequelize,
      oidcClient,
      miloClient
    )

    await ConseillerSqlModel.create(conseiller)
    await JeuneSqlModel.create(jeune)
  })

  describe('handle', () => {
    it('calcule les actions', async () => {
      // Given
      const query: GetComptageJeuneQuery = {
        idJeune: jeune.id,
        idDossier: 'idDossier',
        accessTokenJeune: 'accessToken',

        dateDebut: uneDatetime(),
        dateFin: uneDatetime()
      }
      oidcClient.exchangeToken.resolves('idpToken')
      miloClient.getSessionsParDossierJeune.resolves(success([]))

      await ActionSqlModel.create(
        uneActionDto({
          idJeune: query.idJeune,
          statut: Action.Statut.EN_COURS,
          codeQualification: Qualification.Code.EMPLOI,
          dateEcheance: query.dateDebut.toJSDate()
        })
      )
      await ActionSqlModel.create(
        uneActionDto({
          idJeune: query.idJeune,
          statut: Action.Statut.TERMINEE,
          heuresQualifiees: 10,
          dateEcheance: query.dateDebut.toJSDate()
        })
      )
      await ActionSqlModel.create(
        uneActionDto({
          idJeune: query.idJeune,
          statut: Action.Statut.TERMINEE,
          heuresQualifiees: 0,
          dateEcheance: query.dateDebut.toJSDate()
        })
      )

      // When
      const result = await getComptageJeuneQueryGetter.handle(query)

      // Then
      expect(result).to.deep.equal(
        success({ nbHeuresDeclarees: 13, nbHeuresValidees: 10 })
      )
      expect(oidcClient.exchangeToken).to.have.been.calledOnceWithExactly(
        query.accessTokenJeune,
        Core.Structure.MILO
      )
      expect(
        miloClient.getSessionsParDossierJeune
      ).to.have.been.calledOnceWithExactly('idpToken', query.idDossier, {
        debut: query.dateDebut.startOf('day'),
        fin: query.dateFin.endOf('day')
      })
    })
    it('calcule les rdvs', async () => {
      // Given
      const query: GetComptageJeuneQuery = {
        idJeune: jeune.id,
        idDossier: 'idDossier',
        accessTokenJeune: 'accessToken',

        dateDebut: uneDatetime(),
        dateFin: uneDatetime()
      }
      oidcClient.exchangeToken.resolves('idpToken')
      miloClient.getSessionsParDossierJeune.resolves(success([]))

      const rdv1 = unRendezVousDto({
        date: query.dateDebut.toJSDate(),
        type: CodeTypeRendezVous.ATELIER
      })
      const rdv2 = unRendezVousDto({
        date: query.dateDebut.toJSDate(),
        type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
      })
      const rdv3 = unRendezVousDto({
        date: query.dateDebut.toJSDate(),
        type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
      })
      await RendezVousSqlModel.create(rdv1)
      await RendezVousSqlModel.create(rdv2)
      await RendezVousSqlModel.create(rdv3)

      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        { idRendezVous: rdv1.id, idJeune: jeune.id },
        { idRendezVous: rdv2.id, idJeune: jeune.id, present: true },
        { idRendezVous: rdv3.id, idJeune: jeune.id, present: false }
      ])

      // When
      const result = await getComptageJeuneQueryGetter.handle(query)

      // Then
      expect(result).to.deep.equal(
        success({ nbHeuresDeclarees: 5, nbHeuresValidees: 1 })
      )
      expect(oidcClient.exchangeToken).to.have.been.calledOnceWithExactly(
        query.accessTokenJeune,
        Core.Structure.MILO
      )
      expect(
        miloClient.getSessionsParDossierJeune
      ).to.have.been.calledOnceWithExactly('idpToken', query.idDossier, {
        debut: query.dateDebut.startOf('day'),
        fin: query.dateFin.endOf('day')
      })
    })
    it('calcule les sessions', async () => {
      // Given
      const query: GetComptageJeuneQuery = {
        idJeune: jeune.id,
        idDossier: 'idDossier',
        accessTokenConseiller: 'accessToken',

        dateDebut: uneDatetime(),
        dateFin: uneDatetime()
      }
      oidcClient.exchangeToken.resolves('idpToken')
      miloClient.getSessionsParDossierJeunePourConseiller.resolves(
        success([
          {
            session: uneSessionDto,
            offre: uneOffreDto,
            sessionInstance: {
              statut: MILO_INSCRIT
            }
          },
          {
            session: uneSessionDto,
            offre: uneOffreDto,
            sessionInstance: {
              statut: MILO_PRESENT
            }
          },
          {
            session: uneSessionDto,
            offre: uneOffreDto,
            sessionInstance: {
              statut: MILO_REFUS_JEUNE
            }
          }
        ])
      )

      // When
      const result = await getComptageJeuneQueryGetter.handle(query)

      // Then
      expect(result).to.deep.equal(
        success({ nbHeuresDeclarees: 8, nbHeuresValidees: 4 })
      )
      expect(oidcClient.exchangeToken).to.have.been.calledOnceWithExactly(
        query.accessTokenConseiller,
        Core.Structure.MILO
      )
      expect(
        miloClient.getSessionsParDossierJeunePourConseiller
      ).to.have.been.calledOnceWithExactly('idpToken', query.idDossier, {
        debut: query.dateDebut.startOf('day'),
        fin: query.dateFin.endOf('day')
      })
    })
  })
})

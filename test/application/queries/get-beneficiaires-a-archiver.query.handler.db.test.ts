import { DateTime } from 'luxon'
import { ConseillerAuthorizer } from 'src/application/authorizers/conseiller-authorizer'
import { GetBeneficiairesAArchiverQueryHandler } from 'src/application/queries/get-beneficiaires-a-archiver.query.handler.db'
import { success } from 'src/building-blocks/types/result'
import { ConseillerSqlModel } from 'src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneMiloAArchiverSqlModel } from 'src/infrastructure/sequelize/models/jeune-milo-a-archiver.sql-model'
import { JeuneSqlModel } from 'src/infrastructure/sequelize/models/jeune.sql-model'
import { DateService } from 'src/utils/date-service'
import { unUtilisateurConseiller } from 'test/fixtures/authentification.fixture'
import { unConseillerDto } from 'test/fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from 'test/fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from 'test/utils'
import {
  DatabaseForTesting,
  getDatabase
} from 'test/utils/database-for-testing'

describe('GetBeneficiaireAArchiverQueryHandler', () => {
  let conseillerAuthorizer: ConseillerAuthorizer
  let dateService: StubbedClass<DateService>
  let queryHandler: GetBeneficiairesAArchiverQueryHandler
  let database: DatabaseForTesting
  beforeEach(async () => {
    database = getDatabase()
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    dateService = stubClass(DateService)
    queryHandler = new GetBeneficiairesAArchiverQueryHandler(
      conseillerAuthorizer,
      dateService,
      database.sequelize
    )
  })

  describe('handle', () => {
    const now = DateTime.fromISO('2023-04-12')
    beforeEach(async () => {
      dateService.now.returns(now)
      await database.cleanPG()

      await ConseillerSqlModel.creer(unConseillerDto({ id: 'id-conseiller' }))
      await ConseillerSqlModel.creer(unConseillerDto({ id: 'id-conseiller-2' }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-1',
          nom: 'Curie',
          prenom: 'Marie',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-autre-conseiller',
          nom: 'Edison',
          prenom: 'Thomas',
          idConseiller: 'id-conseiller-2'
        })
      )
    })

    it('renvoie les jeunes avec une date de fin de CEJ de plus de 6 mois', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-2',
          nom: 'Lovelace',
          prenom: 'Ada',
          idConseiller: 'id-conseiller',
          dateFinCEJ: now.minus({ month: 6, day: 1 }).toJSDate(),
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        })
      )

      // When
      const actual = await queryHandler.handle({
        idConseiller: 'id-conseiller'
      })

      // Then
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-2', nom: 'Lovelace', prenom: 'Ada' }])
      )
    })

    it('renvoie les jeunes avec une date de dernière activité de plus de 6 mois', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-3',
          nom: 'Liskov',
          prenom: 'Barbara',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now
            .minus({ month: 6, day: 1 })
            .toJSDate()
        })
      )

      // When
      const actual = await queryHandler.handle({
        idConseiller: 'id-conseiller'
      })

      // Then
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-3', nom: 'Liskov', prenom: 'Barbara' }])
      )
    })

    it('renvoie les jeunes milo marqués à archiver', async () => {
      // Given
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'id-jeune-4',
          nom: 'Hopper',
          prenom: 'Grace',
          idConseiller: 'id-conseiller',
          dateDerniereActualisationToken: now.minus({ day: 2 }).toJSDate()
        })
      )
      await JeuneMiloAArchiverSqlModel.create({
        idJeune: 'id-jeune-4'
      })

      // When
      const actual = await queryHandler.handle({
        idConseiller: 'id-conseiller'
      })

      // Then
      expect(actual).to.deep.equal(
        success([{ id: 'id-jeune-4', nom: 'Hopper', prenom: 'Grace' }])
      )
    })
  })

  describe('authorize', () => {
    it("appelle l'authorizer pour le conseiller", async () => {
      // Given
      const utilisateur = unUtilisateurConseiller()

      // When
      await queryHandler.authorize(
        { idConseiller: 'id-conseiller' },
        utilisateur
      )

      // Then
      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly('id-conseiller', utilisateur)
    })
  })
})

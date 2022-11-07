import { unJeuneDuRendezVous } from 'test/fixtures/rendez-vous.fixture'
import { Core } from '../../../src/domain/core'
import {
  CodeTypeRendezVous,
  JeuneDuRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous'
import { AnimationCollectiveSqlRepository } from '../../../src/infrastructure/repositories/rendez-vous/animation-collective-sql.repository.db'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime, uneDatetimeMinuit } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unEtablissementDto } from '../../fixtures/sql-models/etablissement.sq-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import Structure = Core.Structure

describe('AnimationsCollectivesSqlRepository', () => {
  const databaseForTesting = DatabaseForTesting.prepare()
  let animationsCollectivesSqlRepository: AnimationCollectiveSqlRepository
  const maintenant = uneDatetime()
  const aujourdhuiMinuit = uneDatetimeMinuit()
  let jeune: JeuneDuRendezVous

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())
    animationsCollectivesSqlRepository = new AnimationCollectiveSqlRepository(
      dateService,
      databaseForTesting.sequelize
    )

    // Given
    await ConseillerSqlModel.creer(
      unConseillerDto({
        structure: Structure.POLE_EMPLOI
      })
    )
    jeune = unJeuneDuRendezVous()
    await JeuneSqlModel.creer(unJeuneDto())
    await JeuneSqlModel.creer(unJeuneDto({ id: 'un-autre-jeune' }))
    await AgenceSqlModel.create(
      unEtablissementDto({
        id: 'une-agence'
      })
    )
    await AgenceSqlModel.create(
      unEtablissementDto({
        id: 'une-autre-agence'
      })
    )
  })

  describe('getAllAVenir', () => {
    it("retourne les animations collectives de l'agence", async () => {
      // Given
      const uneACPassee = unRendezVousDto({
        date: maintenant.minus({ days: 2 }).toJSDate(),
        titre: 'UNE AC PASSÉE',
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
        idAgence: 'une-agence'
      })
      const uneACAVenir = unRendezVousDto({
        date: maintenant.plus({ days: 20 }).toJSDate(),
        titre: 'UNE AC QUI DOIT REMONTER',
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
        idAgence: 'une-agence'
      })
      const uneACAVenirDuneAutreAgence = unRendezVousDto({
        date: maintenant.plus({ days: 20 }).toJSDate(),
        titre: "UNE AC D'UNE AUTRE AGENCE",
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
        idAgence: 'une-autre-agence'
      })
      const unRendezVous = unRendezVousDto({
        date: maintenant.plus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ VOUS INDIVIDUEL',
        type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER
      })

      await RendezVousSqlModel.bulkCreate([
        uneACPassee,
        uneACAVenir,
        uneACAVenirDuneAutreAgence,
        unRendezVous
      ])

      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        { idRendezVous: uneACPassee.id, idJeune: jeune.id },
        { idRendezVous: uneACAVenir.id, idJeune: jeune.id },
        {
          idRendezVous: uneACAVenirDuneAutreAgence.id,
          idJeune: jeune.id
        },
        { idRendezVous: unRendezVous.id, idJeune: jeune.id }
      ])

      // When
      const animationCollectives =
        await animationsCollectivesSqlRepository.getAllAVenir('une-agence')

      // Then
      expect(animationCollectives.length).to.equal(1)
      const expected: RendezVous.AnimationCollective = {
        id: uneACAVenir.id,
        titre: uneACAVenir.titre,
        sousTitre: uneACAVenir.sousTitre,
        modalite: uneACAVenir.modalite!,
        duree: uneACAVenir.duree,
        date: uneACAVenir.date,
        commentaire: uneACAVenir.commentaire!,
        jeunes: [
          {
            configuration: {
              appVersion: '1.8.1',
              dateDerniereActualisationToken: new Date(
                jeune.configuration!.dateDerniereActualisationToken!
              ),
              idJeune: 'ABCDE',
              installationId: '123456',
              instanceId: 'abcdef',
              pushNotificationToken: 'token'
            },
            conseiller: {
              email: 'nils.tavernier@passemploi.com',
              firstName: 'Nils',
              id: '1',
              lastName: 'Tavernier'
            },
            email: 'john.doe@plop.io',
            firstName: 'John',
            id: 'ABCDE',
            lastName: 'Doe'
          }
        ],
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
        precision: undefined,
        adresse: undefined,
        organisme: undefined,
        presenceConseiller: uneACAVenir.presenceConseiller,
        invitation: undefined,
        icsSequence: undefined,
        createur: uneACAVenir.createur,
        dateCloture: DateService.fromJSDateToDateTime(uneACAVenir.dateCloture),
        idAgence: uneACAVenir.idAgence!
      }
      expect(animationCollectives[0]).to.deep.equal(expected)
    })
  })
})

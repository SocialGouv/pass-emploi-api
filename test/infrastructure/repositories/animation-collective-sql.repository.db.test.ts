import {
  uneAnimationCollective,
  unJeuneDuRendezVous
} from 'test/fixtures/rendez-vous.fixture'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime, uneDatetimeMinuit } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, stubClass } from '../../utils'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import {
  CodeTypeRendezVous,
  JeuneDuRendezVous,
  RendezVous
} from '../../../src/domain/rendez-vous'
import { Core } from '../../../src/domain/core'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { uneConfiguration } from '../../fixtures/jeune.fixture'
import { AnimationCollectiveSqlRepository } from '../../../src/infrastructure/repositories/rendez-vous/animation-collective-sql.repository.db'
import { toRendezVous } from '../../../src/infrastructure/repositories/mappers/rendez-vous.mappers'
import { AgenceSqlModel } from '../../../src/infrastructure/sequelize/models/agence.sql-model'
import { unEtablissementDto } from '../../fixtures/sql-models/etablissement.sq-model'
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

  describe('save', () => {
    const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
    let animationCollective: RendezVous.AnimationCollective

    beforeEach(async () => {
      animationCollective = uneAnimationCollective({
        id,
        jeunes: [jeune],
        type: CodeTypeRendezVous.ATELIER
      })
    })

    describe("quand c'est une animation collective inexistante", () => {
      it("crée l'animation collective et l'association", async () => {
        // When
        await animationsCollectivesSqlRepository.save(animationCollective)

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id, {
          include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
        })
        const associations = await RendezVousJeuneAssociationSqlModel.findAll({
          where: { idRendezVous: id }
        })
        expect(rdv?.id).to.equal(id)
        expect(associations.length).to.equal(1)
        expect(associations[0].idJeune).to.equal(jeune.id)
      })
    })
    describe("quand c'est une animation collective existante", () => {
      // When
      beforeEach(async () => {
        await animationsCollectivesSqlRepository.save(animationCollective)
      })

      describe('quand il y a un jeune en plus', () => {
        it("met à jour les informations de l'AC en ajoutant une association quand on rajoute un jeune", async () => {
          // Given
          const nouveauJeune = unJeuneDuRendezVous({
            id: 'nouveauJeune',
            configuration: uneConfiguration({ idJeune: 'nouveauJeune' })
          })
          await JeuneSqlModel.creer(unJeuneDto({ id: nouveauJeune.id }))
          const animationCollectiveAvecUnJeuneDePlus: RendezVous.AnimationCollective =
            {
              ...animationCollective,
              jeunes: animationCollective.jeunes.concat(nouveauJeune)
            }
          await animationsCollectivesSqlRepository.save(
            animationCollectiveAvecUnJeuneDePlus
          )

          // Then
          const rendezVousSql = await RendezVousSqlModel.findAll({
            include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
          })
          expect(rendezVousSql[0].jeunes.length).to.equal(2)
        })
      })

      describe('quand on enlève un jeune du rendez-vous', () => {
        it("met à jour les informations de l'AC en ajoutant une association quand on enlève un jeune", async () => {
          // Given
          const animationCollectiveAvecUnJeuneDeMoins: RendezVous.AnimationCollective =
            {
              ...animationCollective,
              jeunes: []
            }
          await animationsCollectivesSqlRepository.save(
            animationCollectiveAvecUnJeuneDeMoins
          )

          // Then
          const rendezVousSql = await RendezVousSqlModel.findAll({
            include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
          })
          expect(rendezVousSql[0].jeunes.length).to.equal(0)
        })
      })

      describe('quand on ne change pas le nombre de jeunes', () => {
        it('met à jour les informations du rdv en ne rajoutant pas une association supplémentaire', async () => {
          // Given
          const uneAnimationCollectiveModifiee: RendezVous.AnimationCollective =
            {
              ...animationCollective,
              commentaire: 'un commentaire modifié',
              precision: 'une autre précision',
              adresse: 'un autre endroit',
              invitation: false,
              sousTitre: 'nouveau sous titre',
              presenceConseiller: true
            }

          // When
          await animationsCollectivesSqlRepository.save(
            uneAnimationCollectiveModifiee
          )

          // Then
          const rendezVousSql = await RendezVousSqlModel.findOne({
            include: [{ model: JeuneSqlModel, include: [ConseillerSqlModel] }]
          })
          expect(toRendezVous(rendezVousSql!)).to.deep.equal(
            uneAnimationCollectiveModifiee
          )
        })
      })

      it('supprime les informations du rdv', async () => {
        await animationsCollectivesSqlRepository.save({
          ...animationCollective,
          commentaire: undefined,
          modalite: undefined,
          adresse: undefined,
          organisme: undefined
        })

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        expect(rdv?.id).to.equal(id)
        expect(rdv?.commentaire).to.equal(null)
        expect(rdv?.modalite).to.equal(null)
        expect(rdv?.adresse).to.equal(null)
        expect(rdv?.organisme).to.equal(null)
      })
    })
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

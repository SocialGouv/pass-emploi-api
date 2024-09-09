import {
  uneAnimationCollective,
  unJeuneDuRendezVous
} from 'test/fixtures/rendez-vous.fixture'
import { Core } from '../../../../src/domain/core'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../../../src/domain/rendez-vous/rendez-vous'
import { AnimationCollectiveSqlRepository } from '../../../../src/infrastructure/repositories/rendez-vous/animation-collective-sql.repository.db'
import { AgenceSqlModel } from '../../../../src/infrastructure/sequelize/models/agence.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../../src/utils/date-service'
import { uneDatetime, uneDatetimeMinuit } from '../../../fixtures/date.fixture'
import {
  desPreferencesJeune,
  unConseillerDuJeune,
  uneConfiguration
} from '../../../fixtures/jeune.fixture'
import { uneAgenceDto } from '../../../fixtures/sql-models/agence.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe('AnimationsCollectivesSqlRepository', () => {
  let databaseForTesting: DatabaseForTesting
  let animationsCollectivesSqlRepository: AnimationCollectiveSqlRepository
  const maintenant = uneDatetime()
  const aujourdhuiMinuit = uneDatetimeMinuit()
  const jeune = unJeuneDuRendezVous({
    conseiller: unConseillerDuJeune({ idAgence: undefined })
  })
  const unAutreJeune = unJeuneDuRendezVous({
    id: 'un-autre-jeune',
    configuration: uneConfiguration({ idJeune: 'un-autre-jeune' }),
    conseiller: unConseillerDuJeune({ idAgence: undefined })
  })

  before(async () => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()

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
        structure: Core.Structure.POLE_EMPLOI
      })
    )
    await JeuneSqlModel.creer(unJeuneDto({ id: jeune.id }))
    await JeuneSqlModel.creer(unJeuneDto({ id: unAutreJeune.id }))
    await AgenceSqlModel.create(
      uneAgenceDto({
        id: 'une-agence'
      })
    )
    await AgenceSqlModel.create(
      uneAgenceDto({
        id: 'une-autre-agence'
      })
    )
  })

  describe('getAllAVenirByEtablissement', () => {
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
        await animationsCollectivesSqlRepository.getAllAVenirByEtablissement(
          'une-agence'
        )

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
                jeune.configuration.dateDerniereActualisationToken!
              ),
              idJeune: 'ABCDE',
              installationId: '123456',
              instanceId: 'abcdef',
              pushNotificationToken: 'token',
              fuseauHoraire: 'Europe/Paris'
            },
            conseiller: {
              email: 'nils.tavernier@passemploi.com',
              firstName: 'Nils',
              id: '1',
              lastName: 'Tavernier',
              idAgence: undefined
            },
            email: 'john.doe@plop.io',
            firstName: 'John',
            id: 'ABCDE',
            lastName: 'Doe',
            preferences: desPreferencesJeune()
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
        idAgence: uneACAVenir.idAgence!,
        source: RendezVous.Source.PASS_EMPLOI,
        informationsPartenaire: undefined,
        nombreMaxParticipants: undefined
      }
      expect(animationCollectives[0]).to.deep.equal(expected)
    })
  })

  describe('getAllByEtablissementAvecSupprimes', () => {
    it("retourne les animations collectives de l'agence", async () => {
      // Given
      const uneACClose = unRendezVousDto({
        date: maintenant.minus({ days: 2 }).toJSDate(),
        titre: 'UNE AC Close',
        type: CodeTypeRendezVous.INFORMATION_COLLECTIVE,
        idAgence: 'une-agence',
        dateCloture: maintenant.toJSDate()
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
        uneACClose,
        uneACAVenir,
        uneACAVenirDuneAutreAgence,
        unRendezVous
      ])

      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        { idRendezVous: uneACClose.id, idJeune: jeune.id },
        { idRendezVous: uneACAVenir.id, idJeune: jeune.id },
        {
          idRendezVous: uneACAVenirDuneAutreAgence.id,
          idJeune: jeune.id
        },
        { idRendezVous: unRendezVous.id, idJeune: jeune.id }
      ])

      // When
      const animationCollectives =
        await animationsCollectivesSqlRepository.getAllByEtablissementAvecSupprimes(
          'une-agence'
        )

      // Then
      expect(animationCollectives.length).to.equal(2)
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
                jeune.configuration.dateDerniereActualisationToken!
              ),
              idJeune: 'ABCDE',
              installationId: '123456',
              instanceId: 'abcdef',
              pushNotificationToken: 'token',
              fuseauHoraire: 'Europe/Paris'
            },
            conseiller: {
              email: 'nils.tavernier@passemploi.com',
              firstName: 'Nils',
              id: '1',
              lastName: 'Tavernier',
              idAgence: undefined
            },
            email: 'john.doe@plop.io',
            firstName: 'John',
            id: 'ABCDE',
            lastName: 'Doe',
            preferences: desPreferencesJeune()
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
        idAgence: uneACAVenir.idAgence!,
        source: RendezVous.Source.PASS_EMPLOI,
        informationsPartenaire: undefined,
        nombreMaxParticipants: undefined
      }
      expect(animationCollectives[0]).to.deep.equal(expected)
      expect(animationCollectives[1].id).to.equal(uneACClose.id)
    })
  })

  describe('save', () => {
    const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
    let uneAnimationCollectiveTest: RendezVous.AnimationCollective

    beforeEach(() => {
      //Given
      uneAnimationCollectiveTest = uneAnimationCollective({
        id,
        jeunes: [jeune]
      })
    })

    describe("quand c'est une animation collective inexistante", () => {
      it("crée l'animation collective et l'association", async () => {
        // When
        await animationsCollectivesSqlRepository.save(
          uneAnimationCollectiveTest
        )

        // Then
        const animationCollective = await RendezVousSqlModel.findByPk(id)
        const associations = await RendezVousJeuneAssociationSqlModel.findAll({
          where: { idRendezVous: id }
        })
        expect(animationCollective?.id).to.equal(id)
        expect(associations.length).to.equal(1)
        expect(associations[0].idJeune).to.equal(jeune.id)
      })
    })
    describe("quand c'est une animation collective existante", () => {
      // When
      beforeEach(async () => {
        await animationsCollectivesSqlRepository.save(
          uneAnimationCollectiveTest
        )
      })

      describe('quand il y a un jeune en plus', () => {
        it("met à jour les informations de l'animation collective en ajoutant une association quand on rajoute un jeune", async () => {
          // Given
          const nouveauJeune = unJeuneDuRendezVous({
            id: 'nouveauJeune',
            configuration: uneConfiguration({ idJeune: 'nouveauJeune' }),
            conseiller: unConseillerDuJeune({ idAgence: undefined })
          })
          await JeuneSqlModel.creer(unJeuneDto({ id: nouveauJeune.id }))
          const animationCollectiveAvecUnJeuneDePlus: RendezVous.AnimationCollective =
            {
              ...uneAnimationCollectiveTest,
              informationsPartenaire: undefined,
              jeunes: uneAnimationCollectiveTest.jeunes.concat(nouveauJeune)
            }
          await animationsCollectivesSqlRepository.save(
            animationCollectiveAvecUnJeuneDePlus
          )

          // Then
          const actual = await animationsCollectivesSqlRepository.get(
            animationCollectiveAvecUnJeuneDePlus.id
          )
          expect(actual).to.deep.equal(animationCollectiveAvecUnJeuneDePlus)
        })
      })

      describe('quand on enlève un jeune du rendez-vous', () => {
        it('met à jour les informations du animationCollective en supprimant une association quand on supprime un jeune', async () => {
          // Given
          const rendezVousAvecUnJeuneDeMoins: RendezVous.AnimationCollective = {
            ...uneAnimationCollectiveTest,
            informationsPartenaire: undefined,
            jeunes: uneAnimationCollectiveTest.jeunes.filter(
              jeune => jeune.id !== unAutreJeune.id
            )
          }
          await animationsCollectivesSqlRepository.save(
            rendezVousAvecUnJeuneDeMoins
          )

          // Then
          const actual = await animationsCollectivesSqlRepository.get(
            rendezVousAvecUnJeuneDeMoins.id
          )
          expect(actual).to.deep.equal(rendezVousAvecUnJeuneDeMoins)
        })
      })

      describe('quand on ne change pas le nombre de jeunes', () => {
        it('met à jour les informations du animationCollective en ne rajoutant pas une association supplémentaire et en mettant à jour les informations de presence des jeunes', async () => {
          // Given
          const uneAnimationCollectiveModifiee: RendezVous.AnimationCollective =
            {
              ...uneAnimationCollectiveTest,
              jeunes: [
                { ...jeune, present: true },
                { ...unAutreJeune, present: false }
              ],
              commentaire: 'un commentaire modifié',
              precision: 'une autre précision',
              adresse: 'un autre endroit',
              invitation: false,
              sousTitre: 'nouveau sous titre',
              presenceConseiller: true,
              dateCloture: uneDatetime()
            }

          // When
          await animationsCollectivesSqlRepository.save(
            uneAnimationCollectiveModifiee
          )

          // Then
          const actual = await animationsCollectivesSqlRepository.get(
            uneAnimationCollectiveTest.id
          )
          expect(actual).to.deep.equal({
            ...uneAnimationCollectiveModifiee,
            informationsPartenaire: undefined,
            jeunes: [jeune, unAutreJeune]
          })
        })
      })

      it("supprime les informations de l'animation collective", async () => {
        await animationsCollectivesSqlRepository.save({
          ...uneAnimationCollectiveTest,
          commentaire: undefined,
          modalite: undefined,
          adresse: undefined,
          organisme: undefined
        })

        // Then
        const animationCollective = await RendezVousSqlModel.findByPk(id)
        expect(animationCollective?.id).to.equal(id)
        expect(animationCollective?.commentaire).to.equal(null)
        expect(animationCollective?.modalite).to.equal(null)
        expect(animationCollective?.adresse).to.equal(null)
        expect(animationCollective?.organisme).to.equal(null)
      })
    })
  })

  describe('get', () => {
    const id = '6c242fa0-804f-11ec-a8a3-0242ac120002'
    describe("quand l'AC n'existe pas", () => {
      it('retourne undefined', async () => {
        // When
        const animationCollective =
          await animationsCollectivesSqlRepository.get(id)
        // Then
        expect(animationCollective).to.equal(undefined)
      })
    })
    describe("quand l'AC existe", () => {
      it("retourne l'AC", async () => {
        // Given
        const animationCollectiveDto = unRendezVousDto({
          id,
          type: CodeTypeRendezVous.ATELIER
        })
        await RendezVousSqlModel.create(animationCollectiveDto)
        await RendezVousJeuneAssociationSqlModel.create({
          idRendezVous: animationCollectiveDto.id,
          idJeune: jeune.id
        })
        // When
        const animationCollective =
          await animationsCollectivesSqlRepository.get(id)
        // Then
        expect(animationCollective?.id).to.equal(animationCollectiveDto.id)
        expect(animationCollective?.jeunes[0].id).to.equal(jeune.id)
        expect(animationCollective?.createur).to.deep.equal(
          animationCollectiveDto.createur
        )
      })
    })
  })
})

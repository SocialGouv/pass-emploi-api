import {
  unJeuneDuRendezVous,
  unRendezVous
} from 'test/fixtures/rendez-vous.fixture'
import { RendezVousRepositorySql } from '../../../../src/infrastructure/repositories/rendez-vous/rendez-vous-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../../src/utils/date-service'
import { uneDatetime, uneDatetimeMinuit } from '../../../fixtures/date.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, stubClass } from '../../../utils'
import { RendezVousJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import {
  JeuneDuRendezVous,
  RendezVous
} from '../../../../src/domain/rendez-vous/rendez-vous'
import { Core } from '../../../../src/domain/core'
import {
  unConseillerDuJeune,
  uneConfiguration
} from '../../../fixtures/jeune.fixture'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import Structure = Core.Structure

describe('RendezVousRepositorySql', () => {
  let databaseForTesting: DatabaseForTesting
  let rendezVousRepositorySql: RendezVousRepositorySql
  const maintenant = uneDatetime()
  const aujourdhuiMinuit = uneDatetimeMinuit()
  let jeune: JeuneDuRendezVous
  let unAutreJeune: JeuneDuRendezVous

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    const dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())
    rendezVousRepositorySql = new RendezVousRepositorySql(
      dateService,
      databaseForTesting.sequelize
    )

    // Given
    await ConseillerSqlModel.creer(
      unConseillerDto({
        structure: Structure.POLE_EMPLOI
      })
    )
    jeune = unJeuneDuRendezVous({
      conseiller: unConseillerDuJeune({ idAgence: undefined })
    })
    await JeuneSqlModel.creer(unJeuneDto())
    unAutreJeune = unJeuneDuRendezVous({ id: 'un-autre-jeune' })
    await JeuneSqlModel.creer(unJeuneDto({ id: 'un-autre-jeune' }))
  })

  describe('get', () => {
    describe("quand le rdv n'existe pas", () => {
      it('retourne undefined', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        // When
        const rendezVous = await rendezVousRepositorySql.get(idRdv)
        // Then
        expect(rendezVous).to.equal(undefined)
      })
    })
    describe('quand le rdv existe', () => {
      it('retourne le rendez-vous', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const unRendezVous = unRendezVousDto({
          id: idRdv
        })
        await RendezVousSqlModel.create(unRendezVous)
        await RendezVousJeuneAssociationSqlModel.create({
          idRendezVous: unRendezVous.id,
          idJeune: jeune.id
        })
        // When
        const rendezVous = await rendezVousRepositorySql.get(idRdv)
        // Then
        expect(rendezVous?.id).to.equal(unRendezVous.id)
        expect(rendezVous?.jeunes[0].id).to.equal(jeune.id)
        expect(rendezVous?.createur).to.deep.equal(unRendezVous.createur)
      })
    })
  })

  describe('save', () => {
    const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
    let unRendezVousTest: RendezVous

    beforeEach(() => {
      //Given
      unRendezVousTest = unRendezVous({
        id,
        jeunes: [jeune],
        informationsPartenaire: undefined
      })
    })

    describe("quand c'est un rdv inexistant", () => {
      it("crée le rdv et l'association", async () => {
        // When
        await rendezVousRepositorySql.save(unRendezVousTest)

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        const associations = await RendezVousJeuneAssociationSqlModel.findAll({
          where: { idRendezVous: id }
        })
        expect(rdv?.id).to.equal(id)
        expect(associations.length).to.equal(1)
        expect(associations[0].idJeune).to.equal(jeune.id)
      })
    })
    describe("quand c'est un rdv existant", () => {
      // When
      beforeEach(async () => {
        await rendezVousRepositorySql.save(unRendezVousTest)
      })

      describe('quand il y a un jeune en plus', () => {
        it('met à jour les informations du rdv en ajoutant une association quand on rajoute un jeune', async () => {
          // Given
          const nouveauJeune = unJeuneDuRendezVous({
            id: 'nouveauJeune',
            configuration: uneConfiguration({ idJeune: 'nouveauJeune' }),
            conseiller: unConseillerDuJeune({ idAgence: undefined })
          })
          await JeuneSqlModel.creer(unJeuneDto({ id: nouveauJeune.id }))
          const rendezVousAvecUnJeuneDePlus: RendezVous = {
            ...unRendezVousTest,
            jeunes: unRendezVousTest.jeunes.concat(nouveauJeune),
            informationsPartenaire: undefined
          }
          await rendezVousRepositorySql.save(rendezVousAvecUnJeuneDePlus)

          // Then
          const actual = await rendezVousRepositorySql.get(
            rendezVousAvecUnJeuneDePlus.id
          )
          expect(actual).to.deep.equal(rendezVousAvecUnJeuneDePlus)
        })
      })

      describe('quand on enlève un jeune du rendez-vous', () => {
        it('met à jour les informations du rdv en supprimant une association quand on supprime un jeune', async () => {
          // Given
          const rendezVousAvecUnJeuneDeMoins: RendezVous = {
            ...unRendezVousTest,
            informationsPartenaire: undefined,
            jeunes: unRendezVousTest.jeunes.filter(
              jeune => jeune.id !== unAutreJeune.id
            )
          }
          await rendezVousRepositorySql.save(rendezVousAvecUnJeuneDeMoins)

          // Then
          const actual = await rendezVousRepositorySql.get(
            rendezVousAvecUnJeuneDeMoins.id
          )
          expect(actual).to.deep.equal(rendezVousAvecUnJeuneDeMoins)
        })
      })

      describe('quand on ne change pas le nombre de jeunes', () => {
        it('met à jour les informations du rdv en ne rajoutant pas une association supplémentaire', async () => {
          // Given
          const unRendezVousModifie: RendezVous = {
            ...unRendezVousTest,
            commentaire: 'un commentaire modifié',
            precision: 'une autre précision',
            adresse: 'un autre endroit',
            invitation: false,
            sousTitre: 'nouveau sous titre',
            presenceConseiller: true
          }

          // When
          await rendezVousRepositorySql.save(unRendezVousModifie)

          // Then
          const actual = await rendezVousRepositorySql.get(unRendezVousTest.id)
          expect(actual).to.deep.equal(unRendezVousModifie)
        })
      })

      it('supprime les informations du rdv', async () => {
        await rendezVousRepositorySql.save({
          ...unRendezVousTest,
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
    it('retourne le rendez-vous', async () => {
      // Given
      const unRendezVousPasse = unRendezVousDto({
        date: maintenant.minus({ days: 2 }).toJSDate(),
        titre: 'UN RENDEZ VOUS PASSÉ'
      })
      const unRendezVousTresPasse = unRendezVousDto({
        date: maintenant.minus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ VOUS TRES PASSÉ'
      })
      const unRendezVousProche = unRendezVousDto({
        date: maintenant.plus({ days: 2 }).toJSDate(),
        titre: 'UN RENDEZ VOUS PROCHE'
      })
      const unRendezVousTresFuturPresenceConseillerFalse = unRendezVousDto({
        date: maintenant.plus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ TRES FUTUR',
        presenceConseiller: false
      })

      await RendezVousSqlModel.bulkCreate([
        unRendezVousPasse,
        unRendezVousTresPasse,
        unRendezVousTresFuturPresenceConseillerFalse,
        unRendezVousProche
      ])

      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        { idRendezVous: unRendezVousPasse.id, idJeune: jeune.id },
        { idRendezVous: unRendezVousTresPasse.id, idJeune: jeune.id },
        {
          idRendezVous: unRendezVousTresFuturPresenceConseillerFalse.id,
          idJeune: jeune.id
        },
        { idRendezVous: unRendezVousProche.id, idJeune: jeune.id }
      ])

      // When
      const rendezVous = await rendezVousRepositorySql.getAllAVenir()

      // Then
      expect(rendezVous.length).to.equal(2)
      expect(rendezVous[0].jeunes[0].id).to.equal(jeune.id)
      expect(rendezVous[0].id).to.equal(
        unRendezVousTresFuturPresenceConseillerFalse.id
      )
      expect(rendezVous[1].id).to.equal(unRendezVousProche.id)
    })
  })

  describe('delete', () => {
    describe('quand le rdv existe', () => {
      it("supprime l'association et le rdv", async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const rendezVousDto = unRendezVousDto({
          id: idRdv
        })
        await RendezVousSqlModel.create(rendezVousDto)
        await RendezVousJeuneAssociationSqlModel.create({
          idRendezVous: rendezVousDto.id,
          idJeune: jeune.id
        })
        // When
        await rendezVousRepositorySql.delete(idRdv)
        // Then
        const rdvSupprime = await RendezVousSqlModel.findByPk(rendezVousDto.id)
        const associations = await RendezVousJeuneAssociationSqlModel.findAll({
          where: { idRendezVous: rendezVousDto.id }
        })
        expect(rdvSupprime).to.equal(null)
        expect(associations.length).to.equal(0)
      })
    })
  })

  describe('getByIdPartenaire', () => {
    const idRdvPartenaire = 'PLOP'
    const typePartenaire = 'RENDEZ_VOUS'

    beforeEach(async () => {
      // Given
      await RendezVousSqlModel.create(
        unRendezVousDto({
          typePartenaire,
          idPartenaire: idRdvPartenaire
        })
      )
    })
    describe("quand le rdv n'existe pas", () => {
      it('retourne undefined', async () => {
        // When
        const rendezVous = await rendezVousRepositorySql.getByIdPartenaire(
          'un autre id',
          typePartenaire
        )
        // Then
        expect(rendezVous).to.equal(undefined)
      })
    })
    describe('quand le rdv existe', () => {
      it('retourne le rendez-vous', async () => {
        // When
        const rendezVous = await rendezVousRepositorySql.getByIdPartenaire(
          idRdvPartenaire,
          typePartenaire
        )
        // Then
        expect(rendezVous?.informationsPartenaire).to.deep.equal({
          id: idRdvPartenaire,
          type: typePartenaire
        })
      })
    })
  })

  describe('getAndIncrementRendezVousIcsSequence', () => {
    describe('quand le rdv a une séquence ics qui est nulle', () => {
      it('initialise la séquence ics à 0', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const unRendezVous = unRendezVousDto({
          id: idRdv
        })
        await RendezVousSqlModel.create(unRendezVous)
        // When
        const rendezVousIcsSequence =
          await rendezVousRepositorySql.getAndIncrementRendezVousIcsSequence(
            idRdv
          )
        // Then
        expect(rendezVousIcsSequence).to.equal(0)
      })
    })
    describe('quand le rdv a une séquence ics non nulle', () => {
      it('incrémente la séquence ics', async () => {
        // Given
        const idRdv = '6c242fa0-804f-11ec-a8a3-0242ac120002'
        const unRendezVous = unRendezVousDto({
          id: idRdv,
          icsSequence: 0
        })
        await RendezVousSqlModel.create(unRendezVous)
        // When
        const rendezVousIcsSequence =
          await rendezVousRepositorySql.getAndIncrementRendezVousIcsSequence(
            idRdv
          )
        // Then
        expect(rendezVousIcsSequence).to.equal(1)
      })
    })
  })
})

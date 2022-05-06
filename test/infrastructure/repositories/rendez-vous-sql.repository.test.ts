import { unRendezVous } from 'test/fixtures/rendez-vous.fixture'
import { Jeune } from '../../../src/domain/jeune'
import { RendezVousRepositorySql } from '../../../src/infrastructure/repositories/rendez-vous-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime, uneDatetimeMinuit } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { DatabaseForTesting, expect, stubClass } from '../../utils'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'

describe('RendezVousRepositorySql', () => {
  const databaseForTesting: DatabaseForTesting = DatabaseForTesting.prepare()
  let rendezVousRepositorySql: RendezVousRepositorySql
  const maintenant = uneDatetime
  const aujourdhuiMinuit = uneDatetimeMinuit
  let jeune: Jeune

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())
    rendezVousRepositorySql = new RendezVousRepositorySql(
      dateService,
      databaseForTesting.sequelize
    )

    // Given
    jeune = unJeune()
    await ConseillerSqlModel.creer(unConseillerDto())
    await JeuneSqlModel.creer(unJeuneDto())
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
    //Given
    const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
    const jeune = unJeune()
    const unRendezVousTest = unRendezVous({ id, jeunes: [jeune] })

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
      //Given
      const commentaire = 'modification'

      // When
      beforeEach(async () => {
        await rendezVousRepositorySql.save(unRendezVousTest)
        await rendezVousRepositorySql.save({ ...unRendezVousTest, commentaire })
      })

      it('met à jour les informations du rdv en ne rajoutant pas une association supplémentaire', async () => {
        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        const associations = await RendezVousJeuneAssociationSqlModel.findAll({
          where: { idRendezVous: id }
        })
        expect(rdv?.id).to.equal(id)
        expect(rdv?.commentaire).to.equal(commentaire)
        expect(associations.length).to.equal(1)
        expect(associations[0].idJeune).to.equal(jeune.id)
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
      it('met à jour les informations du rdv en ajoutant une association quand on rajoute un jeune', async () => {
        // Given
        const nouveauJeune = unJeune({ id: 'nouveauJeune' })
        await JeuneSqlModel.creer(unJeuneDto({ id: nouveauJeune.id }))
        await rendezVousRepositorySql.save({
          ...unRendezVousTest,
          jeunes: unRendezVousTest.jeunes.concat(nouveauJeune)
        })

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        const associations = await RendezVousJeuneAssociationSqlModel.findAll({
          where: { idRendezVous: id }
        })
        expect(rdv?.id).to.equal(id)
        expect(associations.length).to.equal(2)
        expect(associations[0].idJeune).to.equal(jeune.id)
        expect(associations[1].idJeune).to.equal(nouveauJeune.id)
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
      expect(rendezVous[0].id).to.equal(
        unRendezVousTresFuturPresenceConseillerFalse.id
      )
      expect(rendezVous[0].jeunes[0].id).to.equal(jeune.id)
      expect(rendezVous[1].id).to.equal(unRendezVousProche.id)
    })
  })

  describe('delete', () => {
    describe('quand le rdv existe', () => {
      it("met une date de suppression et supprime l'association", async () => {
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
        expect(rdvSupprime?.id).to.equal(rendezVousDto.id)
        expect(rdvSupprime?.dateSuppression).to.deep.equal(
          maintenant.toJSDate()
        )
        expect(associations.length).to.equal(0)
      })
    })
  })
})

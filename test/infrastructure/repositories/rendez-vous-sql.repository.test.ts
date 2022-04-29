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
  DatabaseForTesting.prepare()
  let rendezVousRepositorySql: RendezVousRepositorySql
  const maintenant = uneDatetime
  const aujourdhuiMinuit = uneDatetimeMinuit
  let jeune: Jeune

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())
    rendezVousRepositorySql = new RendezVousRepositorySql(dateService)

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
    describe("quand c'est un rdv inexistant", () => {
      it('crée le rdv', async () => {
        //Given
        const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'

        // When
        await rendezVousRepositorySql.save(unRendezVous({ id }))

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        expect(rdv?.id).to.equal(id)
      })
    })
    describe("quand c'est un rdv existant", () => {
      it('met à jour les informations du rdv', async () => {
        //Given
        const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
        const commentaire = 'new'
        await rendezVousRepositorySql.save(unRendezVous({ id }))

        // When
        await rendezVousRepositorySql.save(unRendezVous({ id, commentaire }))

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        expect(rdv?.id).to.equal(id)
        expect(rdv?.commentaire).to.equal(commentaire)
      })
      it('supprime les informations du rdv', async () => {
        //Given
        const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
        // When
        await rendezVousRepositorySql.save(
          unRendezVous({
            id,
            commentaire: 'test',
            modalite: 'test',
            adresse: 'test',
            organisme: 'test'
          })
        )
        await rendezVousRepositorySql.save(
          unRendezVous({
            id,
            commentaire: undefined,
            modalite: undefined,
            adresse: undefined,
            organisme: undefined
          })
        )

        // Then
        const rdv = await RendezVousSqlModel.findByPk(id)
        expect(rdv?.id).to.equal(id)
        expect(rdv?.commentaire).to.equal(null)
        expect(rdv?.modalite).to.equal(null)
        expect(rdv?.adresse).to.equal(null)
        expect(rdv?.organisme).to.equal(null)
      })
      it('met à jour les informations des jeunes en supprimant les anciennes associations', async () => {
        //Given
        const id = '20c8ca73-fd8b-4194-8d3c-80b6c9949dea'
        const unAutreJeune = unJeune({ id: 'PLOP' })
        await JeuneSqlModel.creer(unJeuneDto({ id: 'PLOP' }))
        await rendezVousRepositorySql.save(
          unRendezVous({ id, jeunes: [jeune, unAutreJeune] })
        )

        // When
        await rendezVousRepositorySql.save(
          unRendezVous({ id, jeunes: [jeune] })
        )

        // Then
        const association = await RendezVousJeuneAssociationSqlModel.findAll({
          where: {
            idRendezVous: id
          }
        })

        expect(association.length).to.equal(1)
        expect(association[0].idJeune).to.equal(jeune.id)
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
})

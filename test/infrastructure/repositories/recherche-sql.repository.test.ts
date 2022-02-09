import { Recherche } from 'src/domain/recherche'
import { uneRecherche } from 'test/fixtures/recherche.fixture'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/recherche-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../../../src/infrastructure/sequelize/models/recherche.sql-model'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('RechercheSqlRepository', () => {
  DatabaseForTesting.prepare()

  let rechercheSqlRepository: RechercheSqlRepository
  const idJeune = 'ABCDE'

  beforeEach(async () => {
    rechercheSqlRepository = new RechercheSqlRepository()

    const conseillerDto = unConseillerDto()
    await ConseillerSqlModel.creer(conseillerDto)
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: idJeune,
        idConseiller: conseillerDto.id,
        dateCreation: uneDatetime.toJSDate(),
        pushNotificationToken: 'unToken',
        dateDerniereActualisationToken: uneDatetime.toJSDate()
      })
    )
  })

  describe('saveRecherche', () => {
    it('sauvegarde une recherche', async () => {
      // Given
      const recherche = uneRecherche({ idJeune })

      // When
      await rechercheSqlRepository.saveRecherche(recherche)

      // Then
      const recherches = await RechercheSqlModel.findAll({ raw: true })
      expect(recherches.length).to.equal(1)
      expect(recherches[0].id).to.equal(recherche.id)
    })
  })
  describe('getRecherches', () => {
    it('recupere une recherche sauvegardée', async () => {
      // Given
      const recherche = uneRecherche({ idJeune })

      await rechercheSqlRepository.saveRecherche(recherche)

      // When
      const recherches = await rechercheSqlRepository.getRecherches(idJeune)

      // Then
      expect(recherches.length).to.equal(1)
      expect(recherches[0].id).to.deep.equal(recherche.id)
    })
  })
  describe('findAvantDate', () => {
    it('recupere les recherches avec le bon type et avant un certain jour', async () => {
      // Given
      const dateMaintenant = uneDatetime
      const dateHier = uneDatetime.minus({ day: 1 })
      const dateRechercheAujourdhui = uneDatetime.minus({ minute: 1 })
      const limiteRecherches = 2

      const rechercheBonne = uneRecherche({
        id: '219e8ba5-cd88-4027-9828-55e8ca99a231',
        idJeune,
        type: Recherche.Type.OFFRES_EMPLOI,
        dateDerniereRecherche: dateHier
      })
      const rechercheBonneMaisDejaFaiteAujourdhui = uneRecherche({
        id: '219e8ba5-cd88-4027-9828-55e8ca99a232',
        idJeune,
        type: Recherche.Type.OFFRES_EMPLOI,
        dateDerniereRecherche: dateRechercheAujourdhui
      })
      const rechercheDuMauvaisType = uneRecherche({
        id: '219e8ba5-cd88-4027-9828-55e8ca99a233',
        idJeune,
        type: Recherche.Type.OFFRES_ALTERNANCE,
        dateDerniereRecherche: dateHier
      })
      const rechercheRecente = uneRecherche({
        id: '219e8ba5-cd88-4027-9828-55e8ca99a234',
        idJeune,
        type: Recherche.Type.OFFRES_EMPLOI,
        dateDerniereRecherche: dateMaintenant
      })

      await rechercheSqlRepository.saveRecherche(rechercheBonne)
      await rechercheSqlRepository.saveRecherche(
        rechercheBonneMaisDejaFaiteAujourdhui
      )
      await rechercheSqlRepository.saveRecherche(rechercheDuMauvaisType)
      await rechercheSqlRepository.saveRecherche(rechercheRecente)

      // When
      const recherches = await rechercheSqlRepository.findAvantDate(
        [Recherche.Type.OFFRES_EMPLOI],
        limiteRecherches,
        dateMaintenant
      )

      // Then
      expect(recherches.length).to.equal(1)
      expect(recherches[0].id).to.deep.equal(rechercheBonne.id)
    })
  })
})

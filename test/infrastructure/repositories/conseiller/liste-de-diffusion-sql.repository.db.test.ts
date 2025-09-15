import { Conseiller } from '../../../../src/domain/conseiller'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../../../src/infrastructure/sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { ListeDeDiffusionSqlRepository } from '../../../../src/infrastructure/repositories/conseiller/liste-de-diffusion-sql.repository.db'
import { unConseillerDuJeune, unJeune } from '../../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { uneListeDeDiffusion } from '../../../fixtures/liste-de-diffusion.fixture'
import { expect } from '../../../utils'
import { ListeDeDiffusion } from '../../../../src/domain/milo/liste-de-diffusion'
import { uneAutreDatetime, uneDatetime } from '../../../fixtures/date.fixture'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

describe(' ListeDeDiffusionSqlRepository', () => {
  let database: DatabaseForTesting

  before(() => {
    database = getDatabase()
  })

  let repository: Conseiller.ListeDeDiffusion.Repository
  const jeune: Jeune = unJeune({
    conseiller: unConseillerDuJeune({ idAgence: undefined })
  })
  const conseillerDto = unConseillerDto({ id: jeune.conseiller!.id })

  beforeEach(async () => {
    await database.cleanPG()
    repository = new ListeDeDiffusionSqlRepository(database.sequelize)

    await ConseillerSqlModel.creer(conseillerDto)
    await JeuneSqlModel.creer(
      unJeuneDto({
        id: jeune.id,
        idConseiller: conseillerDto.id
      })
    )
  })

  describe('save', () => {
    it('crée une nouvelle liste de diffusion', async () => {
      // Given
      const nouvelleListeDeDiffusion = uneListeDeDiffusion()

      // When
      await repository.save(nouvelleListeDeDiffusion)

      // Then
      const actual = await repository.get(nouvelleListeDeDiffusion.id)
      expect(actual).to.deep.equal(nouvelleListeDeDiffusion)
    })
    it('met à jour une liste de diffusion', async () => {
      // Given
      const unJeuneQuiResteDansLaListe = unJeune()
      const unJeuneQuiQuitteLaListe = unJeune({
        id: 'e6c073c4-125f-41ad-aa0b-42eaf91e0659'
      })
      const unNouveauJeuneDansLaListe = unJeune({
        id: '38bcd5e0-574d-44c0-a7d8-7703f52ae2f4'
      })
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: unJeuneQuiQuitteLaListe.id,
          idConseiller: conseillerDto.id
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: unNouveauJeuneDansLaListe.id,
          idConseiller: conseillerDto.id
        })
      )
      const nouvelleListeDeDiffusion = uneListeDeDiffusion({
        beneficiaires: [
          {
            id: unJeuneQuiResteDansLaListe.id,
            dateAjout: uneDatetime(),
            estDansLePortefeuille: true
          },
          {
            id: unJeuneQuiQuitteLaListe.id,
            dateAjout: uneDatetime(),
            estDansLePortefeuille: true
          }
        ]
      })
      await repository.save(nouvelleListeDeDiffusion)
      const listeDeDiffusionAJour: ListeDeDiffusion = {
        ...nouvelleListeDeDiffusion,
        titre: 'un nouveau titre',
        beneficiaires: [
          {
            id: unJeuneQuiResteDansLaListe.id,
            dateAjout: uneDatetime(),
            estDansLePortefeuille: true
          },
          {
            id: unNouveauJeuneDansLaListe.id,
            dateAjout: uneAutreDatetime(),
            estDansLePortefeuille: true
          }
        ]
      }

      // When
      await repository.save(listeDeDiffusionAJour)

      // Then
      const actual = await repository.get(nouvelleListeDeDiffusion.id)
      expect(actual).to.deep.equal(listeDeDiffusionAJour)
      const associations =
        await ListeDeDiffusionJeuneAssociationSqlModel.findAll()
      expect(associations).to.have.length(2)
    })
  })

  describe('delete', () => {
    it('supprime une liste de diffusion', async () => {
      // Given
      const listeDeDiffusion = uneListeDeDiffusion()
      await repository.save(listeDeDiffusion)

      // When
      await repository.delete(listeDeDiffusion.id)

      // Then
      const actual = await repository.get(listeDeDiffusion.id)
      expect(actual).to.equal(undefined)
      const associations =
        await ListeDeDiffusionJeuneAssociationSqlModel.findAll()
      expect(associations).to.deep.equal([])
    })
  })

  describe('findAllByConseiller', () => {
    it('renvoie toutes les listes de diffusion d’un conseiller', async () => {
      // Given
      const unAutreConseillerDto = unConseillerDto({
        id: '53ffc300-891a-46f4-a157-6fd75d8b8520'
      })
      await ConseillerSqlModel.creer(unAutreConseillerDto)

      const listeDeDiffusion1 = uneListeDeDiffusion({
        idConseiller: conseillerDto.id,
        id: '4b7f7e52-aa80-452e-afdb-afc6748512d4'
      })
      const listeDeDiffusion2 = uneListeDeDiffusion({
        idConseiller: conseillerDto.id,
        id: '214d9b1b-b004-4150-825f-aefea6bf1124'
      })
      const listeDeDiffusionDunAutreConseiller = uneListeDeDiffusion({
        idConseiller: unAutreConseillerDto.id,
        id: 'e42dd183-922b-4b7b-8ae8-1ab84a2fb82f'
      })
      await repository.save(listeDeDiffusion1)
      await repository.save(listeDeDiffusion2)
      await repository.save(listeDeDiffusionDunAutreConseiller)

      // When
      const actual = await repository.findAllByConseiller(conseillerDto.id)

      // Then
      expect(actual).to.deep.equal([listeDeDiffusion1, listeDeDiffusion2])
    })
  })
})

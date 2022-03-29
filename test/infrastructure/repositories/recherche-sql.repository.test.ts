import { DateTime } from 'luxon'
import { Recherche } from 'src/domain/recherche'
import { CommuneSqlModel } from 'src/infrastructure/sequelize/models/commune.sql-model'
import {
  communeColombes,
  criteresImmersionNice,
  criteresImmersionParis,
  criteresOffreEmploiColombes,
  criteresServiceCiviqueNice,
  geometrieColombes,
  geometrieNice,
  uneRecherche
} from 'test/fixtures/recherche.fixture'
import { GetOffresImmersionQuery } from '../../../src/application/queries/get-offres-immersion.query.handler'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/recherche-sql.repository'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../../../src/infrastructure/sequelize/models/recherche.sql-model'
import { IdService } from '../../../src/utils/id-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('RechercheSqlRepository', () => {
  const database = DatabaseForTesting.prepare()

  let rechercheSqlRepository: RechercheSqlRepository
  const idJeune = 'ABCDE'

  beforeEach(async () => {
    rechercheSqlRepository = new RechercheSqlRepository(database.sequelize)

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

  describe('createRecherche', () => {
    describe("quand c'est une offre d'immersion", () => {
      describe('quand lat lon ne sont pas présents', () => {
        it('sauvegarde une recherche', async () => {
          // Given
          const recherche = uneRecherche({
            idJeune,
            type: Recherche.Type.OFFRES_IMMERSION,
            criteres: {}
          })

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })
          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
          expect(recherches[0].type).to.equal(recherche.type)
        })
      })
      describe('quand lat lon sont présents', () => {
        it('sauvegarde une recherche avec la bonne geometrie', async () => {
          // Given
          const recherche = uneRecherche({
            idJeune,
            type: Recherche.Type.OFFRES_IMMERSION,
            criteres: criteresImmersionNice
          })

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })

          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
          expect(recherches[0].type).to.equal(recherche.type)
          expect(recherches[0].geometrie.coordinates).to.deep.equal(
            geometrieNice
          )
        })
      })
    })
    describe("quand c'est une offre service civique", () => {
      describe('quand lat lon ne sont pas présents', () => {
        it('sauvegarde une recherche', async () => {
          // Given
          const recherche = uneRecherche({
            idJeune,
            type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
            criteres: {}
          })

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })
          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
          expect(recherches[0].type).to.equal(recherche.type)
        })
      })
      describe('quand lat lon sont présents', () => {
        it('sauvegarde une recherche avec la bonne geometrie', async () => {
          // Given
          const recherche = uneRecherche({
            idJeune,
            type: Recherche.Type.OFFRES_SERVICES_CIVIQUE,
            criteres: criteresServiceCiviqueNice
          })

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })

          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
          expect(recherches[0].type).to.equal(recherche.type)
          expect(recherches[0].geometrie.coordinates).to.deep.equal(
            geometrieNice
          )
        })
      })
    })
    describe("quand c'est une offre d'emploi", () => {
      describe("quand la commune n'est pas présente", () => {
        it('sauvegarde une recherche', async () => {
          // Given
          const recherche = uneRecherche({ idJeune, criteres: {} })

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })
          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
        })
      })
      describe("quand la commune est présente mais n'est pas referencée", () => {
        it('sauvegarde une recherche sans geometrie', async () => {
          // Given
          const recherche = uneRecherche({
            idJeune,
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresOffreEmploiColombes
          })

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })

          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
          expect(recherches[0].geometrie).to.equal(null)
        })
      })
      describe('quand la commune est présente et referencée', () => {
        it('sauvegarde une recherche avec la bonne geometrie', async () => {
          // Given
          const recherche = uneRecherche({
            idJeune,
            type: Recherche.Type.OFFRES_EMPLOI,
            criteres: criteresOffreEmploiColombes
          })
          await CommuneSqlModel.create(communeColombes)

          // When
          await rechercheSqlRepository.createRecherche(recherche)

          // Then
          const recherches = await RechercheSqlModel.findAll({ raw: true })

          expect(recherches.length).to.equal(1)
          expect(recherches[0].id).to.equal(recherche.id)
          expect(recherches[0].geometrie.coordinates).to.deep.equal(
            geometrieColombes
          )
        })
      })
    })
  })

  describe('updateRecherche', () => {
    it('met à jour une recherche', async () => {
      // Given
      const recherche = uneRecherche({ idJeune })
      await rechercheSqlRepository.createRecherche(recherche)
      const rechercheMiseAJour: Recherche = {
        ...recherche,
        dateDerniereRecherche: DateTime.fromISO('2022-03-07T10:10:11')
      }

      // When
      await rechercheSqlRepository.updateRecherche(rechercheMiseAJour)

      // Then
      const recherches = await RechercheSqlModel.findAll({ raw: true })
      expect(recherches.length).to.equal(1)
      expect(recherches[0].id).to.equal(recherche.id)
      expect(recherches[0].dateDerniereRecherche).to.deep.equal(
        DateTime.fromISO('2022-03-07T10:10:11').toJSDate()
      )
    })
  })

  describe('getRecherches', async () => {
    // Given
    const recherche = uneRecherche({
      idJeune,
      type: Recherche.Type.OFFRES_IMMERSION,
      criteres: criteresImmersionNice
    })

    await rechercheSqlRepository.createRecherche(recherche)

    describe('sans géométrie', () => {
      it('recupere une recherche sauvegardée sans sa géométrie', async () => {
        // Given
        await rechercheSqlRepository.createRecherche(recherche)

        // When
        const recherches = await rechercheSqlRepository.getRecherches(
          idJeune,
          false
        )

        // Then
        expect(recherches.length).to.equal(1)
        expect(recherches[0].id).to.deep.equal(recherche.id)
        expect(recherches[0].geometrie).to.equal(undefined)
      })
    })
    describe('avec géométrie', () => {
      it('recupere une recherche sauvegardée avec sa géométrie', async () => {
        // When
        const recherches = await rechercheSqlRepository.getRecherches(
          idJeune,
          true
        )

        // Then
        expect(recherches.length).to.equal(1)
        expect(recherches[0].geometrie!.coordinates).to.deep.equal(
          geometrieNice
        )
      })
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

      await rechercheSqlRepository.createRecherche(rechercheBonne)
      await rechercheSqlRepository.createRecherche(
        rechercheBonneMaisDejaFaiteAujourdhui
      )
      await rechercheSqlRepository.createRecherche(rechercheDuMauvaisType)
      await rechercheSqlRepository.createRecherche(rechercheRecente)

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
  describe('trouverLesRecherchesImmersion', () => {
    describe('quand la latlon et le rome correspondent', async () => {
      // Given
      const rechercheCharpentierANice = uneRecherche({
        id: '80b0a6fd-5c65-470f-8d2c-a2b500824e7a',
        idJeune,
        type: Recherche.Type.OFFRES_IMMERSION,
        criteres: {
          ...criteresImmersionNice,
          rome: 'charpentier'
        }
      })

      const rechercheBoulangerANice = uneRecherche({
        id: 'cda271d8-2d95-42a7-9c3B-47d142b55c39',
        idJeune,
        type: Recherche.Type.OFFRES_IMMERSION,
        criteres: {
          ...criteresImmersionNice,
          rome: 'boulanger'
        }
      })

      const rechercheBoulangerAParis = uneRecherche({
        id: 'cda271d8-2d95-42a7-9c3B-47d142b55c34',
        idJeune,
        type: Recherche.Type.OFFRES_IMMERSION,
        criteres: {
          ...criteresImmersionParis,
          rome: 'boulanger'
        }
      })
      await rechercheSqlRepository.createRecherche(rechercheCharpentierANice)
      await rechercheSqlRepository.createRecherche(rechercheBoulangerANice)
      await rechercheSqlRepository.createRecherche(rechercheBoulangerAParis)

      it('retourne la recherche de charpentier', async () => {
        // When
        const criteresASaintJeanCapFerrat: GetOffresImmersionQuery = {
          rome: 'charpentier',
          lat: 43.681503002546734,
          lon: 7.330287995125166
        }
        const recherches =
          await rechercheSqlRepository.trouverLesRecherchesImmersions(
            criteresASaintJeanCapFerrat,
            100,
            0
          )

        // Then
        expect(recherches.length).to.equal(1)
        expect(recherches[0]).to.deep.equal(rechercheCharpentierANice)
      })
    })

    describe('pagination', () => {
      it('pagine par rapport à la date de création', async () => {
        // Given
        const recherchesPaginees = creerDesRecherchesPourLaPagination(idJeune)
        for (const recherche of recherchesPaginees) {
          await rechercheSqlRepository.createRecherche(recherche)
        }

        const criteresASaintJeanCapFerrat: GetOffresImmersionQuery = {
          rome: 'charpentier',
          lat: 43.681503002546734,
          lon: 7.330287995125166
        }

        // When
        const recherchesPage1 =
          await rechercheSqlRepository.trouverLesRecherchesImmersions(
            criteresASaintJeanCapFerrat,
            10,
            0
          )
        const recherchesPage2 =
          await rechercheSqlRepository.trouverLesRecherchesImmersions(
            criteresASaintJeanCapFerrat,
            10,
            10
          )
        const recherchesPage3 =
          await rechercheSqlRepository.trouverLesRecherchesImmersions(
            criteresASaintJeanCapFerrat,
            10,
            20
          )

        // Then
        expect(recherchesPage1.length).to.be.equal(10)
        expect(recherchesPage1[0]).to.be.deep.equal(recherchesPaginees[0])
        expect(recherchesPage1[9]).to.be.deep.equal(recherchesPaginees[9])

        expect(recherchesPage2.length).to.be.equal(10)
        expect(recherchesPage2[0]).to.be.deep.equal(recherchesPaginees[10])
        expect(recherchesPage2[9]).to.be.deep.equal(recherchesPaginees[19])

        expect(recherchesPage3.length).to.be.equal(5)
        expect(recherchesPage3[0]).to.be.deep.equal(recherchesPaginees[20])
        expect(recherchesPage3[4]).to.be.deep.equal(recherchesPaginees[24])
      })
    })
  })
})

function creerDesRecherchesPourLaPagination(idJeune: string): Recherche[] {
  const recherches: Recherche[] = []
  const idService = new IdService()

  for (let i = 0; i < 25; i++) {
    recherches.push(
      uneRecherche({
        id: idService.uuid(),
        idJeune,
        dateCreation: uneDatetime.plus({ day: i }),
        type: Recherche.Type.OFFRES_IMMERSION,
        criteres: { ...criteresImmersionNice, rome: 'charpentier' }
      })
    )
  }

  return recherches
}

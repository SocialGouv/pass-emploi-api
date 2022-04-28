import { Authentification } from 'src/domain/authentification'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { unEvenementEngagement } from 'test/fixtures/sql-models/evenement-engagement.sql-model'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from 'test/fixtures/sql-models/favoris.sql-model'
import { Action } from '../../../src/domain/action'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune'
import { Recherche } from '../../../src/domain/recherche'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/recherche-sql.repository'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../../../src/infrastructure/sequelize/models/recherche.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  uneAutreDate,
  uneDatetime,
  uneDatetimeMoinsRecente
} from '../../fixtures/date.fixture'
import { unJeune, unJeuneSansConseiller } from '../../fixtures/jeune.fixture'
import {
  unDetailJeuneConseillerQueryModel,
  unDetailJeuneQueryModel,
  unJeuneQueryModel,
  unResumeActionDUnJeune
} from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('JeuneSqlRepository', () => {
  const databaseForTesting: DatabaseForTesting = DatabaseForTesting.prepare()
  const rechercheSqlRepository = new RechercheSqlRepository(
    databaseForTesting.sequelize
  )
  let jeuneSqlRepository: JeuneSqlRepository
  let idService: IdService
  let dateService: DateService

  beforeEach(async () => {
    jeuneSqlRepository = new JeuneSqlRepository(
      databaseForTesting.sequelize,
      idService,
      dateService
    )
  })

  describe('get', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = {
        ...unJeune(),
        tokenLastUpdate: uneDatetime
      }
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: conseillerDto.id,
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate()
        })
      )
    })
    describe('quand le jeune existe', () => {
      it('retourne le jeune', async () => {
        // When
        const result = await jeuneSqlRepository.get('ABCDE')

        // Then
        expect(result).to.deep.equal(jeune)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne undefined', async () => {
        // When
        const jeune = await jeuneSqlRepository.get('ZIZOU')

        // Then
        expect(jeune).to.equal(undefined)
      })
    })
  })

  describe('save', () => {
    beforeEach(async () => {
      // Given
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
    })
    describe("quand c'est un jeune", () => {
      it('crée le jeune', async () => {
        //Given
        const idJeune = 'test-save-jeune'
        // When
        await jeuneSqlRepository.save(unJeune({ id: idJeune }))

        // Then
        const jeune = await JeuneSqlModel.findByPk(idJeune)
        expect(jeune?.id).to.equal(idJeune)
      })
    })

    describe("quand c'est un jeune existant", () => {
      it('met à jour les informations du jeune', async () => {
        //Given
        const idJeune = 'test-save-jeune'
        const idDossier = 'test-id-dossier'
        // When
        await jeuneSqlRepository.save(unJeune({ id: idJeune }))
        await jeuneSqlRepository.save(
          unJeune({
            id: idJeune,
            idDossier
          })
        )

        // Then
        const jeune = await JeuneSqlModel.findByPk(idJeune)
        expect(jeune?.id).to.equal(idJeune)
        expect(jeune?.idDossier).to.equal(idDossier)
      })
    })
  })

  describe('getJeunes', () => {
    let jeune1: Jeune
    let jeune2: Jeune

    beforeEach(async () => {
      // Given
      jeune1 = unJeuneSansConseiller({ id: '1' })
      jeune2 = unJeuneSansConseiller({ id: '2' })
      const jeune1Dto = unJeuneDto({
        id: '1',
        dateCreation: jeune2.creationDate.toJSDate(),
        pushNotificationToken: 'unToken',
        dateDerniereActualisationToken: uneDatetime.toJSDate()
      })
      delete jeune1Dto.idConseiller
      await JeuneSqlModel.creer(jeune1Dto)
      const jeune2Dto = unJeuneDto({
        id: '2',
        idConseiller: undefined,
        dateCreation: jeune2.creationDate.toJSDate(),
        pushNotificationToken: 'unToken',
        dateDerniereActualisationToken: uneDatetime.toJSDate()
      })
      delete jeune2Dto.idConseiller
      await JeuneSqlModel.creer(jeune2Dto)
    })
    describe('quand les jeunes existent', () => {
      it('retourne la liste des jeunes', async () => {
        // When
        const result = await jeuneSqlRepository.getJeunes(['1', '2'])

        // Then
        expect(result.length).to.equal(2)
        expect(result).to.deep.include.members([jeune1, jeune2])
      })
    })

    describe("quand aucun jeune n'existe", () => {
      it('retourne une liste vide', async () => {
        // When
        const result = await jeuneSqlRepository.getJeunes(['FAUX_ID'])

        // Then
        expect(result).to.deep.equal([])
      })
    })
  })

  describe('existe', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = {
        ...unJeune(),
        tokenLastUpdate: uneDatetime
      }
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: conseillerDto.id,
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate()
        })
      )
    })
    describe('quand le jeune existe', () => {
      it('retourne true', async () => {
        // When
        const result = await jeuneSqlRepository.existe('ABCDE')

        // Then
        expect(result).to.deep.equal(true)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('retourne false', async () => {
        // When
        const jeune = await jeuneSqlRepository.existe('ZIZOU')

        // Then
        expect(jeune).to.equal(false)
      })
    })
  })

  describe('getByEmail', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = unJeuneSansConseiller()
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: undefined,
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate()
        })
      )
    })

    describe('quand un jeune existe avec cet email', () => {
      it('retourne le jeune', async () => {
        // When
        const result = await jeuneSqlRepository.getByEmail('john.doe@plop.io')

        // Then
        expect(result).to.deep.equal(jeune)
      })
    })

    describe("quand aucun jeune n'existe avec cet email", () => {
      it('retourne undefined', async () => {
        // When
        const jeune = await jeuneSqlRepository.getByEmail('noreply@plop.io')

        // Then
        expect(jeune).to.equal(undefined)
      })
    })
  })

  describe('getByIdDossier', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = { ...unJeuneSansConseiller(), idDossier: 'test-id-dossier' }
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: undefined,
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate(),
          idDossier: 'test-id-dossier'
        })
      )
    })

    describe('quand un jeune existe avec cet id dossier', () => {
      it('retourne le jeune', async () => {
        // When
        const result = await jeuneSqlRepository.getByIdDossier(
          'test-id-dossier'
        )

        // Then
        expect(result).to.deep.equal(jeune)
      })
    })

    describe("quand aucun jeune n'existe avec cet email", () => {
      it('retourne undefined', async () => {
        // When
        const jeune = await jeuneSqlRepository.getByIdDossier(
          'test-id-dossier-inconnu'
        )

        // Then
        expect(jeune).to.equal(undefined)
      })
    })
  })

  describe('getDetailJeuneQueryModelById', () => {
    describe("quand il n'y a pas eu de transfert", () => {
      const idJeune = '1'
      const idConseiller = '1'
      it('retourne un jeune avec son conseiller avec la date de creation du jeune', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )

        // When
        const actual = await jeuneSqlRepository.getDetailJeuneQueryModelById(
          idJeune
        )
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: new Date(
              unDetailJeuneQueryModel().creationDate
            ).toISOString()
          }
        })
        expect(actual).to.deep.equal(expected)
      })
    })
    describe('quand il y a eu un transfert', () => {
      const idJeune = '1'
      const idConseiller = '1'
      it('retourne un jeune avec son conseiller avec la date du transfert', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const idConseillerSource = '2'
        const unAutreconseillerDto = unConseillerDto({ id: idConseillerSource })
        await ConseillerSqlModel.creer(unAutreconseillerDto)

        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )
        const dateTransfert = uneAutreDate()
        const unTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
          dateTransfert,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource
        }
        await TransfertConseillerSqlModel.creer(unTransfert)

        // When
        const actual = await jeuneSqlRepository.getDetailJeuneQueryModelById(
          idJeune
        )
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: dateTransfert.toISOString()
          }
        })
        expect(actual).to.deep.equal(expected)
      })
    })
    describe('quand il y a eu plusieurs transferts', () => {
      const idJeune = '1'
      const idConseiller = '1'
      it('retourne un jeune avec son conseiller avec la date du dernier transfert', async () => {
        // Given
        const conseillerDto = unConseillerDto({ id: idConseiller })
        await ConseillerSqlModel.creer(conseillerDto)
        const idConseillerSource = '2'
        const unAutreconseillerDto = unConseillerDto({ id: idConseillerSource })
        await ConseillerSqlModel.creer(unAutreconseillerDto)
        const idConseillerSource2 = '3'
        const encoreUnAutreconseillerDto = unConseillerDto({
          id: idConseillerSource2
        })
        await ConseillerSqlModel.creer(encoreUnAutreconseillerDto)

        await JeuneSqlModel.creer(
          unJeuneDto({
            id: idJeune,
            idConseiller
          })
        )
        const dateTransfert1 = new Date('2022-04-02T03:24:00')
        const unTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
          dateTransfert: dateTransfert1,
          idJeune,
          idConseillerCible: idConseillerSource,
          idConseillerSource: idConseillerSource2
        }
        await TransfertConseillerSqlModel.creer(unTransfert)
        const dateTransfert2 = new Date('2022-04-08T03:24:00')
        const unAutreTransfert: AsSql<TransfertConseillerDto> = {
          id: '070fa845-7316-496e-b96c-b69c2a1f4ce9',
          dateTransfert: dateTransfert2,
          idJeune,
          idConseillerCible: idConseiller,
          idConseillerSource
        }
        await TransfertConseillerSqlModel.creer(unAutreTransfert)

        // When
        const actual = await jeuneSqlRepository.getDetailJeuneQueryModelById(
          idJeune
        )
        // Then
        const expected = unDetailJeuneQueryModel({
          id: idJeune,
          conseiller: {
            email: conseillerDto.email!,
            nom: conseillerDto.nom,
            prenom: conseillerDto.prenom,
            depuis: dateTransfert2.toISOString()
          }
        })
        expect(actual).to.deep.equal(expected)
      })
    })
  })

  describe('getQueryModelByIdDossier', () => {
    const idJeune = 'test'
    const idDossier = '1'
    const idConseiller = '1'
    it('retourne un jeune quand le conseiller est le bon', async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: idJeune,
          idDossier,
          idConseiller
        })
      )

      // When
      const actual = await jeuneSqlRepository.getJeuneQueryModelByIdDossier(
        idDossier,
        idConseiller
      )
      // Then
      expect(actual).to.deep.equal(unJeuneQueryModel({ id: idJeune }))
    })
    it("retourne undefined quand le conseiller n'est pas le bon", async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: idJeune,
          idDossier,
          idConseiller
        })
      )

      // When
      const actual = await jeuneSqlRepository.getJeuneQueryModelByIdDossier(
        idDossier,
        'fake-id-conseiller'
      )
      // Then
      expect(actual).to.equal(undefined)
    })
  })

  describe('supprimer', () => {
    it('supprime le jeune', async () => {
      // Given
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller: conseillerDto.id }))

      // When
      await expect(await jeuneSqlRepository.get('ABCDE')).not.to.be.undefined
      await jeuneSqlRepository.supprimer('ABCDE')

      // Then
      await expect(await jeuneSqlRepository.get('ABCDE')).to.be.undefined
    })

    describe('supprime toutes les dépendences au jeune', () => {
      // Given - When
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      const jeuneDto = unJeuneDto({ idConseiller: conseillerDto.id })
      const actionDto = uneActionDto({ idJeune: jeuneDto.id })
      const rechercheEmploi = uneRecherche({
        idJeune: jeuneDto.id,
        type: Recherche.Type.OFFRES_EMPLOI,
        criteres: {}
      })
      const RendezVousDto = unRendezVousDto({ idJeune: jeuneDto.id })
      const favoriOffreEmploi = unFavoriOffreEmploi({ idJeune: jeuneDto.id })
      const favoriOffreEngagement = unFavoriOffreEngagement({
        idJeune: jeuneDto.id
      })
      const favoriOffreImmersion = unFavoriOffreImmersion({
        idJeune: jeuneDto.id
      })
      const unTransfertDto: AsSql<TransfertConseillerDto> = {
        id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
        dateTransfert: new Date('2022-04-02T03:24:00'),
        idJeune: jeuneDto.id,
        idConseillerCible: conseillerDto.id,
        idConseillerSource: conseillerDto.id
      }
      const evenementEngagement = unEvenementEngagement({
        idUtilisateur: jeuneDto.id
      })
      beforeEach(async () => {
        await ConseillerSqlModel.creer(conseillerDto)
        await JeuneSqlModel.creer(jeuneDto)
        await ActionSqlModel.creer(actionDto)
        await rechercheSqlRepository.createRecherche(rechercheEmploi)
        await RendezVousSqlModel.create(RendezVousDto)
        await FavoriOffreEmploiSqlModel.create(favoriOffreEmploi)
        await FavoriOffreEngagementSqlModel.create(favoriOffreEngagement)
        await FavoriOffreImmersionSqlModel.create(favoriOffreImmersion)
        await TransfertConseillerSqlModel.create(unTransfertDto)
        await EvenementEngagementSqlModel.create(evenementEngagement)

        await jeuneSqlRepository.supprimer('ABCDE')
      })

      it('supprime le jeune', async () => {
        await expect(await jeuneSqlRepository.get('ABCDE')).to.be.undefined
      })
      it('supprime les actions du jeune', async () => {
        await expect(await ActionSqlModel.findByPk(actionDto.id)).to.be.null
      })
      it('supprime les recherches du jeune', async () => {
        await expect(await RechercheSqlModel.findByPk(rechercheEmploi.id)).to.be
          .null
      })
      it('supprime les rendez-vous du jeune', async () => {
        await expect(await RendezVousSqlModel.findByPk(RendezVousDto.id)).to.be
          .null
      })
      it('supprime les transferts du jeune', async () => {
        await expect(
          await TransfertConseillerSqlModel.findByPk(unTransfertDto.id)
        ).to.be.null
      })
      it('supprime les favoris emploi du jeune', async () => {
        await expect(
          await FavoriOffreEmploiSqlModel.findByPk(favoriOffreEmploi.id)
        ).to.be.null
      })
      it('supprime les favoris engagement du jeune', async () => {
        await expect(
          await FavoriOffreEngagementSqlModel.findByPk(favoriOffreEngagement.id)
        ).to.be.null
      })
      it('supprime les favoris immersion du jeune', async () => {
        await expect(
          await FavoriOffreImmersionSqlModel.findByPk(favoriOffreImmersion.id)
        ).to.be.null
      })
      it('ne supprime pas le conseiller du jeune', async () => {
        await expect(await ConseillerSqlModel.findByPk(conseillerDto.id)).to.not
          .be.null
      })
      it("ne supprime pas les evenements d'engagement du jeune", async () => {
        await expect(
          await EvenementEngagementSqlModel.findByPk(evenementEngagement.id)
        ).not.to.be.null
      })
    })
  })

  describe('getAllQueryModelsByConseiller', () => {
    const idConseiller = '1'
    it("retourne les jeunes d'un conseiller", async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller }))

      // When
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )
      // Then
      expect(actual).to.deep.equal([unDetailJeuneConseillerQueryModel()])
    })
    it("retourne les jeunes d'un conseiller avec la date d'evenement d'engagement", async () => {
      // Given
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenement = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement
      })

      // When
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      // Then
      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneConseillerQueryModel(),
          lastActivity: dateEvenement.toISOString()
        }
      ])
    })
    it("retourne les jeunes d'un conseiller avec la date du DERNIER evenement d'engagement", async () => {
      // Given
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenementRecent = uneDatetime.toJSDate()
      const dateEvenementAncien = uneDatetimeMoinsRecente.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement: dateEvenementAncien
      })
      await EvenementEngagementSqlModel.create({
        idUtilisateur: jeune.id,
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement: dateEvenementRecent
      })

      // When
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      // Then
      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneConseillerQueryModel(),
          lastActivity: dateEvenementRecent.toISOString()
        }
      ])
    })
    it("retourne les jeunes d'un conseiller sans la date d'evenement d'engagement", async () => {
      // Given
      const jeune = unJeuneDto({ idConseiller })
      const dateEvenement = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(jeune)
      await EvenementEngagementSqlModel.create({
        idUtilisateur: 'faux-id',
        typeUtilisateur: Authentification.Type.JEUNE,
        dateEvenement
      })

      // When
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseiller
      )

      // Then
      expect(actual).to.deep.equal([unDetailJeuneConseillerQueryModel()])
    })
    it("retourne tableau vide quand le conseiller n'existe pas", async () => {
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        'id-inexistant'
      )

      expect(actual).to.deep.equal([])
    })
    it("retourne les jeunes d'un conseiller avec l'email du conseiller precedent en prenant le dernier transfert", async () => {
      // Given
      const idConseillerSource = '1'
      const idConseillerCible = '2'
      const idDernierConseillerPrecedent = '43'
      const idJeune = '1'
      const jeune = unJeuneDto({
        id: idJeune,
        idConseiller: idConseillerCible
      })
      const dateTransfert = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: idConseillerSource,
          email: '1@1.com'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: idConseillerCible,
          email: '2@2.com'
        })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: idDernierConseillerPrecedent,
          email: '43@43.com'
        })
      )
      await JeuneSqlModel.creer(jeune)
      await TransfertConseillerSqlModel.create({
        id: '39d6cbf4-8507-11ec-a8a3-0242ac120002',
        idConseillerSource,
        idConseillerCible,
        idJeune,
        dateTransfert
      })
      await TransfertConseillerSqlModel.create({
        id: '39d6cbf4-8507-11ec-a8a3-0242ac120003',
        idConseillerSource: idDernierConseillerPrecedent,
        idConseillerCible,
        idJeune,
        dateTransfert: uneDatetime.plus({ week: 1 }).toJSDate()
      })

      // When
      const actual = await jeuneSqlRepository.getAllQueryModelsByConseiller(
        idConseillerCible
      )

      // Then
      expect(actual).to.deep.equal([
        {
          ...unDetailJeuneConseillerQueryModel({ id: idJeune }),
          conseillerPrecedent: {
            email: '43@43.com',
            nom: 'Tavernier',
            prenom: 'Nils'
          }
        }
      ])
    })
  })

  describe('.getResumeActionsDesJeunesDuConseiller(idConseiller)', () => {
    it('renvoie les resumés des actions des jeunes du conseiller', async () => {
      // Given
      const idConseiller = '1'
      await ConseillerSqlModel.creer(unConseillerDto({ id: idConseiller }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'ABCDE',
          idConseiller
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'FGHIJ',
          idConseiller
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'ABCDE',
          statut: Action.Statut.PAS_COMMENCEE
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'ABCDE',
          statut: Action.Statut.EN_COURS
        })
      )
      await ActionSqlModel.creer(
        uneActionDto({
          idJeune: 'FGHIJ',
          statut: Action.Statut.TERMINEE
        })
      )

      // When
      const actual =
        await jeuneSqlRepository.getResumeActionsDesJeunesDuConseiller(
          idConseiller
        )

      // Then
      expect(actual).to.have.deep.members([
        unResumeActionDUnJeune({
          jeuneId: 'ABCDE',
          todoActionsCount: 1,
          inProgressActionsCount: 1,
          doneActionsCount: 0
        }),
        unResumeActionDUnJeune({
          jeuneId: 'FGHIJ',
          todoActionsCount: 0,
          doneActionsCount: 1
        })
      ])
    })
  })
})

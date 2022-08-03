import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { uneSituationsMiloDto } from 'test/fixtures/milo.fixture'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { unEvenementEngagement } from 'test/fixtures/sql-models/evenement-engagement.sql-model'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from 'test/fixtures/sql-models/favoris.sql-model'
import { Core } from '../../../../src/domain/core'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { Recherche } from '../../../../src/domain/recherche'
import { JeuneSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { RechercheSqlRepository } from '../../../../src/infrastructure/repositories/recherche-sql.repository.db'
import { ActionSqlModel } from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../../../../src/infrastructure/sequelize/models/recherche.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { uneDatetime } from '../../../fixtures/date.fixture'
import {
  unConseillerDuJeune,
  unJeune,
  unJeuneSansConseiller
} from '../../../fixtures/jeune.fixture'
import { uneRecherche } from '../../../fixtures/recherche.fixture'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { DatabaseForTesting } from '../../../utils/database-for-testing'
import { FirebaseClient } from '../../../../src/infrastructure/clients/firebase-client'

describe('JeuneSqlRepository', () => {
  const uuid = '9e1a7d9f-4038-4631-9aa1-856ee90c7ff8'
  const databaseForTesting = DatabaseForTesting.prepare()
  const rechercheSqlRepository = new RechercheSqlRepository(
    databaseForTesting.sequelize
  )
  let firebaseClient: StubbedClass<FirebaseClient>
  let jeuneSqlRepository: JeuneSqlRepository
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>

  beforeEach(async () => {
    firebaseClient = stubClass(FirebaseClient)
    idService = stubClass(IdService)
    idService.uuid.returns(uuid)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(uneDatetime.toJSDate())
    jeuneSqlRepository = new JeuneSqlRepository(
      databaseForTesting.sequelize,
      firebaseClient,
      idService,
      dateService
    )
  })

  describe('get', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = unJeune({ configuration: undefined })
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: conseillerDto.id,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: uneDatetime.toJSDate()
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

  describe('findAllJeunesByConseiller', () => {
    const conseiller = unConseiller({ id: 'test' })
    const conseiller3 = unConseiller({ id: 'test3' })
    const jeune1Id = '1'
    const jeune2Id = '2'
    const jeune3Id = '3'

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: conseiller.id }))
      await ConseillerSqlModel.creer(unConseillerDto({ id: conseiller3.id }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune1Id,
          idConseiller: conseiller.id
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune2Id,
          idConseiller: conseiller.id
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune3Id,
          idConseiller: conseiller3.id
        })
      )
    })

    describe('quand les jeunes existent', () => {
      it('retourne la liste des jeunes', async () => {
        // When
        const result = await jeuneSqlRepository.findAllJeunesByConseiller(
          [jeune1Id, jeune2Id, jeune3Id],
          conseiller.id
        )

        // Then
        expect(result.length).to.equal(2)
        expect(result[0].id).to.equal(jeune1Id)
        expect(result[1].id).to.equal(jeune2Id)
      })
    })

    describe("quand aucun jeune n'existe", () => {
      it('retourne une liste vide', async () => {
        // When
        const result = await jeuneSqlRepository.findAllJeunesByConseiller(
          ['FAUX_ID'],
          conseiller.id
        )

        // Then
        expect(result).to.deep.equal([])
      })
    })
  })

  describe('findAllJeunesByConseillerInitial', () => {
    const conseiller = unConseiller({ id: 'test' })
    const conseiller3 = unConseiller({ id: 'test3' })
    const jeune1Id = '1'
    const jeune2Id = '2'
    const jeune3Id = '3'

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto({ id: conseiller.id }))
      await ConseillerSqlModel.creer(unConseillerDto({ id: conseiller3.id }))
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune1Id,
          idConseiller: conseiller3.id,
          idConseillerInitial: conseiller.id
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune2Id,
          idConseiller: conseiller3.id,
          idConseillerInitial: conseiller.id
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune3Id,
          idConseiller: conseiller3.id
        })
      )
    })

    describe('quand les jeunes existent', () => {
      it('retourne la liste des jeunes', async () => {
        // When
        const result =
          await jeuneSqlRepository.findAllJeunesByConseillerInitial(
            conseiller.id
          )

        // Then
        expect(result.length).to.equal(2)
        expect(result[0].id).to.equal(jeune1Id)
        expect(result[1].id).to.equal(jeune2Id)
      })
    })

    describe("quand aucun jeune n'existe", () => {
      it('retourne une liste vide', async () => {
        // When
        const result =
          await jeuneSqlRepository.findAllJeunesByConseillerInitial('FAUX_ID')

        // Then
        expect(result).to.deep.equal([])
      })
    })
  })

  describe('existe', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = unJeune()
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
      jeune = { ...unJeuneSansConseiller(), configuration: undefined }
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: undefined,
          dateCreation: jeune.creationDate.toJSDate()
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
      jeune = {
        ...unJeuneSansConseiller(),
        idDossier: 'test-id-dossier',
        configuration: undefined
      }
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: undefined,
          dateCreation: jeune.creationDate.toJSDate(),
          pushNotificationToken: 'unToken',
          dateDerniereActualisationToken: uneDatetime.toJSDate(),
          idDossier: 'test-id-dossier',
          datePremiereConnexion: uneDatetime.toJSDate()
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

  describe('getJeunesMilo', () => {
    const idJeuneTest = 'jeune-a-retrouver'

    beforeEach(async () => {
      // Given
      await JeuneSqlModel.bulkCreate([
        unJeuneDto({
          id: 'jeune-pas-milo',
          idConseiller: undefined,
          structure: Core.Structure.POLE_EMPLOI,
          idDossier: undefined
        }),
        unJeuneDto({
          id: 'jeune-sans-id-dossier',
          idConseiller: undefined,
          structure: Core.Structure.MILO,
          idDossier: undefined
        }),
        unJeuneDto({
          id: idJeuneTest,
          idConseiller: undefined,
          structure: Core.Structure.MILO,
          idDossier: 'test-id-dossier'
        })
      ])
    })

    describe('quand un jeune Milo existe avec id dossier', () => {
      it('retourne les jeunes', async () => {
        // When
        const result = await jeuneSqlRepository.getJeunesMilo(0, 10)

        // Then
        expect(result.length).to.equal(1)
        expect(result[0].id).to.equal(idJeuneTest)
      })
    })
    describe('quand la pagination atteint la limite', () => {
      it('retourne liste vide', async () => {
        // When
        const result = await jeuneSqlRepository.getJeunesMilo(1, 1)

        // Then
        expect(result).to.deep.equal([])
      })
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
      const rendezVousDto = unRendezVousDto()
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
      const situations = uneSituationsMiloDto({ idJeune: jeuneDto.id })

      beforeEach(async () => {
        await ConseillerSqlModel.creer(conseillerDto)
        await JeuneSqlModel.creer(jeuneDto)
        await ActionSqlModel.creer(actionDto)
        await rechercheSqlRepository.createRecherche(rechercheEmploi)
        await RendezVousSqlModel.create(rendezVousDto)
        await RendezVousJeuneAssociationSqlModel.create({
          idRendezVous: rendezVousDto.id,
          idJeune: jeuneDto.id
        })
        await FavoriOffreEmploiSqlModel.create(favoriOffreEmploi)
        await FavoriOffreEngagementSqlModel.create(favoriOffreEngagement)
        await FavoriOffreImmersionSqlModel.create(favoriOffreImmersion)
        await TransfertConseillerSqlModel.create(unTransfertDto)
        await EvenementEngagementSqlModel.create(evenementEngagement)
        await SituationsMiloSqlModel.create(situations)

        await jeuneSqlRepository.supprimer(jeuneDto.id)
      })

      it('supprime le jeune', async () => {
        await expect(await jeuneSqlRepository.get(jeuneDto.id)).to.be.undefined
      })
      it('supprime les actions du jeune', async () => {
        await expect(await ActionSqlModel.findByPk(actionDto.id)).to.be.null
      })
      it('supprime les recherches du jeune', async () => {
        await expect(await RechercheSqlModel.findByPk(rechercheEmploi.id)).to.be
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
        await expect(await ConseillerSqlModel.findByPk(conseillerDto.id)).not.to
          .be.null
      })
      it("supprime l'association rendez-vous jeune", async () => {
        await expect(
          await RendezVousJeuneAssociationSqlModel.findAll({
            where: { idJeune: jeuneDto.id }
          })
        ).to.deep.equal([])
      })
      it('ne supprime pas le rendez-vous', async () => {
        await expect(await RendezVousSqlModel.findByPk(rendezVousDto.id)).not.to
          .be.null
      })
      it("ne supprime pas les evenements d'engagement du jeune", async () => {
        await expect(
          await EvenementEngagementSqlModel.findByPk(evenementEngagement.id)
        ).not.to.be.null
      })
      it('supprime les situations du jeune', async () => {
        await expect(
          await SituationsMiloSqlModel.findAll({
            where: { idJeune: jeuneDto.id }
          })
        ).to.deep.equal([])
      })
    })
  })

  describe('transferAndSaveAll', () => {
    beforeEach(async () => {
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: 'idConseillerCible' })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: 'idConseillerSource' })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: 'unJeuneATransferer',
          idConseiller: 'idConseillerSource'
        })
      )
    })

    describe("quand le jeune n'était pas en transfert temporaire", () => {
      describe('quand le jeune est transféré de manière définitive', () => {
        it('transfère les chats, crée des transferts, met à jour le jeune avec son conseiller', async () => {
          // Given
          const jeuneATransferer: Jeune = unJeune({
            id: 'unJeuneATransferer',
            conseiller: unConseillerDuJeune({ id: 'idConseillerCible' }),
            configuration: undefined
          })

          // When
          await jeuneSqlRepository.transferAndSaveAll(
            [jeuneATransferer],
            'idConseillerCible',
            'idConseillerSource'
          )

          // Then
          expect(firebaseClient.transfererChat).to.have.been.calledWithExactly(
            'idConseillerCible',
            ['unJeuneATransferer']
          )

          const jeune = await jeuneSqlRepository.get('unJeuneATransferer')
          expect(jeune).to.be.deep.equal(jeuneATransferer)
          expect(jeune?.conseillerInitial).to.be.undefined()

          const transfertsSql = await TransfertConseillerSqlModel.findAll()
          expect(transfertsSql).to.have.length(1)
          expect(transfertsSql[0].idConseillerSource).to.equal(
            'idConseillerSource'
          )
          expect(transfertsSql[0].idConseillerCible).to.equal(
            'idConseillerCible'
          )
          expect(transfertsSql[0].id).to.equal(uuid)
          expect(transfertsSql[0].dateTransfert).to.deep.equal(
            uneDatetime.toJSDate()
          )
        })
      })
      describe('quand le jeune est transféré de manière temporaire', () => {
        it('met à jour le jeune avec son conseiller et son conseiller initial', async () => {
          // Given
          const jeuneATransferer: Jeune = unJeune({
            id: 'unJeuneATransferer',
            conseiller: unConseillerDuJeune({ id: 'idConseillerCible' }),
            conseillerInitial: {
              id: 'idConseillerSource'
            }
          })

          // When
          await jeuneSqlRepository.transferAndSaveAll(
            [jeuneATransferer],
            'idConseillerCible',
            'idConseillerSource'
          )

          // Then
          const jeune = await jeuneSqlRepository.get('unJeuneATransferer')
          expect(jeune?.conseillerInitial).to.be.deep.equal({
            id: 'idConseillerSource'
          })
        })
      })
    })

    describe('quand le jeune était en transfert temporaire', () => {
      describe('quand le jeune est transféré de manière définitive', () => {
        it('met le conseiller initial à null', async () => {
          // Given
          await JeuneSqlModel.creer(
            unJeuneDto({
              id: 'jeune-en-transfert',
              idConseiller: 'idConseillerSource',
              idConseillerInitial: 'idConseillerCible'
            })
          )
          const jeuneATransferer: Jeune = unJeune({
            id: 'jeune-en-transfert',
            conseiller: unConseillerDuJeune({ id: 'idConseillerCible' }),
            configuration: undefined
          })

          // When
          await jeuneSqlRepository.transferAndSaveAll(
            [jeuneATransferer],
            'idConseillerCible',
            'idConseillerSource'
          )

          // Then
          const jeune = await jeuneSqlRepository.get('jeune-en-transfert')
          expect(jeune).to.be.deep.equal(jeuneATransferer)
          expect(jeune?.conseillerInitial).to.be.undefined()
        })
      })
    })
  })
})

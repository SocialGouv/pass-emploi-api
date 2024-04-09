import { DateTime } from 'luxon'
import { before } from 'mocha'
import { JeuneMiloAArchiverSqlModel } from 'src/infrastructure/sequelize/models/jeune-milo-a-archiver.sql-model'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { SituationsMiloSqlModel } from 'src/infrastructure/sequelize/models/situations-milo.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { unConseiller } from 'test/fixtures/conseiller.fixture'
import { uneSituationsMiloDto } from 'test/fixtures/milo.fixture'
import { unEvenementEngagementDto } from 'test/fixtures/sql-models/evenement-engagement.sql-model'
import {
  unFavoriOffreEmploi,
  unFavoriOffreEngagement,
  unFavoriOffreImmersion
} from 'test/fixtures/sql-models/favoris.sql-model'
import { Core } from '../../../../src/domain/core'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { Recherche } from '../../../../src/domain/offre/recherche/recherche'
import { FirebaseClient } from '../../../../src/infrastructure/clients/firebase-client'
import { JeuneSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { RechercheSqlRepository } from '../../../../src/infrastructure/repositories/offre/recherche/recherche-sql.repository.db'
import { ActionSqlModel } from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { FavoriOffreEmploiSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-emploi.sql-model'
import { FavoriOffreEngagementSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-engagement.sql-model'
import { FavoriOffreImmersionSqlModel } from '../../../../src/infrastructure/sequelize/models/favori-offre-immersion.sql-model'
import {
  JeuneDto,
  JeuneSqlModel
} from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RechercheSqlModel } from '../../../../src/infrastructure/sequelize/models/recherche.sql-model'
import { RendezVousSqlModel } from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { uneDatetime } from '../../../fixtures/date.fixture'
import {
  unConseillerDuJeune,
  unJeune,
  unJeuneSansConseiller,
  uneConfiguration
} from '../../../fixtures/jeune.fixture'
import { uneRecherche } from '../../../fixtures/recherche.fixture'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { StubbedClass, expect, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { uneStructureMiloDto } from '../../../fixtures/sql-models/structureMilo.sql-model'
import { EvenementEngagementHebdoSqlModel } from '../../../../src/infrastructure/sequelize/models/evenement-engagement-hebdo.sql-model'

describe('JeuneSqlRepository', () => {
  const uuid = '9e1a7d9f-4038-4631-9aa1-856ee90c7ff8'
  let databaseForTesting: DatabaseForTesting
  let rechercheSqlRepository: RechercheSqlRepository
  let firebaseClient: StubbedClass<FirebaseClient>
  let jeuneSqlRepository: JeuneSqlRepository
  let idService: StubbedClass<IdService>
  let dateService: StubbedClass<DateService>

  before(() => {
    databaseForTesting = getDatabase()
  })

  beforeEach(async () => {
    await databaseForTesting.cleanPG()
    rechercheSqlRepository = new RechercheSqlRepository(
      databaseForTesting.sequelize
    )
    firebaseClient = stubClass(FirebaseClient)
    idService = stubClass(IdService)
    idService.uuid.returns(uuid)
    dateService = stubClass(DateService)
    dateService.nowJs.returns(uneDatetime().toJSDate())
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
      jeune = unJeune({
        conseiller: unConseillerDuJeune({ idAgence: undefined })
      })
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: conseillerDto.id,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: jeune.datePremiereConnexion!.toJSDate()
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

  describe('findAll', () => {
    let jeune: Jeune

    beforeEach(async () => {
      // Given
      jeune = unJeune({
        conseiller: unConseillerDuJeune({ idAgence: undefined })
      })
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: conseillerDto.id,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: jeune.datePremiereConnexion!.toJSDate()
        })
      )
    })
    it('retourne les jeunes', async () => {
      // When
      const result = await jeuneSqlRepository.findAll(['ABCDE'])

      // Then
      expect(result).to.deep.equal([jeune])
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
            idPartenaire: idDossier
          })
        )

        // Then
        const jeune = await JeuneSqlModel.findByPk(idJeune)
        expect(jeune?.id).to.equal(idJeune)
        expect(jeune?.idPartenaire).to.equal(idDossier)
      })
    })
  })

  describe('findAllJeunesByIdsAndConseiller', () => {
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
        const result = await jeuneSqlRepository.findAllJeunesByIdsAndConseiller(
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
        const result = await jeuneSqlRepository.findAllJeunesByIdsAndConseiller(
          ['FAUX_ID'],
          conseiller.id
        )

        // Then
        expect(result).to.deep.equal([])
      })
    })
  })

  describe('findAllJeunesByIdsAuthentificationAndStructures', () => {
    const conseiller = unConseiller({ id: 'test' })
    const jeune1Id = '1'
    const jeune2Id = '2'
    const jeune3Id = '3'

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(
        unConseillerDto({
          id: conseiller.id,
          idAuthentification: 'id-auth-conseiller-1'
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune1Id,
          idConseiller: conseiller.id,
          idAuthentification: 'id-auth-1',
          structure: Core.Structure.POLE_EMPLOI
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune2Id,
          idConseiller: conseiller.id,
          idAuthentification: 'id-auth-2',
          structure: Core.Structure.POLE_EMPLOI_BRSA
        })
      )
      await JeuneSqlModel.creer(
        unJeuneDto({
          id: jeune3Id,
          idConseiller: conseiller.id,
          idAuthentification: 'id-auth-3'
        })
      )
    })

    describe('quand les jeunes existent', () => {
      it('retourne la liste des jeunes', async () => {
        // When
        const result =
          await jeuneSqlRepository.findAllJeunesByIdsAuthentificationAndStructures(
            ['id-auth-1', 'id-auth-2', 'id-auth-3'],
            Core.structuresPoleEmploiBRSA
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
          await jeuneSqlRepository.findAllJeunesByIdsAuthentificationAndStructures(
            ['FAUX_ID'],
            Core.structuresPoleEmploiBRSA
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
          dateDerniereActualisationToken: uneDatetime().toJSDate()
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
      jeune = { ...unJeuneSansConseiller() }
      await JeuneSqlModel.creer(
        unJeuneDto({
          idConseiller: undefined,
          dateCreation: jeune.creationDate.toJSDate(),
          datePremiereConnexion: jeune.datePremiereConnexion!.toJSDate()
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

  describe('supprimer', () => {
    it('supprime le jeune', async () => {
      // Given
      const conseillerDto = unConseillerDto({
        structure: Core.Structure.POLE_EMPLOI
      })
      await ConseillerSqlModel.creer(conseillerDto)
      await JeuneSqlModel.creer(unJeuneDto({ idConseiller: conseillerDto.id }))

      // When
      expect(await jeuneSqlRepository.get('ABCDE')).not.to.be.undefined()
      await jeuneSqlRepository.supprimer('ABCDE')

      // Then
      expect(await jeuneSqlRepository.get('ABCDE')).to.be.undefined()
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
        idConseillerSource: conseillerDto.id,
        idConseillerQuiTransfert: null,
        typeTransfert: null,
        emailJeune: null
      }
      const evenementEngagement = unEvenementEngagementDto({
        idUtilisateur: jeuneDto.id
      })
      const situations = uneSituationsMiloDto({ idJeune: jeuneDto.id })

      beforeEach(async () => {
        await ConseillerSqlModel.creer(conseillerDto)
        await JeuneSqlModel.creer(jeuneDto)
        await ActionSqlModel.creer(actionDto)
        await rechercheSqlRepository.save(rechercheEmploi)
        await RendezVousSqlModel.create(rendezVousDto)
        await RendezVousJeuneAssociationSqlModel.create({
          idRendezVous: rendezVousDto.id,
          idJeune: jeuneDto.id
        })
        await FavoriOffreEmploiSqlModel.create(favoriOffreEmploi)
        await FavoriOffreEngagementSqlModel.create(favoriOffreEngagement)
        await FavoriOffreImmersionSqlModel.create(favoriOffreImmersion)
        await TransfertConseillerSqlModel.create(unTransfertDto)
        await EvenementEngagementHebdoSqlModel.create(evenementEngagement)
        await SituationsMiloSqlModel.create(situations)
        // await JeuneMiloAArchiverSqlModel.create({ idJeune: jeuneDto.id })

        await jeuneSqlRepository.supprimer(jeuneDto.id)
      })

      it('supprime le jeune', async () => {
        expect(await jeuneSqlRepository.get(jeuneDto.id)).to.be.undefined()
      })
      it('supprime les actions du jeune', async () => {
        expect(await ActionSqlModel.findByPk(actionDto.id)).to.be.null()
      })
      it('supprime les recherches du jeune', async () => {
        expect(
          await RechercheSqlModel.findByPk(rechercheEmploi.id)
        ).to.be.null()
      })
      it('supprime les transferts du jeune', async () => {
        expect(
          await TransfertConseillerSqlModel.findByPk(unTransfertDto.id)
        ).to.be.null()
      })
      it('supprime les favoris emploi du jeune', async () => {
        expect(
          await FavoriOffreEmploiSqlModel.findByPk(favoriOffreEmploi.id)
        ).to.be.null()
      })
      it('supprime les favoris engagement du jeune', async () => {
        expect(
          await FavoriOffreEngagementSqlModel.findByPk(favoriOffreEngagement.id)
        ).to.be.null()
      })
      it('supprime les favoris immersion du jeune', async () => {
        expect(
          await FavoriOffreImmersionSqlModel.findByPk(favoriOffreImmersion.id)
        ).to.be.null()
      })
      it('ne supprime pas le conseiller du jeune', async () => {
        expect(
          await ConseillerSqlModel.findByPk(conseillerDto.id)
        ).not.to.be.null()
      })
      it("supprime l'association rendez-vous jeune", async () => {
        expect(
          await RendezVousJeuneAssociationSqlModel.findAll({
            where: { idJeune: jeuneDto.id }
          })
        ).to.deep.equal([])
      })
      it('ne supprime pas le rendez-vous', async () => {
        expect(
          await RendezVousSqlModel.findByPk(rendezVousDto.id)
        ).not.to.be.null()
      })
      it("ne supprime pas les evenements d'engagement du jeune", async () => {
        expect(
          await EvenementEngagementHebdoSqlModel.findAll({
            where: { idUtilisateur: jeuneDto.id }
          })
        ).not.to.be.null()
      })
      it('supprime les situations du jeune', async () => {
        expect(
          await SituationsMiloSqlModel.findAll({
            where: { idJeune: jeuneDto.id }
          })
        ).to.deep.equal([])
      })
      it('supprime le marquage du jeune à archiver', async () => {
        await expect(
          await JeuneMiloAArchiverSqlModel.findAll({
            where: { idJeune: jeuneDto.id }
          })
        ).to.deep.equal([])
      })
    })
  })

  describe('transferAndSaveAll', () => {
    let jeuneATransfererDto: AsSql<JeuneDto>
    beforeEach(async () => {
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: 'idConseillerCible' })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: 'idConseillerSource' })
      )
      await StructureMiloSqlModel.create(uneStructureMiloDto({ id: 'test' }))
      jeuneATransfererDto = unJeuneDto({
        id: 'unJeuneATransferer',
        idConseiller: 'idConseillerSource',
        idStructureMilo: 'test'
      })
      await JeuneSqlModel.creer(jeuneATransfererDto)
    })

    describe("quand le jeune n'était pas en transfert temporaire", () => {
      describe('quand le jeune est transféré de manière définitive', () => {
        it('transfère les chats, crée des transferts, met à jour le jeune avec son conseiller', async () => {
          // Given
          const jeuneATransferer: Jeune = unJeune({
            id: 'unJeuneATransferer',
            datePremiereConnexion: DateTime.fromJSDate(
              jeuneATransfererDto.datePremiereConnexion!
            ),
            conseiller: unConseillerDuJeune({
              id: 'idConseillerCible',
              idAgence: undefined
            }),
            configuration: uneConfiguration({ idJeune: 'unJeuneATransferer' })
          })

          // When
          await jeuneSqlRepository.transferAndSaveAll(
            [jeuneATransferer],
            'idConseillerCible',
            'idConseillerSource',
            'idConseillerSource',
            Jeune.TypeTransfert.DEFINITIF
          )

          // Then
          expect(firebaseClient.transfererChat).to.have.been.calledWithExactly(
            'idConseillerCible',
            ['unJeuneATransferer']
          )

          const jeune = await jeuneSqlRepository.get('unJeuneATransferer')
          expect(jeune).to.be.deep.equal(jeuneATransferer)
          const jeuneSql = await JeuneSqlModel.findByPk('unJeuneATransferer')
          expect(jeuneSql?.idStructureMilo).to.equal('test')
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
          expect(transfertsSql[0].emailJeune).to.equal(jeuneATransferer.email)
          expect(transfertsSql[0].idConseillerQuiTransfert).to.equal(
            'idConseillerSource'
          )
          expect(transfertsSql[0].typeTransfert).to.equal(
            Jeune.TypeTransfert.DEFINITIF
          )
          expect(transfertsSql[0].dateTransfert).to.deep.equal(
            uneDatetime().toJSDate()
          )
        })
      })
      describe('quand le jeune est transféré de manière temporaire', () => {
        it('met à jour le jeune avec son conseiller et son conseiller initial', async () => {
          // Given
          const jeuneATransferer: Jeune = unJeune({
            id: 'unJeuneATransferer',
            datePremiereConnexion: DateTime.fromJSDate(
              jeuneATransfererDto.datePremiereConnexion!
            ),
            conseiller: unConseillerDuJeune({ id: 'idConseillerCible' }),
            conseillerInitial: {
              id: 'idConseillerSource'
            }
          })

          // When
          await jeuneSqlRepository.transferAndSaveAll(
            [jeuneATransferer],
            'idConseillerCible',
            'idConseillerSource',
            'idConseillerSource',
            Jeune.TypeTransfert.TEMPORAIRE
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
          const jeuneEnTransfertDto = unJeuneDto({
            id: 'jeune-en-transfert',
            idConseiller: 'idConseillerSource',
            idConseillerInitial: 'idConseillerCible'
          })
          await JeuneSqlModel.creer(jeuneEnTransfertDto)
          const jeuneATransferer: Jeune = unJeune({
            id: 'jeune-en-transfert',
            datePremiereConnexion: DateTime.fromJSDate(
              jeuneEnTransfertDto.datePremiereConnexion!
            ),
            conseiller: unConseillerDuJeune({
              id: 'idConseillerCible',
              idAgence: undefined
            }),
            configuration: uneConfiguration({ idJeune: 'jeune-en-transfert' })
          })

          // When
          await jeuneSqlRepository.transferAndSaveAll(
            [jeuneATransferer],
            'idConseillerCible',
            'idConseillerSource',
            'idConseillerSource',
            Jeune.TypeTransfert.DEFINITIF
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

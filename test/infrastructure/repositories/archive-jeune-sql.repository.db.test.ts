import { uneArchiveJeuneMetadonnees } from 'test/fixtures/archiveJeune.fixture'
import { uneDatetime, uneDatetimeLocale } from 'test/fixtures/date.fixture'
import { Action } from '../../../src/domain/action/action'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import { Recherche } from '../../../src/domain/offre/recherche/recherche'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { ArchiveJeuneSqlRepository } from '../../../src/infrastructure/repositories/archive-jeune-sql.repository.db'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-emploi-http-sql.repository.db'
import { FavorisOffresImmersionSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-immersion-http-sql.repository.db'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../src/infrastructure/repositories/offre/offre-service-civique-http.repository.db'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/offre/recherche/recherche-sql.repository.db'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ArchiveJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/archive-jeune.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { unFavoriOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import {
  criteresImmersionNice,
  uneRecherche
} from '../../fixtures/recherche.fixture'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, StubbedClass, stubClass } from '../../utils'
import { unCommentaire } from '../../fixtures/action.fixture'
import {
  CommentaireDto,
  CommentaireSqlModel
} from '../../../src/infrastructure/sequelize/models/commentaire.sql-model'
import {
  DatabaseForTesting,
  getDatabase
} from '../../utils/database-for-testing'
import { DateService } from '../../../src/utils/date-service'
import { failure } from '../../../src/building-blocks/types/result'
import { MauvaiseCommandeError } from '../../../src/building-blocks/types/domain-error'

describe('ArchiveJeuneSqlRepository', () => {
  let database: DatabaseForTesting
  let dateService: StubbedClass<DateService>

  let rechercheSqlRepository: RechercheSqlRepository
  const firebaseClient = stubClass(FirebaseClient)
  firebaseClient.getChat.resolves([])
  const archiveJeuneSqlRepository = new ArchiveJeuneSqlRepository(
    firebaseClient
  )
  const premierConseillerDto = unConseillerDto({
    id: '1169709f-ca18-40d2-844a-c8b3a5df5af6',
    prenom: 'Bob',
    nom: 'Lenon'
  })
  const secondConseillerDto = unConseillerDto({
    id: '361cfcd4-d18c-4530-b4b8-c16d488aff0c'
  })
  const jeuneDto = unJeuneDto({
    idConseiller: secondConseillerDto.id
  })

  before(async () => {
    database = getDatabase()
    rechercheSqlRepository = new RechercheSqlRepository(database.sequelize)
  })

  beforeEach(async () => {
    await database.cleanPG()
    dateService = stubClass(DateService)
  })

  describe('archiver', () => {
    let archiveJeuneSql: ArchiveJeuneSqlModel | null
    let metadonnees: ArchiveJeune.Metadonnees

    dateService = stubClass(DateService)
    dateService.nowJs.returns(new Date('2023-04-17T12:00:00Z'))

    const offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository(
      dateService
    )
    const offresImmersionRepository = new FavorisOffresImmersionSqlRepository(
      dateService
    )
    const offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository(dateService)

    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.upsert(premierConseillerDto)
      await ConseillerSqlModel.upsert(secondConseillerDto)
      await JeuneSqlModel.upsert(jeuneDto)

      const unTransfertDto: AsSql<TransfertConseillerDto> = {
        id: '070fa845-7316-496e-b96c-b69c2a1f4ce8',
        dateTransfert: new Date('2022-04-02T03:24:00Z'),
        idJeune: jeuneDto.id,
        idConseillerCible: secondConseillerDto.id,
        idConseillerSource: premierConseillerDto.id
      }
      await TransfertConseillerSqlModel.creer(unTransfertDto)

      const idAction = 'ac4f4b46-672b-4155-9fad-fa4746740e9e'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeuneDto.id
      })
      await ActionSqlModel.creer(actionDto)

      const commentaire = unCommentaire({ idAction })
      const commentaireDto: AsSql<CommentaireDto> = {
        ...commentaire,
        date: commentaire.date.toJSDate()
      }
      await CommentaireSqlModel.create(commentaireDto)

      const unRendezVous = unRendezVousDto({
        id: '6c242fa0-804f-11ec-a8a3-0242ac120002'
      })
      await RendezVousSqlModel.create(unRendezVous)
      await RendezVousJeuneAssociationSqlModel.create({
        idRendezVous: unRendezVous.id,
        idJeune: jeuneDto.id
      })

      await offresEmploiHttpSqlRepository.save(jeuneDto.id, uneOffreEmploi())
      await offresImmersionRepository.save(
        jeuneDto.id,
        unFavoriOffreImmersion()
      )
      await offreServiceCiviqueHttpSqlRepository.save(
        jeuneDto.id,
        uneOffreServiceCivique()
      )

      // When
      await rechercheSqlRepository.save(
        uneRecherche({
          idJeune: jeuneDto.id,
          type: Recherche.Type.OFFRES_IMMERSION,
          criteres: criteresImmersionNice,
          dateCreation: uneDatetimeLocale(),
          dateDerniereRecherche: uneDatetimeLocale()
        })
      )

      metadonnees = {
        idJeune: jeuneDto.id,
        motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
        commentaire: 'Il a loupé un rdv',
        nomJeune: jeuneDto.nom,
        prenomJeune: jeuneDto.prenom,
        structure: jeuneDto.structure,
        email: jeuneDto.email!,
        dateCreation: new Date('2022-01-05T09:23:00Z'),
        datePremiereConnexion: new Date('2022-01-06T09:23:00Z'),
        dateArchivage: new Date('2022-07-05T09:23:00Z')
      }
      await archiveJeuneSqlRepository.archiver(metadonnees)

      // When
      archiveJeuneSql = await ArchiveJeuneSqlModel.findOne({
        where: { idJeune: jeuneDto.id }
      })
    })

    it("failure quand le jeune n'existe plus", async () => {
      // Given
      metadonnees = {
        idJeune: 'introuvable',
        motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
        commentaire: 'Il a loupé un rdv',
        nomJeune: jeuneDto.nom,
        prenomJeune: jeuneDto.prenom,
        structure: jeuneDto.structure,
        email: jeuneDto.email!,
        dateCreation: new Date('2022-01-05T09:23:00Z'),
        datePremiereConnexion: new Date('2022-01-06T09:23:00Z'),
        dateArchivage: new Date('2022-07-05T09:23:00Z')
      }

      // When
      const result = await archiveJeuneSqlRepository.archiver(metadonnees)

      // Then
      expect(result).to.deep.equal(
        failure(new MauvaiseCommandeError('Jeune déjà supprimé'))
      )
    })

    it('crée une archive avec les métadonnées', () => {
      // Then
      expect(archiveJeuneSql!.idJeune).to.equal(jeuneDto.id)
      expect(archiveJeuneSql!.nom).to.equal(jeuneDto.nom)
      expect(archiveJeuneSql!.prenom).to.equal(jeuneDto.prenom)
      expect(archiveJeuneSql!.email).to.equal(jeuneDto.email)
      expect(archiveJeuneSql!.dateArchivage).to.deep.equal(
        metadonnees.dateArchivage
      )
      expect(archiveJeuneSql!.dateCreation).to.deep.equal(
        metadonnees.dateCreation
      )
      expect(archiveJeuneSql!.datePremiereConnexion).to.deep.equal(
        metadonnees.datePremiereConnexion
      )
      expect(archiveJeuneSql!.motif).to.equal(metadonnees.motif)
      expect(archiveJeuneSql!.commentaire).to.equal(metadonnees.commentaire)
    })

    it('sauvegarde le dernier conseiller', () => {
      // Then
      expect(archiveJeuneSql!.donnees.dernierConseiller).to.deep.equal({
        nom: 'Tavernier',
        prenom: 'Nils'
      })
    })

    it("génère l'historique des conseillers", () => {
      // Then
      expect(archiveJeuneSql!.donnees.historiqueConseillers).to.deep.equal([
        {
          conseillerCible: {
            nom: 'Tavernier',
            prenom: 'Nils'
          },
          conseillerSource: {
            nom: 'Lenon',
            prenom: 'Bob'
          },
          dateDeTransfert: '2022-04-02T03:24:00.000Z'
        }
      ])
    })

    it('sauvegarde les actions', () => {
      // Then
      expect(archiveJeuneSql!.donnees.actions).to.deep.equal([
        {
          description: "Description de l'action",
          contenu: "Contenu de l'action",
          creePar: 'CONSEILLER',
          dateActualisation: '2021-11-11T08:03:30.000Z',
          dateCreation: '2021-11-11T08:03:30.000Z',
          dateEcheance: '2021-11-11T08:03:30.000Z',
          statut: 'in_progress',
          commentaires: [
            {
              date: uneDatetime().toUTC().toISO(),
              message: unCommentaire().message,
              creePar: 'CONSEILLER'
            }
          ]
        }
      ])
    })

    it('sauvegarde les rendez vous', () => {
      // Then
      expect(archiveJeuneSql!.donnees.rendezVous).to.deep.equal([
        {
          commentaire: 'commentaire',
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          modalite: 'modalite',
          presenceConseiller: true,
          sousTitre: 'sous titre',
          titre: 'rdv',
          type: 'ENTRETIEN_INDIVIDUEL_CONSEILLER'
        }
      ])
    })

    it('sauvegarde les favoris', () => {
      // Then
      expect(archiveJeuneSql!.donnees.favoris).to.deep.equal({
        offresEmploi: [
          {
            alternance: false,
            duree: 'Temps plein',
            id: '123DXPM',
            localisation: {
              codePostal: '77185',
              commune: '77258',
              nom: '77 - LOGNES'
            },
            nomEntreprise: 'RH TT INTERIM',
            titre: 'Technicien / Technicienne en froid et climatisation',
            typeContrat: 'MIS'
          }
        ],
        offresImmersions: [
          {
            id: '123ABC',
            metier: 'Mécanicien',
            nomEtablissement: 'Mécanique du Rhône',
            secteurActivite: 'Industrie auto',
            ville: 'Lyon'
          }
        ],
        offresServiceCivique: [
          {
            dateDeDebut: '2022-02-17T10:00:00.000Z',
            domaine: 'Informatique',
            id: 'unId',
            organisation: 'orga de ouf',
            titre: 'unTitre',
            ville: 'paris'
          }
        ]
      })
    })

    it('sauvegarde les recherches', () => {
      // Then
      expect(archiveJeuneSql!.donnees.recherches).to.deep.equal([
        {
          criteres: {
            distance: 15,
            lat: 43.68720052287055,
            lon: 7.237724249725603,
            rome: 'string'
          },
          dateCreation: uneDatetimeLocale().toISO(),
          dateDerniereRecherche: uneDatetimeLocale().toISO(),
          etat: 'SUCCES',
          id: '219e8ba5-cd88-4027-9828-55e8ca99a236',
          idJeune: 'ABCDE',
          localisation: 'Paris',
          metier: 'Boulanger',
          titre: 'Boulanger en alternance',
          type: 'OFFRES_IMMERSION'
        }
      ])
    })

    it('sauvegarde les messages', () => {
      // Then
      expect(archiveJeuneSql!.donnees.messages).to.deep.equal([])
    })
  })

  describe('.delete(idArchive)', () => {
    beforeEach(async () => {
      await ConseillerSqlModel.upsert(secondConseillerDto)
      await JeuneSqlModel.upsert(jeuneDto)
      await archiveJeuneSqlRepository.archiver(
        uneArchiveJeuneMetadonnees({ idJeune: jeuneDto.id })
      )
    })
    it("supprime l'archive de la db", async () => {
      // Given
      const archive = await ArchiveJeuneSqlModel.findOne({
        where: { idJeune: jeuneDto.id }
      })

      // When
      await archiveJeuneSqlRepository.delete(archive!.id)
      const archiveTrouvee = await ArchiveJeuneSqlModel.findByPk(archive!.id)

      // Then
      expect(archive).not.to.be.null()
      expect(archiveTrouvee).to.be.null()
    })
  })

  describe('.getIdsArchivesBefore()', () => {
    const maintenant = uneDatetime()
    const deuxAnsPlusTot = uneDatetime().minus({ years: 2 }).toJSDate()

    const archiveRecente = uneArchiveJeuneMetadonnees({
      idJeune: jeuneDto.id,
      dateArchivage: maintenant.minus({ years: 1 }).toJSDate()
    })
    const archiveOld1 = uneArchiveJeuneMetadonnees({
      idJeune: 'bb',
      dateArchivage: maintenant.minus({ years: 2 }).toJSDate()
    })
    const archiveOld2 = uneArchiveJeuneMetadonnees({
      idJeune: 'cc',
      dateArchivage: maintenant.minus({ years: 4 }).toJSDate()
    })

    beforeEach(async () => {
      await ConseillerSqlModel.upsert(secondConseillerDto)
      await JeuneSqlModel.upsert(jeuneDto)
      await JeuneSqlModel.upsert(
        unJeuneDto({ id: 'bb', idConseiller: secondConseillerDto.id })
      )
      await JeuneSqlModel.upsert(
        unJeuneDto({ id: 'cc', idConseiller: secondConseillerDto.id })
      )
    })

    it('retourne tableau vide quand aucune archive à supprimer', async () => {
      // Given
      await archiveJeuneSqlRepository.archiver(archiveRecente)

      // When
      const results = await archiveJeuneSqlRepository.getIdsArchivesBefore(
        deuxAnsPlusTot
      )
      // Then
      expect(results).to.deep.equal([])
    })
    it("retourne les archives créées il y'a plus de 2 ans seulement", async () => {
      // Given
      await archiveJeuneSqlRepository.archiver(archiveRecente)
      await archiveJeuneSqlRepository.archiver(archiveOld1)
      await archiveJeuneSqlRepository.archiver(archiveOld2)

      // When
      const results = await archiveJeuneSqlRepository.getIdsArchivesBefore(
        deuxAnsPlusTot
      )
      // Then
      expect(results.length).to.equal(2)
    })
  })
})

import { uneArchiveJeuneMetadonnees } from 'test/fixtures/archiveJeune.fixture'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { Action } from '../../../src/domain/action'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import { Recherche } from '../../../src/domain/recherche'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { ArchiveJeuneSqlRepository } from '../../../src/infrastructure/repositories/archive-jeune-sql.repository.db'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository.db'
import { OffresImmersionHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-immersion-http-sql.repository.db'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-service-civique-http.repository.db'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/recherche-sql.repository.db'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ArchiveJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/archive-jeune.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import {
  criteresImmersionNice,
  uneRecherche
} from '../../fixtures/recherche.fixture'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { expect, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'

describe('ArchiveJeuneSqlRepository', () => {
  const database = DatabaseForTesting.prepare()
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

  describe('archiver', () => {
    let archiveJeuneSql: ArchiveJeuneSqlModel | null
    let metadonnees: ArchiveJeune.Metadonnees
    const offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository()
    const offresImmersionRepository = new OffresImmersionHttpSqlRepository()
    const engagementClient: EngagementClient = stubClass(EngagementClient)
    const offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository(engagementClient)
    const rechercheSqlRepository = new RechercheSqlRepository(
      database.sequelize
    )

    before(async () => {
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

      const actionDto = uneActionDto({
        id: 'ac4f4b46-672b-4155-9fad-fa4746740e9e',
        statut: Action.Statut.EN_COURS,
        idJeune: jeuneDto.id
      })
      await ActionSqlModel.creer(actionDto)

      const unRendezVous = unRendezVousDto({
        id: '6c242fa0-804f-11ec-a8a3-0242ac120002'
      })
      await RendezVousSqlModel.create(unRendezVous)
      await RendezVousJeuneAssociationSqlModel.create({
        idRendezVous: unRendezVous.id,
        idJeune: jeuneDto.id
      })

      await offresEmploiHttpSqlRepository.saveAsFavori(
        jeuneDto.id,
        uneOffreEmploi()
      )
      await offresImmersionRepository.saveAsFavori(
        jeuneDto.id,
        uneOffreImmersion()
      )
      await offreServiceCiviqueHttpSqlRepository.saveAsFavori(
        jeuneDto.id,
        uneOffreServiceCivique()
      )

      // When
      await rechercheSqlRepository.createRecherche(
        uneRecherche({
          idJeune: jeuneDto.id,
          type: Recherche.Type.OFFRES_IMMERSION,
          criteres: criteresImmersionNice
        })
      )

      metadonnees = {
        idJeune: jeuneDto.id,
        motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ,
        commentaire: 'Il a loupé un rdv',
        nomJeune: jeuneDto.nom,
        prenomJeune: jeuneDto.prenom,
        email: jeuneDto.email!,
        dateArchivage: new Date('2022-07-05T09:23:00Z')
      }
      await archiveJeuneSqlRepository.archiver(metadonnees)

      // When
      archiveJeuneSql = await ArchiveJeuneSqlModel.findOne({
        where: { idJeune: jeuneDto.id }
      })
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
          commentaire: "Commentaire de l'action",
          contenu: "Contenu de l'action",
          creePar: 'CONSEILLER',
          dateActualisation: '2021-11-11T08:03:30.000Z',
          dateCreation: '2021-11-11T08:03:30.000Z',
          dateEcheance: '2021-11-11T08:03:30.000Z',
          statut: 'in_progress'
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
          dateCreation: '2019-04-06T12:00:00.000Z',
          dateDerniereRecherche: '2019-04-06T12:00:00.000Z',
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
    const maintenant = uneDatetime
    const deuxAnsPlusTot = uneDatetime.minus({ years: 2 }).toJSDate()

    const archiveRecente = uneArchiveJeuneMetadonnees({
      idJeune: jeuneDto.id,
      dateArchivage: maintenant.minus({ years: 1 }).toJSDate()
    })
    const archiveOld1 = uneArchiveJeuneMetadonnees({
      idJeune: jeuneDto.id,
      dateArchivage: maintenant.minus({ years: 2 }).toJSDate()
    })
    const archiveOld2 = uneArchiveJeuneMetadonnees({
      idJeune: jeuneDto.id,
      dateArchivage: maintenant.minus({ years: 4 }).toJSDate()
    })

    beforeEach(async () => {
      await ConseillerSqlModel.upsert(secondConseillerDto)
      await JeuneSqlModel.upsert(jeuneDto)
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

import { ArchiveJeuneSqlRepositoryDb } from '../../../src/infrastructure/repositories/archive-jeune-sql.repository.db'
import { FirebaseClient } from '../../../src/infrastructure/clients/firebase-client'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { ArchiveJeune } from '../../../src/domain/archive-jeune'
import { ArchivageJeuneSqlModel } from '../../../src/infrastructure/sequelize/models/archivage-jeune.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import {
  TransfertConseillerDto,
  TransfertConseillerSqlModel
} from '../../../src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { Action } from '../../../src/domain/action'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import { RendezVousSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { RendezVousJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { OffresEmploiHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-emploi-http-sql.repository.db'
import { uneOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { OffresImmersionHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-immersion-http-sql.repository.db'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import { OffreServiceCiviqueHttpSqlRepository } from '../../../src/infrastructure/repositories/offre-service-civique-http.repository.db'
import { EngagementClient } from '../../../src/infrastructure/clients/engagement-client'
import {
  criteresImmersionNice,
  uneRecherche
} from '../../fixtures/recherche.fixture'
import { Recherche } from '../../../src/domain/recherche'
import { RechercheSqlRepository } from '../../../src/infrastructure/repositories/recherche-sql.repository.db'

describe('ArchiveJeuneSqlRepositoryDb', () => {
  describe('archiver', () => {
    const database = DatabaseForTesting.prepare()
    let archiveJeuneSqlRepositoryDb: ArchiveJeuneSqlRepositoryDb
    let firebaseClient: StubbedClass<FirebaseClient>
    let archivageJeuneSqlModel: ArchivageJeuneSqlModel | null
    let metadonnees: ArchiveJeune.Metadonnees
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

    const offresEmploiHttpSqlRepository = new OffresEmploiHttpSqlRepository()
    const offresImmersionRepository = new OffresImmersionHttpSqlRepository()
    const engagementClient: EngagementClient = stubClass(EngagementClient)
    const offreServiceCiviqueHttpSqlRepository =
      new OffreServiceCiviqueHttpSqlRepository(engagementClient)
    const rechercheSqlRepository = new RechercheSqlRepository(
      database.sequelize
    )

    beforeEach(async () => {
      firebaseClient = stubClass(FirebaseClient)
      archiveJeuneSqlRepositoryDb = new ArchiveJeuneSqlRepositoryDb(
        firebaseClient
      )

      // Given
      await ConseillerSqlModel.creer(premierConseillerDto)
      await ConseillerSqlModel.creer(secondConseillerDto)
      await JeuneSqlModel.creer(jeuneDto)

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
      await archiveJeuneSqlRepositoryDb.archiver(metadonnees)

      // When
      archivageJeuneSqlModel = await ArchivageJeuneSqlModel.findOne({
        where: { idJeune: jeuneDto.id }
      })
    })

    it('crée une archive avec les métadonnées', () => {
      // Then
      expect(archivageJeuneSqlModel!.idJeune).to.equal(jeuneDto.id)
      expect(archivageJeuneSqlModel!.nom).to.equal(jeuneDto.nom)
      expect(archivageJeuneSqlModel!.prenom).to.equal(jeuneDto.prenom)
      expect(archivageJeuneSqlModel!.email).to.equal(jeuneDto.email)
      expect(archivageJeuneSqlModel!.dateArchivage).to.deep.equal(
        metadonnees.dateArchivage
      )
      expect(archivageJeuneSqlModel!.motif).to.equal(metadonnees.motif)
      expect(archivageJeuneSqlModel!.commentaire).to.equal(
        metadonnees.commentaire
      )
    })

    it('sauvegarde le dernier conseiller', () => {
      // Then
      expect(archivageJeuneSqlModel!.donnees.dernierConseiller).to.deep.equal({
        nom: 'Tavernier',
        prenom: 'Nils'
      })
    })

    it("génère l'historique des conseillers", () => {
      // Then
      expect(
        archivageJeuneSqlModel!.donnees.historiqueConseillers
      ).to.deep.equal([
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
      expect(archivageJeuneSqlModel!.donnees.actions).to.deep.equal([
        {
          commentaire: "Commentaire de l'action",
          contenu: "Contenu de l'action",
          creePar: 'CONSEILLER',
          dateActualisation: '2021-11-11T08:03:30.000Z',
          dateCreation: '2021-11-11T08:03:30.000Z',
          statut: 'in_progress'
        }
      ])
    })

    it('sauvegarde les rendez vous', () => {
      // Then
      expect(archivageJeuneSqlModel!.donnees.rendezVous).to.deep.equal([
        {
          commentaire: 'commentaire',
          date: '2021-11-11T08:03:30.000Z',
          duree: 30,
          invitation: false,
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
      expect(archivageJeuneSqlModel!.donnees.favoris).to.deep.equal({
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
      expect(archivageJeuneSqlModel!.donnees.recherches).to.deep.equal([
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
  })
})

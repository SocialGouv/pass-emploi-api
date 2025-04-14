import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Action } from '../../../../src/domain/action/action'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { FirebaseClient } from '../../../../src/infrastructure/clients/firebase-client'
import { ActionSqlRepository } from '../../../../src/infrastructure/repositories/action/action-sql.repository.db'
import { ConseillerSqlRepository } from '../../../../src/infrastructure/repositories/conseiller-sql.repository.db'
import { JeuneSqlRepository } from '../../../../src/infrastructure/repositories/jeune/jeune-sql.repository.db'
import { ActionSqlModel } from '../../../../src/infrastructure/sequelize/models/action.sql-model'
import {
  CommentaireDto,
  CommentaireSqlModel
} from '../../../../src/infrastructure/sequelize/models/commentaire.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { unCommentaire, uneAction } from '../../../fixtures/action.fixture'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { uneDatetime } from '../../../fixtures/date.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { uneActionDto } from '../../../fixtures/sql-models/action.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import {
  DatabaseForTesting,
  getDatabase
} from '../../../utils/database-for-testing'

const nowAtMidnight = uneDatetime().startOf('day')

describe('ActionSqlRepository', () => {
  let database: DatabaseForTesting
  before(async () => {
    database = getDatabase()
  })

  let jeune: Jeune
  let actionSqlRepository: ActionSqlRepository
  let dateService: StubbedClass<DateService>

  beforeEach(async () => {
    await database.cleanPG()
    jeune = unJeune()
    dateService = stubClass(DateService)
    dateService.nowAtMidnight.returns(nowAtMidnight)

    actionSqlRepository = new ActionSqlRepository(dateService)
    const conseillerRepository = new ConseillerSqlRepository()
    await conseillerRepository.save(unConseiller())
    const firebaseClient = stubClass(FirebaseClient)
    const jeuneRepository = new JeuneSqlRepository(
      database.sequelize,
      firebaseClient,
      new IdService(),
      dateService
    )
    await jeuneRepository.save(jeune)
  })

  describe('.save(action)', () => {
    it("modifie l'action existante", async () => {
      // Given
      const idAction = '9a3aacad-5161-4b83-b16f-ef8108902202'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actionModifiee = uneAction({
        id: idAction,
        statut: Action.Statut.TERMINEE,
        idJeune: jeune.id
      })
      await actionSqlRepository.save(actionModifiee)

      // Then
      const actual = await actionSqlRepository.get(idAction)
      expect(actual).to.deep.equal(actionModifiee)
    })

    describe("Quand l'action n'existe pas", () => {
      it("crée et sauvegarde l'action", async () => {
        // Given
        const idAction = '646d8992-91a5-498c-922b-ffaaf09b73f8'
        const nouvelleAction = uneAction({
          id: idAction,
          statut: Action.Statut.TERMINEE,
          idJeune: jeune.id
        })

        // When
        await actionSqlRepository.save(nouvelleAction)

        // Then

        const actual = await actionSqlRepository.get(idAction)
        expect(actual).to.deep.equal(nouvelleAction)
      })
    })
  })

  describe('.get(id, attributs)', () => {
    it("récupère l'action sans les commentaires", async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id,
        dateFinReelle: new Date('2021-11-10T08:03:30.000Z'),
        codeQualification: Action.Qualification.Code.SANTE,
        heuresQualifiees: 2,
        commentaireQualification: 'Un commentaire'
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actual = await actionSqlRepository.get(idAction)

      // Then
      const attendu: Action = {
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c',
        statut: Action.Statut.EN_COURS,
        idJeune: 'ABCDE',
        description: "Description de l'action",
        contenu: "Contenu de l'action",
        dateCreation: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
        dateDerniereActualisation: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
        createur: {
          id: '1',
          nom: 'Tavernier',
          prenom: 'Nils',
          type: Action.TypeCreateur.CONSEILLER
        },
        dateDebut: undefined,
        dateEcheance: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
        dateFinReelle: DateTime.fromISO('2021-11-10T08:03:30.000Z'),
        rappel: true,
        qualification: {
          code: Action.Qualification.Code.SANTE,
          heures: 2,
          commentaire: 'Un commentaire'
        }
      }
      expect(actual).to.deep.equal(attendu)
    })

    it("récupère l'action avec les commentaires", async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id,
        dateDebut: DateTime.fromISO('2021-11-09T08:03:30.000Z').toJSDate(),
        dateFinReelle: DateTime.fromISO('2021-11-10T08:03:30.000Z').toJSDate(),
        codeQualification: Action.Qualification.Code.SANTE,
        heuresQualifiees: 2,
        commentaireQualification: 'Un commentaire'
      })
      await ActionSqlModel.creer(actionDto)

      const commentaire = unCommentaire({ idAction })
      const commentaireDto: AsSql<CommentaireDto> = {
        ...commentaire,
        date: commentaire.date.toJSDate()
      }
      await CommentaireSqlModel.create(commentaireDto)

      // When
      const actual = await actionSqlRepository.get(idAction, {
        avecCommentaires: true
      })

      // Then
      const attendu: Action = {
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c',
        statut: Action.Statut.EN_COURS,
        idJeune: 'ABCDE',
        description: "Description de l'action",
        contenu: "Contenu de l'action",
        dateCreation: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
        dateDerniereActualisation: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
        createur: {
          id: actionDto.createur.id,
          nom: actionDto.createur.nom,
          prenom: actionDto.createur.prenom,
          type: Action.TypeCreateur.CONSEILLER
        },
        dateDebut: DateTime.fromISO('2021-11-09T08:03:30.000Z'),
        dateEcheance: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
        dateFinReelle: DateTime.fromISO('2021-11-10T08:03:30.000Z'),
        rappel: true,
        qualification: {
          code: Action.Qualification.Code.SANTE,
          heures: 2,
          commentaire: 'Un commentaire'
        },
        commentaires: [
          { ...commentaireDto, date: DateTime.fromJSDate(commentaireDto.date) }
        ]
      }
      expect(actual).to.deep.equal(attendu)
    })
    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })

  describe('findAll', () => {
    it('récupère les actions trouvees uniquement', async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id,
        dateFinReelle: new Date('2021-11-10T08:03:30.000Z'),
        codeQualification: Action.Qualification.Code.SANTE,
        heuresQualifiees: 2,
        commentaireQualification: 'Un commentaire'
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actual = await actionSqlRepository.findAll([
        idAction,
        'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21e'
      ])

      // Then
      const attendu: Action[] = [
        {
          id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c',
          statut: Action.Statut.EN_COURS,
          idJeune: 'ABCDE',
          description: "Description de l'action",
          contenu: "Contenu de l'action",
          dateCreation: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
          dateDerniereActualisation: DateTime.fromISO(
            '2021-11-11T08:03:30.000Z'
          ),
          createur: {
            id: '1',
            nom: 'Tavernier',
            prenom: 'Nils',
            type: Action.TypeCreateur.CONSEILLER
          },
          dateDebut: undefined,
          dateEcheance: DateTime.fromISO('2021-11-11T08:03:30.000Z'),
          dateFinReelle: DateTime.fromISO('2021-11-10T08:03:30.000Z'),
          rappel: true,
          qualification: {
            code: Action.Qualification.Code.SANTE,
            heures: 2,
            commentaire: 'Un commentaire'
          }
        }
      ]
      expect(actual).to.deep.equal(attendu)
    })
  })

  describe('.findAllActionsARappeler()', () => {
    it('récupère les actions qui arrivent à échance dans + 3 jours avec un rappel et pas de statut terminé ou annulé', async () => {
      // Given
      const actionARappeler = uneActionDto({
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c',
        statut: Action.Statut.EN_COURS,
        dateEcheance: nowAtMidnight.plus({ day: 5 }).toJSDate(),
        rappel: true
      })
      await ActionSqlModel.creer(actionARappeler)

      const actionTerminee = uneActionDto({
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21d',
        statut: Action.Statut.TERMINEE,
        dateEcheance: nowAtMidnight.plus({ day: 5 }).toJSDate(),
        rappel: true
      })
      await ActionSqlModel.creer(actionTerminee)

      const actionAnnulee = uneActionDto({
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21e',
        statut: Action.Statut.ANNULEE,
        dateEcheance: nowAtMidnight.plus({ day: 5 }).toJSDate(),
        rappel: true
      })
      await ActionSqlModel.creer(actionAnnulee)

      const actionSansRappel = uneActionDto({
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21f',
        statut: Action.Statut.EN_COURS,
        dateEcheance: nowAtMidnight.plus({ day: 5 }).toJSDate(),
        rappel: false
      })
      await ActionSqlModel.creer(actionSansRappel)

      const demain = uneActionDto({
        id: 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec22a',
        statut: Action.Statut.EN_COURS,
        dateEcheance: nowAtMidnight.plus({ day: 1 }).toJSDate(),
        rappel: true
      })
      await ActionSqlModel.creer(demain)

      // When
      const actual = await actionSqlRepository.findAllActionsARappeler()

      // Then
      expect(actual).to.have.length(1)
      expect(actual[0].id).to.equal(actionARappeler.id)
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })

  describe('.getConseillerEtJeune(id)', () => {
    it('récupère les id des conseillers et jeunes', async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      // When
      const actual = await actionSqlRepository.getConseillerEtJeune(idAction)

      // Then
      expect(actual).to.deep.equal({
        idConseiller: jeune.conseiller?.id,
        idJeune: jeune.id
      })
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })

  describe('.delete(id)', () => {
    it("supprime l'action et les commentaires associés", async () => {
      // Given
      const idAction = 'c723bfa8-0ac4-4d29-b0b6-68bdb3dec21c'
      const actionDto = uneActionDto({
        id: idAction,
        statut: Action.Statut.EN_COURS,
        idJeune: jeune.id
      })
      await ActionSqlModel.creer(actionDto)

      const idCommentaire = '1603e22a-27b4-11ed-a261-0242ac120002'
      const commentaireDto = unCommentaire({ id: idCommentaire, idAction })
      await CommentaireSqlModel.create(commentaireDto)

      // When
      await actionSqlRepository.delete(idAction)

      // Then
      const actualAction = await ActionSqlModel.findByPk(idAction)
      expect(actualAction).to.be.equal(null)

      const actualCommentaire = await CommentaireSqlModel.findByPk(
        idCommentaire
      )
      expect(actualCommentaire).to.be.equal(null)
    })

    describe("Quand l'action n'existe pas", () => {
      it('renvoie undefined', async () => {
        // When
        const actual = await actionSqlRepository.get(
          '184d8c6c-666c-4a33-88bd-ec44fb62f162'
        )

        // Then
        expect(actual).to.equal(undefined)
      })
    })
  })
})

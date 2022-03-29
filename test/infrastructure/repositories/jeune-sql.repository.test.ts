import { Authentification } from 'src/domain/authentification'
import { EvenementEngagementSqlModel } from 'src/infrastructure/sequelize/models/evenement-engagement.sql-model'
import { TransfertConseillerSqlModel } from 'src/infrastructure/sequelize/models/transfert-conseiller.sql-model'
import { DateService } from 'src/utils/date-service'
import { IdService } from 'src/utils/id-service'
import { Action } from '../../../src/domain/action'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune'
import { JeuneSqlRepository } from '../../../src/infrastructure/repositories/jeune-sql.repository'
import { ActionSqlModel } from '../../../src/infrastructure/sequelize/models/action.sql-model'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  uneDatetime,
  uneDatetimeMoinsRecente
} from '../../fixtures/date.fixture'
import { unJeune, unJeuneSansConseiller } from '../../fixtures/jeune.fixture'
import {
  unDetailJeuneQueryModel,
  unResumeActionDUnJeune
} from '../../fixtures/query-models/jeunes.query-model.fixtures'
import { uneActionDto } from '../../fixtures/sql-models/action.sql-model'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { DatabaseForTesting, expect } from '../../utils'

describe('JeuneSqlRepository', () => {
  const databaseForTesting: DatabaseForTesting = DatabaseForTesting.prepare()
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
      jeune = { ...unJeune(), tokenLastUpdate: uneDatetime }
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
        await jeuneSqlRepository.save(unJeune({ id: idJeune, idDossier }))

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
      jeune = { ...unJeune(), tokenLastUpdate: uneDatetime }
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
      expect(actual).to.deep.equal([unDetailJeuneQueryModel()])
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
          ...unDetailJeuneQueryModel(),
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
          ...unDetailJeuneQueryModel(),
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
      expect(actual).to.deep.equal([unDetailJeuneQueryModel()])
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
      const jeune = unJeuneDto({ id: idJeune, idConseiller: idConseillerCible })
      const dateTransfert = uneDatetime.toJSDate()
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: idConseillerSource, email: '1@1.com' })
      )
      await ConseillerSqlModel.creer(
        unConseillerDto({ id: idConseillerCible, email: '2@2.com' })
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
          ...unDetailJeuneQueryModel({ id: idJeune }),
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

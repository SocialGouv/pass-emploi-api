import { stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Core } from 'src/domain/core'
import { RendezVousJeuneAssociationSqlModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.sql-model'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import {
  GetRendezVousJeuneQuery,
  GetRendezVousJeuneQueryHandler
} from '../../../../src/application/queries/rendez-vous/get-rendez-vous-jeune.query.handler.db'
import { Evenement, EvenementService } from '../../../../src/domain/evenement'
import { RendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { DateService } from '../../../../src/utils/date-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../../fixtures/authentification.fixture'
import { uneDatetime, uneDatetimeMinuit } from '../../../fixtures/date.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'
import { testConfig } from '../../../utils/module-for-testing'
import { stubClassSandbox } from '../../../utils/types'
import { ConseillerInterAgenceAuthorizer } from '../../../../src/application/authorizers/conseiller-inter-agence-authorizer'

describe('GetRendezVousJeuneQueryHandler', () => {
  let dateService: StubbedClass<DateService>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let conseillerAgenceAuthorizer: StubbedClass<ConseillerInterAgenceAuthorizer>
  let getRendezVousQueryHandler: GetRendezVousJeuneQueryHandler
  let evenementService: StubbedClass<EvenementService>
  let sandbox: SinonSandbox

  const utilisateurJeune = unUtilisateurJeune()
  const maintenant = uneDatetime()
  const aujourdhuiMinuit = uneDatetimeMinuit()
  let unRendezVousPasse: AsSql<RendezVousDto>
  let unRendezVousTresPasse: AsSql<RendezVousDto>
  let unRendezVousProche: AsSql<RendezVousDto>
  let unRendezVousTresFuturPresenceConseillerFalse: AsSql<RendezVousDto>
  const jeune1 = unJeune({ id: 'jeune-1' })
  const jeune2 = unJeune({ id: 'jeune-2' })

  before(async () => {
    sandbox = createSandbox()
    dateService = stubInterface(sandbox)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())
    conseillerAgenceAuthorizer = stubClass(ConseillerInterAgenceAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
  })

  beforeEach(async () => {
    await getDatabase().cleanPG()
    evenementService = stubClassSandbox(EvenementService, sandbox)

    getRendezVousQueryHandler = new GetRendezVousJeuneQueryHandler(
      dateService,
      jeuneAuthorizer,
      conseillerAgenceAuthorizer,
      evenementService,
      testConfig()
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    beforeEach(async () => {
      // Given
      await ConseillerSqlModel.creer(unConseillerDto())
      await JeuneSqlModel.creer(unJeuneDto({ id: jeune1.id }))
      await JeuneSqlModel.creer(unJeuneDto({ id: jeune2.id }))

      unRendezVousPasse = unRendezVousDto({
        date: maintenant.minus({ days: 2 }).toJSDate(),
        titre: 'UN RENDEZ VOUS PASSÉ'
      })

      unRendezVousTresPasse = unRendezVousDto({
        date: maintenant.minus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ VOUS TRES PASSÉ'
      })
      unRendezVousProche = unRendezVousDto({
        date: maintenant.plus({ days: 2 }).toJSDate(),
        titre: 'UN RENDEZ VOUS PROCHE'
      })
      unRendezVousTresFuturPresenceConseillerFalse = unRendezVousDto({
        date: maintenant.plus({ days: 20 }).toJSDate(),
        titre: 'UN RENDEZ TRES FUTUR',
        presenceConseiller: false
      })

      await RendezVousSqlModel.bulkCreate([
        unRendezVousPasse,
        unRendezVousTresPasse,
        unRendezVousTresFuturPresenceConseillerFalse,
        unRendezVousProche
      ])
      await RendezVousJeuneAssociationSqlModel.bulkCreate([
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousPasse.id,
          present: true
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousTresPasse.id,
          present: false
        },
        {
          idJeune: jeune2.id,
          idRendezVous: unRendezVousTresPasse.id
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousTresFuturPresenceConseillerFalse.id
        },
        {
          idJeune: jeune2.id,
          idRendezVous: unRendezVousTresFuturPresenceConseillerFalse.id
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousProche.id
        }
      ])
    })

    describe('sans periode', () => {
      it('retourne tous les rendez-vous du jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle(
          {
            idJeune: jeune1.id
          },
          utilisateurJeune
        )

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data.length).to.equal(4)
          expect(result.data[0].id).to.equal(unRendezVousTresPasse.id)
          expect(result.data[1].id).to.equal(unRendezVousPasse.id)
          expect(result.data[2].id).to.equal(unRendezVousProche.id)
          expect(result.data[3].id).to.equal(
            unRendezVousTresFuturPresenceConseillerFalse.id
          )
        }
      })
      it('retourne que les rendez-vous qui concernent le jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle(
          {
            idJeune: jeune2.id
          },
          utilisateurJeune
        )

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data.length).to.equal(2)
          expect(result.data[0].id).to.equal(unRendezVousTresPasse.id)
          expect(result.data[1].id).to.equal(
            unRendezVousTresFuturPresenceConseillerFalse.id
          )
        }
      })
      it('retourne les rendez-vous avec la présence du jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle(
          {
            idJeune: jeune1.id
          },
          utilisateurJeune
        )

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data[0].id).to.equal(unRendezVousTresPasse.id)
          expect(result.data[1].id).to.equal(unRendezVousPasse.id)
          expect(result.data[2].id).to.equal(unRendezVousProche.id)
          expect(result.data[0].futPresent).to.equal(false)
          expect(result.data[1].futPresent).to.equal(true)
          expect(result.data[2].futPresent).to.be.undefined()
        }
      })
    })

    describe('periode FUTURS renseignée', () => {
      it('retourne les rendez-vous futurs du jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle(
          {
            idJeune: jeune1.id,
            periode: RendezVous.Periode.FUTURS
          },
          utilisateurJeune
        )

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data.length).to.equal(2)
          expect(result.data[0].id).to.equal(unRendezVousProche.id)
          expect(result.data[1].id).to.equal(
            unRendezVousTresFuturPresenceConseillerFalse.id
          )
        }
      })
    })

    describe('periode PASSES renseignée', () => {
      it('retourne les rendez-vous passés du jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle(
          {
            idJeune: jeune1.id,
            periode: RendezVous.Periode.PASSES
          },
          utilisateurJeune
        )

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data.length).to.equal(2)
          expect(result.data[0].id).to.equal(unRendezVousPasse.id)
          expect(result.data[1].id).to.equal(unRendezVousTresPasse.id)
        }
      })
    })
  })

  describe('monitor', () => {
    describe("quand c'est un jeune", () => {
      it('envoie un évènement de consultation de la liste des rendez vous sans période', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'sans-periode' })
        const query: GetRendezVousJeuneQuery = {
          idJeune: 'id',
          periode: undefined
        }
        // When
        await getRendezVousQueryHandler.monitor(utilisateur, query)
        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.RDV_LISTE,
          utilisateur
        )
      })
      it('envoie un évènement de consultation de la liste des rendez vous dans le futur', async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'periode-futur' })
        const query: GetRendezVousJeuneQuery = {
          idJeune: 'id',
          periode: RendezVous.Periode.FUTURS
        }
        // When
        await getRendezVousQueryHandler.monitor(utilisateur, query)
        // Then
        expect(evenementService.creer).to.have.been.calledWithExactly(
          Evenement.Code.RDV_LISTE,
          utilisateur
        )
      })
      it("n'envoie pas un évènement de consultation de la liste des rendez vous dans le passé", async () => {
        // Given
        const utilisateur = unUtilisateurJeune({ id: 'periode-passe' })
        const query: GetRendezVousJeuneQuery = {
          idJeune: 'id',
          periode: RendezVous.Periode.PASSES
        }
        // When
        await getRendezVousQueryHandler.monitor(utilisateur, query)
        // Then
        expect(evenementService.creer).not.to.have.been.calledWithExactly(
          Evenement.Code.RDV_LISTE,
          utilisateur
        )
      })
    })
    describe("quand c'est un conseiller", () => {
      it("n'envoie pas un évènement de consultation de la liste des rendez vous passés", async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: 'periode-passe' })
        const query: GetRendezVousJeuneQuery = {
          idJeune: 'id',
          periode: RendezVous.Periode.PASSES
        }
        // When
        await getRendezVousQueryHandler.monitor(utilisateur, query)
        // Then
        expect(evenementService.creer).not.to.have.been.called()
      })
      it("n'envoie pas un évènement de consultation de la liste des rendez vous futurs", async () => {
        // Given
        const utilisateur = unUtilisateurConseiller({ id: 'periode-passe' })
        const query: GetRendezVousJeuneQuery = {
          idJeune: 'id',
          periode: RendezVous.Periode.FUTURS
        }
        // When
        await getRendezVousQueryHandler.monitor(utilisateur, query)
        // Then
        expect(evenementService.creer).not.to.have.been.called()
      })
    })
  })

  describe('authorize', () => {
    it('appelle l’authorizer idoine pou un jeune', async () => {
      // Given
      const utilisateur = unUtilisateurJeune({
        structure: Core.Structure.MILO
      })

      // When
      await getRendezVousQueryHandler.authorize(
        {
          idJeune: jeune1.id
        },
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        jeune1.id,
        utilisateur
      )
    })
    it('appelle l’authorizer idoine pour un conseiller', async () => {
      // Given
      const conseiller = unUtilisateurConseiller({
        structure: Core.Structure.MILO
      })

      // When
      await getRendezVousQueryHandler.authorize(
        {
          idJeune: jeune1.id
        },
        conseiller
      )

      // Then
      expect(
        conseillerAgenceAuthorizer.autoriserConseillerPourSonJeuneOuUnJeuneDeSonAgenceMilo
      ).to.have.been.calledWithExactly(jeune1.id, conseiller)
    })
  })
})

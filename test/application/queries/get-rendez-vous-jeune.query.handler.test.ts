import { stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RendezVousJeuneAssociationModel } from 'src/infrastructure/sequelize/models/rendez-vous-jeune-association.model'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  GetRendezVousJeuneQuery,
  GetRendezVousJeuneQueryHandler
} from '../../../src/application/queries/get-rendez-vous-jeune.query.handler'
import { Evenement, EvenementService } from '../../../src/domain/evenement'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../src/infrastructure/sequelize/models/jeune.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { DateService } from '../../../src/utils/date-service'
import {
  unUtilisateurConseiller,
  unUtilisateurJeune
} from '../../fixtures/authentification.fixture'
import { uneDatetime, uneDatetimeMinuit } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../fixtures/sql-models/jeune.sql-model'
import { unRendezVousDto } from '../../fixtures/sql-models/rendez-vous.sql-model'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'

describe('GetRendezVousJeuneQueryHandler', () => {
  DatabaseForTesting.prepare()
  let dateService: StubbedClass<DateService>
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getRendezVousQueryHandler: GetRendezVousJeuneQueryHandler
  let evenementService: StubbedClass<EvenementService>
  let sandbox: SinonSandbox

  const maintenant = uneDatetime
  const aujourdhuiMinuit = uneDatetimeMinuit
  let unRendezVousPasse: AsSql<RendezVousDto>
  let unRendezVousTresPasse: AsSql<RendezVousDto>
  let unRendezVousProche: AsSql<RendezVousDto>
  let unRendezVousTresFuturPresenceConseillerFalse: AsSql<RendezVousDto>
  const jeune1 = unJeune({ id: 'jeune-1' })
  const jeune2 = unJeune({ id: 'jeune-2' })

  before(() => {
    sandbox = createSandbox()
    dateService = stubInterface(sandbox)
    dateService.nowJs.returns(maintenant.toJSDate())
    dateService.nowAtMidnightJs.returns(aujourdhuiMinuit.toJSDate())

    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)

    getRendezVousQueryHandler = new GetRendezVousJeuneQueryHandler(
      dateService,
      conseillerForJeuneAuthorizer,
      jeuneAuthorizer,
      evenementService
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
      await RendezVousJeuneAssociationModel.bulkCreate([
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousPasse.id
        },
        {
          idJeune: jeune1.id,
          idRendezVous: unRendezVousTresPasse.id
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
        const result = await getRendezVousQueryHandler.handle({
          idJeune: jeune1.id
        })

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data.length).to.equal(4)
          expect(result.data[0].id).to.equal(unRendezVousTresPasse.id)
          expect(result.data[0].jeune.id).to.equal(jeune1.id)
          expect(result.data[1].id).to.equal(unRendezVousPasse.id)
          expect(result.data[2].id).to.equal(unRendezVousProche.id)
          expect(result.data[3].id).to.equal(
            unRendezVousTresFuturPresenceConseillerFalse.id
          )
        }
      })
      it('retourne que les rendez-vous qui concernent le jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle({
          idJeune: jeune2.id
        })

        // Then
        expect(result._isSuccess).to.equal(true)

        if (result._isSuccess) {
          expect(result.data.length).to.equal(2)
          expect(result.data[0].id).to.equal(unRendezVousTresPasse.id)
          expect(result.data[0].jeune.id).to.equal(jeune2.id)
          expect(result.data[1].id).to.equal(
            unRendezVousTresFuturPresenceConseillerFalse.id
          )
        }
      })
    })

    describe('periode FUTURS renseignée', () => {
      it('retourne les rendez-vous futurs du jeune', async () => {
        // When
        const result = await getRendezVousQueryHandler.handle({
          idJeune: jeune1.id,
          periode: RendezVous.Periode.FUTURS
        })

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
        const result = await getRendezVousQueryHandler.handle({
          idJeune: jeune1.id,
          periode: RendezVous.Periode.PASSES
        })

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
    it('envoie un évenement de consultation de la liste des rendez vous sans période', async () => {
      // Given
      const utilisateur = unUtilisateurJeune({ id: 'sans-periode' })
      const query: GetRendezVousJeuneQuery = {
        idJeune: 'id',
        periode: undefined
      }
      // When
      await getRendezVousQueryHandler.monitor(utilisateur, query)
      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWithExactly(
        Evenement.Type.RDV_LISTE,
        utilisateur
      )
    })
    it('envoie un évenement de consultation de la liste des rendez vous dans le futur', async () => {
      // Given
      const utilisateur = unUtilisateurJeune({ id: 'periode-futur' })
      const query: GetRendezVousJeuneQuery = {
        idJeune: 'id',
        periode: RendezVous.Periode.FUTURS
      }
      // When
      await getRendezVousQueryHandler.monitor(utilisateur, query)
      // Then
      expect(evenementService.creerEvenement).to.have.been.calledWithExactly(
        Evenement.Type.RDV_LISTE,
        utilisateur
      )
    })
    it("n'envoie pas un évenement de consultation de la liste des rendez vous dans le passé", async () => {
      // Given
      const utilisateur = unUtilisateurJeune({ id: 'periode-passe' })
      const query: GetRendezVousJeuneQuery = {
        idJeune: 'id',
        periode: RendezVous.Periode.PASSES
      }
      // When
      await getRendezVousQueryHandler.monitor(utilisateur, query)
      // Then
      expect(
        evenementService.creerEvenement
      ).not.to.have.been.calledWithExactly(
        Evenement.Type.RDV_LISTE,
        utilisateur
      )
    })
  })

  describe('authorize', () => {
    it('autorise un jeune', () => {
      // When
      getRendezVousQueryHandler.authorize(
        {
          idJeune: jeune1.id
        },
        unUtilisateurJeune()
      )

      // Then
      expect(jeuneAuthorizer.authorize).to.have.been.calledWithExactly(
        jeune1.id,
        unUtilisateurJeune()
      )
    })

    it('autorise le conseiller du jeune', () => {
      // When
      getRendezVousQueryHandler.authorize(
        {
          idJeune: jeune1.id
        },
        unUtilisateurConseiller()
      )

      // Then
      expect(
        conseillerForJeuneAuthorizer.authorize
      ).to.have.been.calledWithExactly(jeune1.id, unUtilisateurConseiller())
    })
  })
})

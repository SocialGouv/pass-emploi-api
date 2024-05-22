import { DateTime } from 'luxon'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../../src/application/authorizers/jeune-authorizer'
import {
  GetRendezVousJeunePoleEmploiQuery,
  GetRendezVousJeunePoleEmploiQueryHandler
} from '../../../../src/application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { RendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { Evenement, EvenementService } from '../../../../src/domain/evenement'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'

describe('GetRendezVousJeunePoleEmploiQueryHandler', () => {
  let queryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler
  let evenementService: StubbedClass<EvenementService>
  let dateService: StubbedClass<DateService>
  const maintenant = DateTime.fromISO('2022-05-09T10:11:00+02:00', {
    setZone: true
  })

  beforeEach(() => {
    queryGetter = stubClass(GetRendezVousJeunePoleEmploiQueryGetter)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)

    dateService = stubClass(DateService)
    dateService.now.returns(maintenant)

    getRendezVousJeunePoleEmploiQueryHandler =
      new GetRendezVousJeunePoleEmploiQueryHandler(
        queryGetter,
        jeuneAuthorizer,
        evenementService,
        dateService
      )
  })

  describe('handle', () => {
    it('retourne les rendez vous des jeunes PE dans le passé', () => {
      // When
      getRendezVousJeunePoleEmploiQueryHandler.handle({
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        periode: RendezVous.Periode.PASSES
      })

      // Then
      expect(queryGetter.handle).to.have.been.calledWithExactly({
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        dateFin: maintenant
      })
    })

    it('retourne les rendez vous des jeunes PE dans le futur', () => {
      // When
      getRendezVousJeunePoleEmploiQueryHandler.handle({
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        periode: RendezVous.Periode.FUTURS
      })

      // Then
      expect(queryGetter.handle).to.have.been.calledWithExactly({
        idJeune: 'idJeune',
        accessToken: 'accessToken',
        dateDebut: maintenant
      })
    })
  })

  describe('authorize', () => {
    it('authorise le jeune', async () => {
      // Given
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'ABCDE',
        accessToken: 'token'
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.authorize(
        query,
        utilisateur
      )
      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWith(
        query.idJeune,
        utilisateur
      )
    })
  })

  describe('monitor', () => {
    it('envoie un évènement de consultation de la liste des rendez vous sans période', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'id',
        accessToken: 'accessToken',
        periode: undefined
      }

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.monitor(utilisateur, query)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RDV_LISTE,
        utilisateur
      )
    })

    it('envoie un évènement de consultation de la liste des rendez vous dans le futur', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'id',
        accessToken: 'accessToken',
        periode: RendezVous.Periode.FUTURS
      }

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.monitor(utilisateur, query)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RDV_LISTE,
        utilisateur
      )
    })

    it("n'envoie pas un évènement de consultation de la liste des rendez vous dans le passé", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'id',
        accessToken: 'accessToken',
        periode: RendezVous.Periode.PASSES
      }

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.monitor(utilisateur, query)

      // Then
      expect(evenementService.creer).to.have.callCount(0)
    })
  })
})

import { JeunePoleEmploiAuthorizer } from '../../../../src/application/authorizers/authorize-jeune-pole-emploi'
import {
  GetRendezVousJeunePoleEmploiQuery,
  GetRendezVousJeunePoleEmploiQueryHandler
} from '../../../../src/application/queries/rendez-vous/get-rendez-vous-jeune-pole-emploi.query.handler'
import { unUtilisateurJeune } from '../../../fixtures/authentification.fixture'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { RendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { Evenement, EvenementService } from '../../../../src/domain/evenement'
import { GetRendezVousJeunePoleEmploiQueryGetter } from '../../../../src/application/queries/query-getters/pole-emploi/get-rendez-vous-jeune-pole-emploi.query.getter'
import Periode = RendezVous.Periode

describe('GetRendezVousJeunePoleEmploiQueryHandler', () => {
  let queryGetter: StubbedClass<GetRendezVousJeunePoleEmploiQueryGetter>
  let jeunePoleEmploiAuthorizer: StubbedClass<JeunePoleEmploiAuthorizer>
  let getRendezVousJeunePoleEmploiQueryHandler: GetRendezVousJeunePoleEmploiQueryHandler
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    queryGetter = stubClass(GetRendezVousJeunePoleEmploiQueryGetter)
    jeunePoleEmploiAuthorizer = stubClass(JeunePoleEmploiAuthorizer)
    evenementService = stubClass(EvenementService)

    getRendezVousJeunePoleEmploiQueryHandler =
      new GetRendezVousJeunePoleEmploiQueryHandler(
        queryGetter,
        jeunePoleEmploiAuthorizer,
        evenementService
      )
  })

  describe('handle', () => {
    it('retourne les rendez vous des jeunes PE', () => {
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
        periode: RendezVous.Periode.PASSES
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
      expect(jeunePoleEmploiAuthorizer.authorize).to.have.been.calledWith(
        query.idJeune,
        utilisateur
      )
    })
  })

  describe('monitor', () => {
    it('envoie un évenement de consultation de la liste des rendez vous sans période', async () => {
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

    it('envoie un évenement de consultation de la liste des rendez vous dans le futur', async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'id',
        accessToken: 'accessToken',
        periode: Periode.FUTURS
      }

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.monitor(utilisateur, query)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.RDV_LISTE,
        utilisateur
      )
    })

    it("n'envoie pas un évenement de consultation de la liste des rendez vous dans le passé", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()
      const query: GetRendezVousJeunePoleEmploiQuery = {
        idJeune: 'id',
        accessToken: 'accessToken',
        periode: Periode.PASSES
      }

      // When
      await getRendezVousJeunePoleEmploiQueryHandler.monitor(utilisateur, query)

      // Then
      expect(evenementService.creer).to.have.callCount(0)
    })
  })
})

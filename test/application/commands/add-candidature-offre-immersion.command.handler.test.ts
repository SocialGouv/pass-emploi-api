import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddCandidatureOffreImmersionCommand,
  AddCandidatureOffreImmersionCommandHandler
} from '../../../src/application/commands/add-candidature-offre-immersion.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unFavoriOffreImmersion } from '../../fixtures/offre-immersion.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('AddCandidatureOffreImmersionCommandHandler', () => {
  let offresImmersionRepository: StubbedType<Offre.Favori.Immersion.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addCandidatureOffreImmersionCommandHandler: AddCandidatureOffreImmersionCommandHandler
  let dateService: StubbedClass<DateService>
  let evenementService: StubbedClass<EvenementService>

  const utilisateur = unUtilisateurJeune()
  const now = DateTime.now()
  const command: AddCandidatureOffreImmersionCommand = {
    idBeneficiaire: 'id-beneficiaire',
    idOffre: 'id-offre'
  }
  const favori = {
    idBeneficiaire: 'id-beneficiaire',
    dateCreation: DateTime.now().minus({ day: 1 }),
    offre: unFavoriOffreImmersion()
  }

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresImmersionRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    evenementService = stubClass(EvenementService)
    addCandidatureOffreImmersionCommandHandler =
      new AddCandidatureOffreImmersionCommandHandler(
        offresImmersionRepository,
        jeuneAuthorizer,
        dateService,
        evenementService
      )

    dateService.now.returns(now)
  })

  describe('handle', () => {
    it('modifie un favori', async () => {
      // Given
      offresImmersionRepository.get
        .withArgs('id-beneficiaire', 'id-offre')
        .resolves(favori)

      // When
      await addCandidatureOffreImmersionCommandHandler.handle(command)

      // Then
      expect(offresImmersionRepository.save).to.have.been.calledWith({
        ...favori,
        dateCandidature: now
      })
    })

    it('renvoie une failure NonTrouve quand le beneficiaire n’a pas ce favori', async () => {
      // Given
      offresImmersionRepository.get
        .withArgs('id-beneficiaire', 'id-offre')
        .resolves(undefined)

      // When
      const result = await addCandidatureOffreImmersionCommandHandler.handle(
        command
      )

      // Then
      expect(result).to.deep.equal(
        failure(
          new NonTrouveError('Favori', 'pour l’offre d’immersion id-offre')
        )
      )
    })
  })

  describe('authorize', () => {
    it('authorize le beneficiaire', async () => {
      // When
      await addCandidatureOffreImmersionCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'id-beneficiaire',
        utilisateur
      )
    })
  })

  describe('monitor', () => {
    it('créé l’événement de candidature', () => {
      // When
      addCandidatureOffreImmersionCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_IMMERSION_CANDIDATURE_CONFIRMEE,
        utilisateur
      )
    })
  })
})

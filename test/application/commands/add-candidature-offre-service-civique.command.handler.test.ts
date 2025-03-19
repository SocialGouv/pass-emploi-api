import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddCandidatureOffreServiceCiviqueCommand,
  AddCandidatureOffreServiceCiviqueCommandHandler
} from '../../../src/application/commands/add-candidature-offre-service-civique.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneOffreServiceCivique } from '../../fixtures/offre-service-civique.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('AddCandidatureOffreServiceCiviqueCommandHandler', () => {
  let offresServiceCiviqueRepository: StubbedType<Offre.Favori.ServiceCivique.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addCandidatureOffreServiceCiviqueCommandHandler: AddCandidatureOffreServiceCiviqueCommandHandler
  let dateService: StubbedClass<DateService>
  let evenementService: StubbedClass<EvenementService>

  const utilisateur = unUtilisateurJeune()
  const now = DateTime.now()
  const command: AddCandidatureOffreServiceCiviqueCommand = {
    idBeneficiaire: 'id-beneficiaire',
    idOffre: 'id-offre'
  }
  const favori = {
    idBeneficiaire: 'id-beneficiaire',
    dateCreation: now.minus({ day: 1 }),
    offre: uneOffreServiceCivique()
  }

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresServiceCiviqueRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    evenementService = stubClass(EvenementService)
    addCandidatureOffreServiceCiviqueCommandHandler =
      new AddCandidatureOffreServiceCiviqueCommandHandler(
        offresServiceCiviqueRepository,
        jeuneAuthorizer,
        dateService,
        evenementService
      )

    dateService.now.returns(now)
  })

  describe('handle', () => {
    it('modifie un favori', async () => {
      // Given
      offresServiceCiviqueRepository.get
        .withArgs('id-beneficiaire', 'id-offre')
        .resolves(favori)

      // When
      await addCandidatureOffreServiceCiviqueCommandHandler.handle(command)

      // Then
      expect(offresServiceCiviqueRepository.save).to.have.been.calledWith({
        ...favori,
        dateCandidature: now
      })
    })

    it('renvoie une failure NonTrouve quand le beneficiaire n’a pas ce favori', async () => {
      // Given
      offresServiceCiviqueRepository.get
        .withArgs('id-beneficiaire', 'id-offre')
        .resolves(undefined)

      // When
      const result =
        await addCandidatureOffreServiceCiviqueCommandHandler.handle(command)

      // Then
      expect(result).to.deep.equal(
        failure(
          new NonTrouveError(
            'Favori',
            'pour l’offre de service civique id-offre'
          )
        )
      )
    })
  })

  describe('authorize', () => {
    it('authorize le beneficiaire', async () => {
      // When
      await addCandidatureOffreServiceCiviqueCommandHandler.authorize(
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
      addCandidatureOffreServiceCiviqueCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_SERVICE_CIVIQUE_CANDIDATURE_CONFIRMEE,
        utilisateur
      )
    })
  })
})

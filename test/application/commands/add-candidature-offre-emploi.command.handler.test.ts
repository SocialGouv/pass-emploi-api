import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { Evenement, EvenementService } from 'src/domain/evenement'
import { DateService } from 'src/utils/date-service'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import {
  AddCandidatureOffreEmploiCommand,
  AddCandidatureOffreEmploiCommandHandler
} from '../../../src/application/commands/add-candidature-offre-emploi.command.handler'
import { NonTrouveError } from '../../../src/building-blocks/types/domain-error'
import { failure } from '../../../src/building-blocks/types/result'
import { Offre } from '../../../src/domain/offre/offre'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneOffreEmploi } from '../../fixtures/offre-emploi.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('AddCandidatureOffreEmploiCommandHandler', () => {
  let offresEmploiRepository: StubbedType<Offre.Favori.Emploi.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let addCandidatureOffreEmploiCommandHandler: AddCandidatureOffreEmploiCommandHandler
  let dateService: StubbedClass<DateService>
  let evenementService: StubbedClass<EvenementService>

  const utilisateur = unUtilisateurJeune()
  const now = DateTime.now()
  const command: AddCandidatureOffreEmploiCommand = {
    idBeneficiaire: 'id-beneficiaire',
    idOffre: 'id-offre'
  }

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    offresEmploiRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    dateService = stubClass(DateService)
    evenementService = stubClass(EvenementService)
    addCandidatureOffreEmploiCommandHandler =
      new AddCandidatureOffreEmploiCommandHandler(
        offresEmploiRepository,
        jeuneAuthorizer,
        dateService,
        evenementService
      )

    dateService.now.returns(now)
  })

  describe('getAggregate', () => {
    it('renvoie le favori', async () => {
      // Given
      const now = DateTime.now()
      const favori = {
        idBeneficiaire: 'id-beneficiaire',
        dateCreation: now.minus({ day: 1 }),
        offre: uneOffreEmploi()
      }
      offresEmploiRepository.get
        .withArgs('id-beneficiaire', 'id-offre')
        .resolves(favori)

      // When
      const aggregat =
        await addCandidatureOffreEmploiCommandHandler.getAggregate(command)

      // Then
      expect(aggregat).to.deep.equal(favori)
    })
  })

  describe('handle', () => {
    it('modifie un favori', async () => {
      // Given
      const favori = {
        idBeneficiaire: 'id-beneficiaire',
        dateCreation: now.minus({ day: 1 }),
        offre: uneOffreEmploi()
      }

      // When
      await addCandidatureOffreEmploiCommandHandler.handle(
        command,
        utilisateur,
        favori
      )

      // Then
      expect(offresEmploiRepository.save).to.have.been.calledWith({
        ...favori,
        dateCandidature: now
      })
    })

    it('renvoie une failure NonTrouve quand le beneficiaire n’a pas ce favori', async () => {
      // When
      const result = await addCandidatureOffreEmploiCommandHandler.handle(
        command,
        utilisateur,
        undefined
      )

      // Then
      expect(result).to.deep.equal(
        failure(new NonTrouveError('Favori', 'pour l’offre d’emploi id-offre'))
      )
    })
  })

  describe('authorize', () => {
    it('authorize le beneficiaire', async () => {
      // When
      await addCandidatureOffreEmploiCommandHandler.authorize(
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
    it('créé l’événement de candidature à une offre d’emploi', () => {
      // Given
      const favori = {
        idBeneficiaire: 'id-beneficiaire',
        dateCreation: DateTime.now(),
        offre: uneOffreEmploi()
      }

      // When
      addCandidatureOffreEmploiCommandHandler.monitor(
        utilisateur,
        command,
        favori
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_EMPLOI_CANDIDATURE_CONFIRMEE,
        utilisateur
      )
    })

    it('créé l’événement de candidature à une offre d’alternance', () => {
      // Given
      const favori = {
        idBeneficiaire: 'id-beneficiaire',
        dateCreation: DateTime.now(),
        offre: uneOffreEmploi({ alternance: true })
      }

      // When
      addCandidatureOffreEmploiCommandHandler.monitor(
        utilisateur,
        command,
        favori
      )

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.OFFRE_ALTERNANCE_CANDIDATURE_CONFIRMEE,
        utilisateur
      )
    })
  })
})

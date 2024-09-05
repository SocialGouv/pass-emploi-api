import {
  UpdateJeunePreferencesCommand,
  UpdateJeunePreferencesCommandHandler
} from '../../../src/application/commands/update-preferences-jeune.command.handler'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/jeune-authorizer'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect, StubbedClass, stubClass } from '../../utils'
import { createSandbox } from 'sinon'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { emptySuccess } from '../../../src/building-blocks/types/result'
import { Evenement, EvenementService } from '../../../src/domain/evenement'

describe('UpdateJeunePreferencesCommandHandler', () => {
  let updateJeunePreferencesCommandHandler: UpdateJeunePreferencesCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let evenementService: StubbedClass<EvenementService>

  beforeEach(() => {
    jeuneRepository = stubInterface(createSandbox())
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    evenementService = stubClass(EvenementService)
    updateJeunePreferencesCommandHandler =
      new UpdateJeunePreferencesCommandHandler(
        jeuneRepository,
        jeuneAuthorizer,
        evenementService
      )
  })

  describe('authorize', () => {
    it('autorise le jeune', async () => {
      // Given
      const command: UpdateJeunePreferencesCommand = {
        idJeune: 'idDeJohn',
        partageFavoris: false,
        alertesOffres: false,
        messages: false,
        creationActionConseiller: false,
        rendezVousSessions: false,
        rappelActions: false
      }
      const utilisateur = unUtilisateurJeune()

      // When
      await updateJeunePreferencesCommandHandler.authorize(command, utilisateur)

      // Then
      expect(jeuneAuthorizer.autoriserLeJeune).to.have.been.calledWithExactly(
        'idDeJohn',
        utilisateur
      )
    })
  })

  describe('handle', () => {
    it('met à jour les préférences du jeune', async () => {
      // Given
      const jeune = unJeune()
      const command: UpdateJeunePreferencesCommand = {
        idJeune: 'idDeJohn',
        partageFavoris: false,
        alertesOffres: false,
        messages: false,
        creationActionConseiller: false,
        rendezVousSessions: false,
        rappelActions: false
      }
      jeuneRepository.get.withArgs('idDeJohn').resolves(jeune)

      // When
      const result = await updateJeunePreferencesCommandHandler.handle(command)

      // Then
      expect(jeuneRepository.save).to.have.been.calledWithExactly({
        ...jeune,
        preferences: {
          partageFavoris: false,
          alertesOffres: false,
          messages: false,
          creationActionParConseiller: false,
          rendezVousEtSessions: false,
          rappelActions: false
        }
      })
      expect(result).to.deep.equal(emptySuccess())
    })
  })

  describe('monitor', () => {
    it("crée un événement d'engagement", async () => {
      // Given
      const utilisateur = unUtilisateurJeune()

      // When
      await updateJeunePreferencesCommandHandler.monitor(utilisateur)

      // Then
      expect(evenementService.creer).to.have.been.calledWithExactly(
        Evenement.Code.PREFERENCES_MISES_A_JOUR,
        utilisateur
      )
    })
  })
})

import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Jeune } from 'src/domain/jeune/jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import {
  UpdateJeuneConfigurationApplicationCommand,
  UpdateJeuneConfigurationApplicationCommandHandler
} from '../../../src/application/commands/update-jeune-configuration-application.command.handler'
import { isFailure, isSuccess } from '../../../src/building-blocks/types/result'
import { DateService } from '../../../src/utils/date-service'
import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import { uneDatetime } from '../../fixtures/date.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import ConfigurationApplication = Jeune.ConfigurationApplication

describe('UpdateJeuneConfigurationApplicationCommand', () => {
  let updateJeuneConfigurationApplicationCommandHandler: UpdateJeuneConfigurationApplicationCommandHandler
  let jeuneRepository: StubbedType<Jeune.Repository>
  let jeuneConfigurationApplicationRepository: StubbedType<Jeune.ConfigurationApplication.Repository>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    jeuneRepository = stubInterface(sandbox)
    jeuneConfigurationApplicationRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    const dateService: StubbedClass<DateService> = stubClass(DateService)
    dateService.nowJs.returns(uneDatetime().toJSDate())

    const configurationApplicationFactory =
      new ConfigurationApplication.Factory(dateService)

    updateJeuneConfigurationApplicationCommandHandler =
      new UpdateJeuneConfigurationApplicationCommandHandler(
        jeuneRepository,
        jeuneConfigurationApplicationRepository,
        jeuneAuthorizer,
        configurationApplicationFactory
      )
  })

  describe('handle', () => {
    describe('quand le jeune existe', () => {
      it("met à jour la configuration de l'application du jeune", async () => {
        // Given
        const command: UpdateJeuneConfigurationApplicationCommand = {
          idJeune: 'idJeune',
          pushNotificationToken: 'leNouveauToken',
          appVersion: 'laNouvelleVersion',
          installationId: 'uneInstallationId',
          instanceId: 'uneInstanceId',
          fuseauHoraire: 'Europe/Paris'
        }
        const jeune = unJeune({
          id: 'idJeune',
          configuration: {
            idJeune: 'idJeune',
            pushNotificationToken: 'leToken',
            appVersion: 'laVersion',
            installationId: 'uneInstallationId',
            instanceId: 'uneInstanceId',
            dateDerniereActualisationToken: uneDatetime()
              .minus({ day: 1 })
              .toJSDate(),
            fuseauHoraire: 'Europe/London'
          }
        })
        jeuneRepository.get.withArgs('idJeune').resolves(jeune)

        // When
        const result =
          await updateJeuneConfigurationApplicationCommandHandler.handle(
            command
          )

        // Then
        const configurationApplicationMisAJour: Jeune.ConfigurationApplication =
          {
            idJeune: 'idJeune',
            pushNotificationToken: 'leNouveauToken',
            appVersion: 'laNouvelleVersion',
            installationId: 'uneInstallationId',
            instanceId: 'uneInstanceId',
            fuseauHoraire: 'Europe/Paris',
            dateDerniereActualisationToken: uneDatetime().toJSDate()
          }
        expect(
          jeuneConfigurationApplicationRepository.save
        ).to.have.been.calledWithExactly(configurationApplicationMisAJour)
        expect(isSuccess(result)).to.equal(true)
      })
    })

    describe("quand le jeune n'existe pas", () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: UpdateJeuneConfigurationApplicationCommand = {
          idJeune: 'idJeune',
          pushNotificationToken: 'leNouveauToken'
        }
        jeuneConfigurationApplicationRepository.get
          .withArgs('idJeune')
          .resolves(undefined)

        // When
        const result =
          await updateJeuneConfigurationApplicationCommandHandler.handle(
            command
          )

        // Then
        expect(isFailure(result)).to.equal(true)
      })
    })
  })

  describe('authorize', () => {
    it('authorise un jeune ou conseiller à modifier une action', async () => {
      // Given
      const command: UpdateJeuneConfigurationApplicationCommand = {
        idJeune: 'idJeune',
        pushNotificationToken: 'leNouveauToken'
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await updateJeuneConfigurationApplicationCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(jeuneAuthorizer.authorizeJeune).to.have.been.calledWithExactly(
        command.idJeune,
        utilisateur
      )
    })
  })
})

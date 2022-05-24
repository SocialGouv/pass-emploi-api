import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  NotifierNouvellesImmersionsCommand,
  NotifierNouvellesImmersionsCommandHandler
} from '../../../src/application/commands/notifier-nouvelles-immersions.command.handler'
import { GetOffresImmersionQuery } from '../../../src/application/queries/get-offres-immersion.query.handler'
import { Jeune } from '../../../src/domain/jeune'
import { Notification } from '../../../src/domain/notification'
import { Recherche } from '../../../src/domain/recherche'
import { DateService } from '../../../src/utils/date-service'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import { createSandbox, expect } from '../../utils'
import { uneNouvelleImmersionCommand } from '../../fixtures/offre-immersion.fixture'

describe('NotifierNouvellesImmersionsCommandHandler', () => {
  let notifierNouvellesImmersionsCommandHandler: NotifierNouvellesImmersionsCommandHandler
  const sandbox: SinonSandbox = createSandbox()
  const jeune = unJeune()
  const recherche = uneRecherche()
  let rechercheRepository: StubbedType<Recherche.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationRepository: StubbedType<Notification.Service>

  beforeEach(async () => {
    rechercheRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    notificationRepository = stubInterface(sandbox)
    notifierNouvellesImmersionsCommandHandler =
      new NotifierNouvellesImmersionsCommandHandler(
        rechercheRepository,
        jeuneRepository,
        notificationRepository,
        new DateService()
      )
  })

  describe('handle', () => {
    describe('quand il y a une recherche qui correspond', () => {
      let command: NotifierNouvellesImmersionsCommand

      beforeEach(() => {
        // Given
        command = uneNouvelleImmersionCommand()

        const criteres: GetOffresImmersionQuery = {
          rome: command.immersions[0].rome,
          lat: command.immersions[0].location!.lat,
          lon: command.immersions[0].location!.lon
        }

        rechercheRepository.trouverLesRecherchesImmersions
          .withArgs(criteres, 100, 0)
          .resolves([recherche])
      })
      describe('quand le jeune a un token', () => {
        it('notifie le jeune', async () => {
          // Given
          jeuneRepository.get.withArgs(recherche.idJeune).resolves(jeune)

          // When
          await notifierNouvellesImmersionsCommandHandler.handle(command)

          // Then
          expect(notificationRepository.envoyer).to.have.been.calledWithExactly(
            Notification.createNouvelleOffre(
              jeune.pushNotificationToken,
              recherche.id,
              recherche.titre
            )
          )
        })
      })
      describe('quand le jeune n`a pas de token', () => {
        it('ne notifie pas le jeune', async () => {
          // Given
          jeuneRepository.get
            .withArgs(recherche.idJeune)
            .resolves({ ...jeune, pushNotificationToken: undefined })

          // When
          await notifierNouvellesImmersionsCommandHandler.handle(command)

          // Then
          expect(notificationRepository.envoyer).to.have.callCount(0)
        })
      })
    })
    describe('quand il y a plusieurs pages qui correspondent', () => {
      let command: NotifierNouvellesImmersionsCommand
      let criteres: GetOffresImmersionQuery

      beforeEach(() => {
        // Given
        command = uneNouvelleImmersionCommand()

        criteres = {
          rome: command.immersions[0].rome,
          lat: command.immersions[0].location!.lat,
          lon: command.immersions[0].location!.lon
        }

        rechercheRepository.trouverLesRecherchesImmersions
          .onFirstCall()
          .resolves(creer100(recherche))
          .onSecondCall()
          .resolves([recherche])
      })
      it('parcours toutes les pages', async () => {
        // When
        await notifierNouvellesImmersionsCommandHandler.handle(command)

        // Then
        expect(
          rechercheRepository.trouverLesRecherchesImmersions
        ).to.have.callCount(2)
        expect(
          rechercheRepository.trouverLesRecherchesImmersions
        ).to.been.calledWithExactly(criteres, 100, 0)
        expect(
          rechercheRepository.trouverLesRecherchesImmersions
        ).to.been.calledWithExactly(criteres, 100, 100)
      })
    })
  })
})

function creer100(recherche: Recherche): Recherche[] {
  const recherches: Recherche[] = []
  for (let i = 0; i < 100; i++) {
    recherches.push(recherche)
  }
  return recherches
}

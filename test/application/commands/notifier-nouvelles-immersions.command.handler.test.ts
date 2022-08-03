import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  NotifierNouvellesImmersionsCommand,
  NotifierNouvellesImmersionsCommandHandler
} from '../../../src/application/commands/notifier-nouvelles-immersions.command.handler'
import { GetOffresImmersionQuery } from '../../../src/application/queries/get-offres-immersion.query.handler'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Notification } from '../../../src/domain/notification'
import { Recherche } from '../../../src/domain/recherche'
import { DateService } from '../../../src/utils/date-service'
import { unJeune } from '../../fixtures/jeune.fixture'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { uneNouvelleImmersionCommand } from '../../fixtures/offre-immersion.fixture'

describe('NotifierNouvellesImmersionsCommandHandler', () => {
  let notifierNouvellesImmersionsCommandHandler: NotifierNouvellesImmersionsCommandHandler
  const sandbox: SinonSandbox = createSandbox()
  const jeune = unJeune()
  const recherche = uneRecherche()
  let rechercheRepository: StubbedType<Recherche.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let notificationService: StubbedClass<Notification.Service>

  beforeEach(async () => {
    rechercheRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    notificationService = stubClass(Notification.Service)
    notifierNouvellesImmersionsCommandHandler =
      new NotifierNouvellesImmersionsCommandHandler(
        rechercheRepository,
        jeuneRepository,
        notificationService,
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
      describe('quand le jeune a un pushNotificationToken', () => {
        it('notifie le jeune', async () => {
          // Given
          jeuneRepository.get.withArgs(recherche.idJeune).resolves(jeune)

          // When
          await notifierNouvellesImmersionsCommandHandler.handle(command)

          // Then
          expect(
            notificationService.notifierNouvellesOffres
          ).to.have.been.calledWithExactly(recherche, jeune)
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

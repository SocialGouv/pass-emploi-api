import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { HandleJobNettoyerPiecesJointesCommandHandler } from 'src/application/commands/jobs/handle-job-nettoyer-pieces-jointes.command'
import { isSuccess } from 'src/building-blocks/types/result'
import { Fichier } from 'src/domain/fichier'
import { NotificationSupport } from 'src/domain/notification-support'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unFichierMetadata } from 'test/fixtures/fichier.fixture'
import { DateService } from '../../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobNettoyerPiecesJointesCommandHandler', () => {
  let handleJobNettoyerPiecesJointesCommandHandler: HandleJobNettoyerPiecesJointesCommandHandler
  let fichierRepository: StubbedType<Fichier.Repository>
  let dateSevice: StubbedClass<DateService>
  let notificationSupportService: StubbedType<NotificationSupport.Service>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime())
    notificationSupportService = stubInterface(sandbox)

    handleJobNettoyerPiecesJointesCommandHandler =
      new HandleJobNettoyerPiecesJointesCommandHandler(
        fichierRepository,
        dateSevice,
        notificationSupportService
      )
  })

  it('ne fais rien quand aucun fichier à supprimer', async () => {
    // Given
    fichierRepository.getIdsFichiersBefore.resolves([])

    // When
    const result = await handleJobNettoyerPiecesJointesCommandHandler.handle()

    // Then
    expect(result._isSuccess).to.equal(true)
    if (isSuccess(result)) {
      expect(result.data.fichiersSupprimes).to.equal(0)
      expect(result.data.erreurs).to.equal(0)
    }
  })

  it("supprime les fichiers et catch l'erreur", async () => {
    // Given
    const fichierOld1 = unFichierMetadata({ id: 'old1' })
    const fichierOld2 = unFichierMetadata({ id: 'old2' })

    fichierRepository.getIdsFichiersBefore.resolves([
      fichierOld1.id,
      fichierOld2.id
    ])
    fichierRepository.softDelete.withArgs(fichierOld1.id).rejects()
    fichierRepository.softDelete.withArgs(fichierOld2.id).resolves()

    // When
    const result = await handleJobNettoyerPiecesJointesCommandHandler.handle()

    // Then
    expect(fichierRepository.softDelete).to.have.been.calledTwice()
    expect(result._isSuccess).to.equal(true)
    if (isSuccess(result)) {
      expect(result.data.fichiersSupprimes).to.equal(1)
      expect(result.data.erreurs).to.equal(1)
    }
  })
})

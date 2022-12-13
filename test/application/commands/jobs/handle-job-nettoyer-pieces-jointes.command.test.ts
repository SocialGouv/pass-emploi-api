import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { HandleJobNettoyerPiecesJointesCommandHandler } from 'src/application/commands/jobs/handle-job-nettoyer-pieces-jointes.command'
import { Fichier } from 'src/domain/fichier'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unFichierMetadata } from 'test/fixtures/fichier.fixture'
import { DateService } from '../../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobNettoyerPiecesJointesCommandHandler', () => {
  let handleJobNettoyerPiecesJointesCommandHandler: HandleJobNettoyerPiecesJointesCommandHandler
  let fichierRepository: StubbedType<Fichier.Repository>
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime())
    suiviJobService = stubInterface(sandbox)

    handleJobNettoyerPiecesJointesCommandHandler =
      new HandleJobNettoyerPiecesJointesCommandHandler(
        fichierRepository,
        dateSevice,
        suiviJobService
      )
  })

  it('ne fais rien quand aucun fichier à supprimer', async () => {
    // Given
    fichierRepository.getIdsFichiersBefore.resolves([])

    // When
    const result = await handleJobNettoyerPiecesJointesCommandHandler.handle()

    // Then
    expect(result.succes).to.equal(true)
    expect(result.resultat).to.deep.equal({ fichiersSupprimes: 0 })
    expect(result.nbErreurs).to.equal(0)
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
    expect(result.succes).to.equal(true)
    expect(result.resultat).to.deep.equal({ fichiersSupprimes: 1 })
    expect(result.nbErreurs).to.equal(1)
  })
})

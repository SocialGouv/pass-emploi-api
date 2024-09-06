import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { Chat } from 'src/domain/chat'
import { Fichier } from 'src/domain/fichier'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unFichierMetadata } from 'test/fixtures/fichier.fixture'
import { DateService } from '../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { NettoyerPiecesJointesJobHandler } from '../../../src/application/jobs/nettoyer-pieces-jointes.job.handler'

describe('NettoyerPiecesJointesJobHandler', () => {
  let nettoyerPiecesJointesJobHandler: NettoyerPiecesJointesJobHandler
  let fichierRepository: StubbedType<Fichier.Repository>
  let dateSevice: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let chatRepository: StubbedType<Chat.Repository>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime())
    suiviJobService = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)

    nettoyerPiecesJointesJobHandler = new NettoyerPiecesJointesJobHandler(
      fichierRepository,
      dateSevice,
      suiviJobService,
      chatRepository
    )
  })

  it('ne fais rien quand aucun fichier à supprimer', async () => {
    // Given
    fichierRepository.getFichiersBefore.resolves([])

    // When
    const result = await nettoyerPiecesJointesJobHandler.handle()

    // Then
    expect(result.succes).to.equal(true)
    expect(result.resultat).to.deep.equal({ fichiersSupprimes: 0 })
    expect(result.nbErreurs).to.equal(0)
  })

  it("supprime les fichiers et catch l'erreur", async () => {
    // Given
    const fichierOld1 = unFichierMetadata({ id: 'old1' })
    const fichierOld2 = unFichierMetadata({ id: 'old2' })

    fichierRepository.getFichiersBefore.resolves([fichierOld1, fichierOld2])
    fichierRepository.softDelete.withArgs(fichierOld1.id).rejects()
    fichierRepository.softDelete.withArgs(fichierOld2.id).resolves()

    // When
    const result = await nettoyerPiecesJointesJobHandler.handle()

    // Then
    expect(fichierRepository.softDelete).to.have.been.calledTwice()
    expect(
      chatRepository.envoyerStatutAnalysePJ
    ).to.have.been.calledOnceWithExactly(
      fichierOld2.idCreateur,
      fichierOld2.idMessage,
      'FICHIER_EXPIRE'
    )
    expect(result.succes).to.equal(true)
    expect(result.resultat).to.deep.equal({ fichiersSupprimes: 1 })
    expect(result.nbErreurs).to.equal(1)
  })
})

import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { HandleJobNettoyerArchivesJeunesCommandHandler } from 'src/application/commands/jobs/handle-job-nettoyer-les-archives-jeune.command'
import { isSuccess } from 'src/building-blocks/types/result'
import { ArchiveJeune } from 'src/domain/archive-jeune'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unFichierMetadata } from 'test/fixtures/fichier.fixture'
import { DateService } from '../../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobNettoyerArchivesJeunesCommandHandler', () => {
  let handleJobNettoyerArchivesJeunesCommandHandler: HandleJobNettoyerArchivesJeunesCommandHandler
  let archiveJeuneRepository: StubbedType<ArchiveJeune.Repository>
  let dateSevice: StubbedClass<DateService>

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    archiveJeuneRepository = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime)

    handleJobNettoyerArchivesJeunesCommandHandler =
      new HandleJobNettoyerArchivesJeunesCommandHandler(
        archiveJeuneRepository,
        dateSevice
      )
  })

  it('ne fais rien quand aucun fichier à supprimer', async () => {
    // Given
    archiveJeuneRepository.getIdsArchivesBefore.resolves([])

    // When
    const result = await handleJobNettoyerArchivesJeunesCommandHandler.handle()

    // Then
    expect(result._isSuccess).to.equal(true)
    if (isSuccess(result)) {
      expect(result.data.archivesSupprimees).to.equal(0)
      expect(result.data.erreurs).to.equal(0)
    }
  })

  it("supprime les fichiers et catch l'erreur", async () => {
    // Given
    const fichierOld1 = unFichierMetadata({ id: 'old1' })
    const fichierOld2 = unFichierMetadata({ id: 'old2' })

    archiveJeuneRepository.getIdsArchivesBefore.resolves([
      fichierOld1.id,
      fichierOld2.id
    ])
    archiveJeuneRepository.delete.withArgs(fichierOld1.id).rejects()
    archiveJeuneRepository.delete.withArgs(fichierOld2.id).resolves()

    // When
    const result = await handleJobNettoyerArchivesJeunesCommandHandler.handle()

    // Then
    expect(archiveJeuneRepository.delete).to.have.been.calledTwice()
    expect(result._isSuccess).to.equal(true)
    if (isSuccess(result)) {
      expect(result.data.archivesSupprimees).to.equal(1)
      expect(result.data.erreurs).to.equal(1)
    }
  })
})

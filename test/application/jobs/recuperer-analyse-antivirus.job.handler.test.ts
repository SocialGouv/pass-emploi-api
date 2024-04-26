import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RecupererAnalyseAntivirusJobHandler } from 'src/application/jobs/recuperer-analyse-antivirus.job.handler'
import {
  AnalyseAntivirusPasTerminee,
  FichierMalveillant
} from 'src/building-blocks/types/domain-error'
import { emptySuccess, failure } from 'src/building-blocks/types/result'
import { Chat } from 'src/domain/chat'
import { Fichier } from 'src/domain/fichier'
import { Planificateur } from 'src/domain/planificateur'
import { SuiviJob } from 'src/domain/suivi-job'
import { AntivirusClient } from 'src/infrastructure/clients/antivirus-client'
import { DateService } from 'src/utils/date-service'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unFichierMetadata } from 'test/fixtures/fichier.fixture'
import { testConfig } from 'test/utils/module-for-testing'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('RecupererAnalyseAntivirusJobHandler', () => {
  let jobHandler: RecupererAnalyseAntivirusJobHandler
  let fichierRepository: StubbedType<Fichier.Repository>
  let antivirusClient: StubbedClass<AntivirusClient>
  let chatRepository: StubbedType<Chat.Repository>
  let planificateurRepository: StubbedType<Planificateur.Repository>
  let dateService: StubbedClass<DateService>
  let suiviJobService: StubbedType<SuiviJob.Service>

  const job: Planificateur.Job<Planificateur.JobRecuperereAnalyseAntivirus> = {
    dateExecution: uneDatetime().toJSDate(),
    type: Planificateur.JobType.RECUPERERE_ANALYSE_ANTIVIRUS,
    contenu: { idFichier: 'id-fichier' }
  }

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    fichierRepository = stubInterface(sandbox)
    antivirusClient = stubClass(AntivirusClient)
    chatRepository = stubInterface(sandbox)
    planificateurRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)

    dateService = stubClass(DateService)
    dateService.now.returns(uneDatetime())

    jobHandler = new RecupererAnalyseAntivirusJobHandler(
      fichierRepository,
      antivirusClient,
      chatRepository,
      planificateurRepository,
      testConfig(),
      dateService,
      suiviJobService
    )

    // Given
    fichierRepository.getFichierMetadata.withArgs('id-fichier').resolves(
      unFichierMetadata({
        id: 'id-fichier',
        idCreateur: 'id-jeune',
        idAnalyse: 'id-analyse'
      })
    )
  })

  it('recupere le resultat de l’analyse antivirus d’un fichier', async () => {
    // Given
    antivirusClient.recupererResultatAnalyse.resolves(emptySuccess())

    // When
    await jobHandler.handle(job)

    // Then
    expect(
      antivirusClient.recupererResultatAnalyse
    ).to.have.been.calledOnceWithExactly('id-analyse')
  })

  it('sauvegarde une analyse réussie', async () => {
    // Given
    antivirusClient.recupererResultatAnalyse.resolves(emptySuccess())

    // When
    const result = await jobHandler.handle(job)

    // Then
    expect(
      chatRepository.envoyerStatutAnalysePJ
    ).to.have.been.calledOnceWithExactly(
      'id-jeune',
      'id-message',
      'FICHIER_SAIN'
    )
    expect(result.succes).to.be.true()
    expect(result.resultat).to.equal('Fichier sain')
  })

  it('signale un fichier malveillant', async () => {
    // Given
    antivirusClient.recupererResultatAnalyse.resolves(
      failure(new FichierMalveillant())
    )

    // When
    const result = await jobHandler.handle(job)

    // Then
    expect(
      chatRepository.envoyerStatutAnalysePJ
    ).to.have.been.calledOnceWithExactly(
      'id-jeune',
      'id-message',
      'FICHIER_MALVEILLANT'
    )
    expect(fichierRepository.softDelete).to.have.been.calledOnceWithExactly(
      'id-fichier'
    )
    expect(result.succes).to.be.true()
    expect(result.resultat).to.equal('Fichier malveillant')
  })

  it('replanifie la vérification d’une analyse en cours', async () => {
    // Given
    antivirusClient.recupererResultatAnalyse.resolves(
      failure(new AnalyseAntivirusPasTerminee())
    )

    // When
    const result = await jobHandler.handle(job)

    // Then
    expect(chatRepository.envoyerStatutAnalysePJ).not.to.have.been.called()
    expect(planificateurRepository.creerJob).to.have.been.calledOnceWithExactly(
      {
        dateExecution: dateService.now().plus({ seconds: 15 }).toJSDate(),
        type: Planificateur.JobType.RECUPERERE_ANALYSE_ANTIVIRUS,
        contenu: { idFichier: 'id-fichier' }
      }
    )
    expect(result.succes).to.be.true()
    expect(result.resultat).to.equal(
      'Récupération résultat analyse replanifiée'
    )
  })
})

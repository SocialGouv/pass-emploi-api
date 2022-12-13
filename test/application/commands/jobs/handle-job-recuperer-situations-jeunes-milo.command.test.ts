import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { HandleJobRecupererSituationsJeunesMiloCommandHandler } from 'src/application/commands/jobs/handle-job-recuperer-situations-jeunes-milo.command'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { Jeune } from 'src/domain/jeune/jeune'
import { Milo } from 'src/domain/milo'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { unDossierMilo } from 'test/fixtures/milo.fixture'
import { DateService } from '../../../../src/utils/date-service'
import { createSandbox, expect, StubbedClass, stubClass } from '../../../utils'

describe('HandleJobRecupererSituationsJeunesMiloCommandHandler', () => {
  let handleJobRecupererSituationsJeunesMiloCommandHandler: HandleJobRecupererSituationsJeunesMiloCommandHandler
  let miloRepository: StubbedType<Milo.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let suiviJobService: StubbedType<SuiviJob.Service>
  let dateSevice: StubbedClass<DateService>

  const jeune1 = unJeune({
    id: 'jeune1',
    structure: Core.Structure.MILO,
    idPartenaire: '1',
    dateFinCEJ: undefined
  })
  const jeune2 = unJeune({
    id: 'jeune2',
    structure: Core.Structure.MILO,
    idPartenaire: '2',
    dateFinCEJ: undefined
  })

  beforeEach(() => {
    const sandbox: SinonSandbox = createSandbox()
    miloRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    suiviJobService = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime())

    handleJobRecupererSituationsJeunesMiloCommandHandler =
      new HandleJobRecupererSituationsJeunesMiloCommandHandler(
        miloRepository,
        jeuneRepository,
        suiviJobService,
        dateSevice
      )
  })

  describe("quand aucun jeune n'existe", () => {
    it('ne fais rien', async () => {
      // Given
      jeuneRepository.getJeunesMiloAvecIdDossier.withArgs(0, 100).resolves([])

      // When
      const result =
        await handleJobRecupererSituationsJeunesMiloCommandHandler.handle()

      // Then
      expect(miloRepository.saveSituationsJeune).to.have.callCount(0)
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({
        jeunesMilo: 0,
        situationsJeuneSauvegardees: 0,
        dossiersNonTrouves: 0,
        erreurs: 0
      })
    })
  })

  describe('quand il existe moins de 100 jeunes', () => {
    it('recupere et sauvegarde les situations', async () => {
      // Given
      jeuneRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1, jeune2])
      jeuneRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])
      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(success(unDossierMilo({ id: jeune1.idPartenaire })))
      miloRepository.getDossier
        .withArgs(jeune2.idPartenaire)
        .resolves(failure(new ErreurHttp('', 0)))

      // When
      const result =
        await handleJobRecupererSituationsJeunesMiloCommandHandler.handle()

      // Then
      expect(miloRepository.saveSituationsJeune).to.have.callCount(1)
      expect(
        miloRepository.saveSituationsJeune
      ).to.have.been.calledOnceWithExactly({
        idJeune: jeune1.id,
        situationCourante: undefined,
        situations: []
      })
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({
        jeunesMilo: 2,
        dossiersNonTrouves: 1,
        situationsJeuneSauvegardees: 1,
        erreurs: 0
      })
    })
    it("ne s'arrete pas pas quand une erreur se produit", async () => {
      // Given
      jeuneRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([undefined, jeune1])
      jeuneRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])
      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(success(unDossierMilo({ id: jeune1.idPartenaire })))

      // When
      const result =
        await handleJobRecupererSituationsJeunesMiloCommandHandler.handle()

      // Then
      expect(miloRepository.saveSituationsJeune).to.have.callCount(1)
      expect(
        miloRepository.saveSituationsJeune
      ).to.have.been.calledOnceWithExactly({
        idJeune: jeune1.id,
        situationCourante: undefined,
        situations: []
      })
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({
        jeunesMilo: 2,
        dossiersNonTrouves: 0,
        situationsJeuneSauvegardees: 1,
        erreurs: 1
      })
    })
    it('récupère et sauvegarde une date de fin de CEJ quand elle existe ', async () => {
      // Given
      jeuneRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1])
      jeuneRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])

      miloRepository.getDossier.withArgs(jeune1.idPartenaire).resolves(
        success(
          unDossierMilo({
            id: jeune1.idPartenaire,
            dateFinCEJ: uneDatetime()
          })
        )
      )

      // When
      const result =
        await handleJobRecupererSituationsJeunesMiloCommandHandler.handle()

      // Then
      expect(result.succes).to.equal(true)
      expect(jeuneRepository.save).to.have.calledOnceWithExactly({
        ...jeune1,
        dateFinCEJ: uneDatetime()
      })
    })
  })

  describe('quand il existe plus de 100 jeunes', () => {
    it('récupère et sauvegarde les situations', async () => {
      // Given
      jeuneRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1])
      jeuneRepository.getJeunesMiloAvecIdDossier
        .withArgs(100, 100)
        .resolves([jeune2])
      jeuneRepository.getJeunesMiloAvecIdDossier.withArgs(200, 100).resolves([])
      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(success(unDossierMilo({ id: jeune1.idPartenaire })))
      miloRepository.getDossier
        .withArgs(jeune2.idPartenaire)
        .resolves(failure(new ErreurHttp('', 0)))

      // When
      const result =
        await handleJobRecupererSituationsJeunesMiloCommandHandler.handle()

      // Then
      expect(miloRepository.saveSituationsJeune).to.have.callCount(1)
      expect(
        miloRepository.saveSituationsJeune
      ).to.have.been.calledOnceWithExactly({
        idJeune: jeune1.id,
        situationCourante: undefined,
        situations: []
      })
      expect(result.succes).to.equal(true)
      expect(result.resultat).to.deep.equal({
        jeunesMilo: 2,
        dossiersNonTrouves: 1,
        situationsJeuneSauvegardees: 1,
        erreurs: 0
      })
    })
  })
})

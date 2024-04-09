import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { RecupererSituationsJeunesMiloJobHandler } from 'src/application/jobs/recuperer-situations-jeunes-milo.job.handler'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { failure, success } from 'src/building-blocks/types/result'
import { Core } from 'src/domain/core'
import { SuiviJob } from 'src/domain/suivi-job'
import { uneDatetime } from 'test/fixtures/date.fixture'
import { unJeune } from 'test/fixtures/jeune.fixture'
import { unDossierMilo } from 'test/fixtures/milo.fixture'
import { JeuneMilo } from '../../../src/domain/milo/jeune.milo'
import { DateService } from '../../../src/utils/date-service'
import { StubbedClass, createSandbox, expect, stubClass } from '../../utils'

describe('RecupererSituationsJeunesMiloJobHandler', () => {
  let recupererSituationsJeunesMiloJobHandler: RecupererSituationsJeunesMiloJobHandler
  let miloRepository: StubbedType<JeuneMilo.Repository>
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
    suiviJobService = stubInterface(sandbox)
    dateSevice = stubClass(DateService)
    dateSevice.now.returns(uneDatetime())

    recupererSituationsJeunesMiloJobHandler =
      new RecupererSituationsJeunesMiloJobHandler(
        miloRepository,
        suiviJobService,
        dateSevice
      )
  })

  describe("quand aucun jeune n'existe", () => {
    it('ne fais rien', async () => {
      // Given
      miloRepository.getJeunesMiloAvecIdDossier.withArgs(0, 100).resolves([])

      // When
      const result = await recupererSituationsJeunesMiloJobHandler.handle()

      // Then
      expect(miloRepository.save).to.have.callCount(0)
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
      miloRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1, jeune2])
      miloRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])
      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(success(unDossierMilo({ id: jeune1.idPartenaire })))
      miloRepository.getDossier
        .withArgs(jeune2.idPartenaire)
        .resolves(failure(new ErreurHttp('', 0)))

      // When
      const result = await recupererSituationsJeunesMiloJobHandler.handle()

      // Then
      expect(miloRepository.save).to.have.been.calledOnceWithExactly(
        jeune1,
        '9222000',
        null
      )
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
      miloRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([undefined, jeune1])
      miloRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])
      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(success(unDossierMilo({ id: jeune1.idPartenaire })))

      // When
      const result = await recupererSituationsJeunesMiloJobHandler.handle()

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
      miloRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1])
      miloRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])

      miloRepository.getDossier.withArgs(jeune1.idPartenaire).resolves(
        success(
          unDossierMilo({
            id: jeune1.idPartenaire,
            dateFinCEJ: uneDatetime()
          })
        )
      )

      // When
      const result = await recupererSituationsJeunesMiloJobHandler.handle()

      // Then
      expect(result.succes).to.equal(true)
      expect(
        miloRepository.marquerAARchiver
      ).to.have.been.calledOnceWithExactly(jeune1.id, false)
      expect(miloRepository.save).to.have.calledOnceWithExactly(
        jeune1,
        '9222000',
        uneDatetime()
      )
    })

    it('marque un jeune à archiver', async () => {
      // Given
      miloRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1])
      miloRepository.getJeunesMiloAvecIdDossier.withArgs(100, 100).resolves([])

      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(failure(new ErreurHttp('Erreur', 404)))

      // When
      const result = await recupererSituationsJeunesMiloJobHandler.handle()

      // Then
      expect(result.succes).to.equal(true)
      expect(
        miloRepository.marquerAARchiver
      ).to.have.been.calledOnceWithExactly(jeune1.id, true)
      expect(miloRepository.save).not.to.have.been.called()
    })
  })

  describe('quand il existe plus de 100 jeunes', () => {
    it('récupère et sauvegarde les situations', async () => {
      // Given
      miloRepository.getJeunesMiloAvecIdDossier
        .withArgs(0, 100)
        .resolves([jeune1])
      miloRepository.getJeunesMiloAvecIdDossier
        .withArgs(100, 100)
        .resolves([jeune2])
      miloRepository.getJeunesMiloAvecIdDossier.withArgs(200, 100).resolves([])
      miloRepository.getDossier
        .withArgs(jeune1.idPartenaire)
        .resolves(success(unDossierMilo({ id: jeune1.idPartenaire })))
      miloRepository.getDossier
        .withArgs(jeune2.idPartenaire)
        .resolves(failure(new ErreurHttp('', 0)))

      // When
      const result = await recupererSituationsJeunesMiloJobHandler.handle()

      // Then
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

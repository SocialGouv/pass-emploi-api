import {
  GetRendezVousJeuneQuery,
  GetRendezVousJeuneQueryHandler
} from '../../../src/application/queries/get-rendez-vous-jeune.query.handler'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { RendezVous } from '../../../src/domain/rendez-vous'
import { ConseillerForJeuneAuthorizer } from '../../../src/application/authorizers/authorize-conseiller-for-jeune'
import { JeuneAuthorizer } from '../../../src/application/authorizers/authorize-jeune'
import { SinonSandbox } from 'sinon'
import { RendezVousQueryModel } from '../../../src/application/queries/query-models/rendez-vous.query-models'
import { Result } from '../../../src/building-blocks/types/result'

describe('GetRendezVousJeuneQueryHandler', () => {
  let rendezVousRepository: StubbedType<RendezVous.Repository>
  let conseillerForJeuneAuthorizer: StubbedClass<ConseillerForJeuneAuthorizer>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let getRendezVousQueryHandler: GetRendezVousJeuneQueryHandler
  let sandbox: SinonSandbox

  before(() => {
    sandbox = createSandbox()
    rendezVousRepository = stubInterface(sandbox)
    conseillerForJeuneAuthorizer = stubClass(ConseillerForJeuneAuthorizer)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)

    getRendezVousQueryHandler = new GetRendezVousJeuneQueryHandler(
      rendezVousRepository,
      conseillerForJeuneAuthorizer,
      jeuneAuthorizer
    )
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('handle', () => {
    const idJeune = '1'
    const rendezVousReponse: RendezVousQueryModel[] = []

    describe('sans periode', () => {
      it('appelle la methode pour tous les rendez-vous', async () => {
        // Given
        const query: GetRendezVousJeuneQuery = {
          idJeune: idJeune,
          periode: undefined
        }
        rendezVousRepository.getAllQueryModelsByJeune.resolves(
          rendezVousReponse
        )
        // When
        const obtenu: Result<RendezVousQueryModel[]> =
          await getRendezVousQueryHandler.handle(query)

        // Then
        expect(
          rendezVousRepository.getAllQueryModelsByJeune
        ).to.have.been.calledWithExactly(query.idJeune)
        expect(obtenu._isSuccess).to.equal(true)
        if (obtenu._isSuccess) {
          expect(obtenu.data).to.equal(rendezVousReponse)
        }
      })
    })

    describe('periode FUTURS renseignée', () => {
      it('appelle la methode pour les rendez-vous futurs', async () => {
        // Given
        const query: GetRendezVousJeuneQuery = {
          idJeune: idJeune,
          periode: RendezVous.Periode.FUTURS
        }
        rendezVousRepository.getRendezVousFutursQueryModelsByJeune.resolves(
          rendezVousReponse
        )
        // When
        const obtenu: Result<RendezVousQueryModel[]> =
          await getRendezVousQueryHandler.handle(query)

        // Then
        expect(
          rendezVousRepository.getRendezVousFutursQueryModelsByJeune
        ).to.have.been.calledWithExactly(query.idJeune)
        expect(obtenu._isSuccess).to.equal(true)
        if (obtenu._isSuccess) {
          expect(obtenu.data).to.equal(rendezVousReponse)
        }
      })
    })
    describe('periode PASSES renseignée', () => {
      it('appelle la methode pour les rendez-vous passés', async () => {
        // Given
        const query: GetRendezVousJeuneQuery = {
          idJeune: idJeune,
          periode: RendezVous.Periode.PASSES
        }
        rendezVousRepository.getRendezVousPassesQueryModelsByJeune.resolves(
          rendezVousReponse
        )
        // When
        const obtenu: Result<RendezVousQueryModel[]> =
          await getRendezVousQueryHandler.handle(query)

        // Then
        expect(
          rendezVousRepository.getRendezVousPassesQueryModelsByJeune
        ).to.have.been.calledWithExactly(query.idJeune)
        expect(obtenu._isSuccess).to.equal(true)
        if (obtenu._isSuccess) {
          expect(obtenu.data).to.equal(rendezVousReponse)
        }
      })
    })
  })
})

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
    const uneDate: Date = new Date('2022-10-10')
    describe('dateMin renseignée', () => {
      it('appelle la methode pour les rendez-vous futurs', async () => {
        // Given
        const query: GetRendezVousJeuneQuery = {
          idJeune: idJeune,
          dateMin: uneDate,
          dateMax: undefined
        }
        const rendezVousReponse: RendezVousQueryModel[] = []
        rendezVousRepository.getQueryModelsByJeuneAfter
          .withArgs(query.idJeune, query.dateMin)
          .resolves(rendezVousReponse)

        // When
        const obtenu: Result<RendezVousQueryModel[]> =
          await getRendezVousQueryHandler.handle(query)

        // Then
        expect(
          rendezVousRepository.getQueryModelsByJeuneAfter
        ).to.have.been.calledWithExactly(query.idJeune, query.dateMin)
        expect(obtenu._isSuccess).to.equal(true)
        if (obtenu._isSuccess) {
          expect(obtenu.data).to.equal(rendezVousReponse)
        }
      })
    })
    describe('dateMax renseignée', () => {
      it('appelle la methode pour les rendez-vous passés', async () => {
        // Given
        const query: GetRendezVousJeuneQuery = {
          idJeune: idJeune,
          dateMin: undefined,
          dateMax: uneDate
        }
        const rendezVousReponse: RendezVousQueryModel[] = []
        rendezVousRepository.getQueryModelsByJeuneBefore
          .withArgs(query.idJeune, query.dateMax)
          .resolves(rendezVousReponse)

        // When
        const obtenu: Result<RendezVousQueryModel[]> =
          await getRendezVousQueryHandler.handle(query)

        // Then
        expect(
          rendezVousRepository.getQueryModelsByJeuneBefore
        ).to.have.been.calledWithExactly(query.idJeune, query.dateMax)
        expect(obtenu._isSuccess).to.equal(true)
        if (obtenu._isSuccess) {
          expect(obtenu.data).to.equal(rendezVousReponse)
        }
      })
    })
  })
})

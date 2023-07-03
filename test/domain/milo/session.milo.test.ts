import { expect } from 'chai'
import { SessionMilo } from 'src/domain/milo/session.milo'
import { StubbedClass, stubClass } from 'test/utils'
import { DateService } from 'src/utils/date-service'
import { uneDatetime } from 'test/fixtures/date.fixture'

describe('Session.Milo', () => {
  describe('Factory', () => {
    let sessionMiloFactory: SessionMilo.Factory
    let dateService: StubbedClass<DateService>

    beforeEach(() => {
      dateService = stubClass(DateService)
      sessionMiloFactory = new SessionMilo.Factory(dateService)
    })

    describe('mettreAJour', () => {
      it('renvoie la session Milo à jour', async () => {
        // Given
        const session: SessionMilo = {
          id: 'id-session',
          estVisible: true,
          idStructureMilo: 'id-structure',
          dateModification: uneDatetime()
        }
        dateService.now.returns(uneDatetime())

        // When
        const sessionMiloAJour = sessionMiloFactory.mettreAJour(
          session.id,
          session.estVisible,
          session.idStructureMilo
        )
        // Then
        expect(sessionMiloAJour).to.deep.equal({
          id: 'id-session',
          estVisible: true,
          idStructureMilo: 'id-structure',
          dateModification: uneDatetime()
        })
      })
    })
  })
})

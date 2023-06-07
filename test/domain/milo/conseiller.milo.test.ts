import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { createSandbox } from 'sinon'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../src/infrastructure/clients/milo-client'
import { StubbedClass, stubClass } from '../../utils'
import { expect } from 'chai'
import { failure, success } from '../../../src/building-blocks/types/result'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { uneStructureConseillerMiloDto } from '../../fixtures/milo-dto.fixture'
import { unConseillerMilo } from '../../fixtures/conseiller-milo.fixture'

describe('Conseiller.Milo', () => {
  describe('Service', () => {
    let conseillerMiloService: Conseiller.Milo.Service
    let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
    let conseillerMiloFactory: StubbedClass<Conseiller.Milo.Factory>
    let miloClient: StubbedClass<MiloClient>
    let keycloakClient: StubbedClass<KeycloakClient>

    beforeEach(() => {
      const sandbox = createSandbox()
      conseillerMiloRepository = stubInterface(sandbox)
      conseillerMiloFactory = stubClass(Conseiller.Milo.Factory)
      miloClient = stubClass(MiloClient)
      keycloakClient = stubClass(KeycloakClient)
      conseillerMiloService = new Conseiller.Milo.Service(
        conseillerMiloRepository,
        conseillerMiloFactory,
        miloClient,
        keycloakClient
      )
    })

    describe('recupererEtMettreAJourStructure', () => {
      it("ne met pas à jour quand le conseiller Milo n'existe pas", async () => {
        // Given
        const idConseiller = 'inconnu'
        conseillerMiloRepository.get
          .withArgs(idConseiller)
          .resolves(
            failure(new NonTrouveError('Conseiller Milo', idConseiller))
          )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          'tok'
        )

        // Then
        expect(
          conseillerMiloFactory.mettreAJourStructure
        ).not.have.been.called()
        expect(conseillerMiloRepository.update).not.have.been.called()
      })
      it('ne met pas à jour quand la récupération de la structure Milo échoue', async () => {
        // Given
        const idConseiller = 'connu'
        conseillerMiloRepository.get
          .withArgs(idConseiller)
          .resolves(success(unConseillerMilo({ id: idConseiller })))
        const token = 'tok'
        const idpToken = 'idpTok'
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(failure(new ErreurHttp('test', 400)))

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloFactory.mettreAJourStructure
        ).not.have.been.called()
        expect(conseillerMiloRepository.update).not.have.been.called()
      })
      it('ne met pas à jour quand la structure Milo est inchangée', async () => {
        // Given
        const idConseiller = 'connu'
        const idStructure = '10'
        conseillerMiloRepository.get
          .withArgs(idConseiller)
          .resolves(
            success(unConseillerMilo({ id: idConseiller, idStructure }))
          )
        const token = 'tok'
        const idpToken = 'idpTok'
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(uneStructureConseillerMiloDto({ id: Number(idStructure) }))
          )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloFactory.mettreAJourStructure
        ).not.have.been.called()
        expect(conseillerMiloRepository.update).not.have.been.called()
      })
      it('met à jour la structure Milo', async () => {
        // Given
        const idConseiller = 'connu'
        const idStructure = '10'
        conseillerMiloRepository.get
          .withArgs(idConseiller)
          .resolves(
            success(unConseillerMilo({ id: idConseiller, idStructure }))
          )
        const token = 'tok'
        const idpToken = 'idpTok'
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)

        const idNouvelleStructure = '11'
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(
              uneStructureConseillerMiloDto({ id: Number(idNouvelleStructure) })
            )
          )

        const conseillerMiloAvecStructure = unConseillerMilo({
          id: idConseiller,
          idStructure: idNouvelleStructure
        })
        conseillerMiloFactory.mettreAJourStructure.returns(
          conseillerMiloAvecStructure
        )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloFactory.mettreAJourStructure
        ).to.have.been.calledOnceWithExactly(idConseiller, idNouvelleStructure)
        expect(
          conseillerMiloRepository.update
        ).to.have.been.calledOnceWithExactly(conseillerMiloAvecStructure)
      })
    })
  })

  describe('Factory', () => {
    let conseillerMiloFactory: Conseiller.Milo.Factory

    beforeEach(() => {
      conseillerMiloFactory = new Conseiller.Milo.Factory()
    })

    describe('mettreAJourStructure', () => {
      it('renvoie le conseiller Milo avec la nouvelle structure', async () => {
        // Given
        const conseiller: Conseiller.Milo = {
          id: 'test',
          idStructure: '1'
        }
        const nouvelleStructure = '2'
        // When
        const conseillerAJour = conseillerMiloFactory.mettreAJourStructure(
          conseiller.id,
          nouvelleStructure
        )
        // Then
        expect(conseillerAJour).to.deep.equal({
          id: conseiller.id,
          idStructure: nouvelleStructure
        })
      })
    })
  })
})

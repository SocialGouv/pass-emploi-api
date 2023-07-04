import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { createSandbox } from 'sinon'
import {
  ErreurHttp,
  NonTrouveError
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../src/infrastructure/clients/milo-client'
import { unConseillerMilo } from '../../fixtures/conseiller-milo.fixture'
import { uneStructureConseillerMiloDto } from '../../fixtures/milo-dto.fixture'
import { StubbedClass, stubClass } from '../../utils'

describe('Conseiller.Milo', () => {
  describe('Service', () => {
    let conseillerMiloService: Conseiller.Milo.Service
    let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
    let miloClient: StubbedClass<MiloClient>
    let keycloakClient: StubbedClass<KeycloakClient>

    beforeEach(() => {
      const sandbox = createSandbox()
      conseillerMiloRepository = stubInterface(sandbox)
      miloClient = stubClass(MiloClient)
      keycloakClient = stubClass(KeycloakClient)
      conseillerMiloService = new Conseiller.Milo.Service(
        conseillerMiloRepository,
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
        expect(conseillerMiloRepository.save).not.have.been.called()
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
        expect(conseillerMiloRepository.save).not.have.been.called()
      })
      it('ne met pas à jour quand la structure Milo est inchangée', async () => {
        // Given
        const idConseiller = 'connu'
        const idStructure = '10'
        conseillerMiloRepository.get.withArgs(idConseiller).resolves(
          success(
            unConseillerMilo({
              id: idConseiller,
              structure: { id: idStructure, timezone: 'Europe/Paris' }
            })
          )
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
        expect(conseillerMiloRepository.save).not.have.been.called()
      })
      it('met à jour la structure Milo quand elle existe dans le referentiel', async () => {
        // Given
        const idConseiller = 'connu'
        const idStructure = '10'
        conseillerMiloRepository.get.withArgs(idConseiller).resolves(
          success(
            unConseillerMilo({
              id: idConseiller,
              structure: { id: idStructure, timezone: 'Europe/Paris' }
            })
          )
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
        conseillerMiloRepository.structureExiste
          .withArgs(idNouvelleStructure)
          .resolves(true)

        const conseillerMiloAvecStructure = {
          id: idConseiller,
          idStructure: idNouvelleStructure
        }

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloRepository.save
        ).to.have.been.calledOnceWithExactly(conseillerMiloAvecStructure)
      })
      it("met à null la structure Milo quand elle n'existe dans le referentiel", async () => {
        // Given
        const idConseiller = 'connu'
        const idStructure = '10'
        conseillerMiloRepository.get.withArgs(idConseiller).resolves(
          success(
            unConseillerMilo({
              id: idConseiller,
              structure: { id: idStructure, timezone: 'Europe/Paris' }
            })
          )
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
        conseillerMiloRepository.structureExiste
          .withArgs(idNouvelleStructure)
          .resolves(false)

        const conseillerMiloAvecStructure = {
          id: idConseiller,
          idStructure: null
        }

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloRepository.save
        ).to.have.been.calledOnceWithExactly(conseillerMiloAvecStructure)
      })
    })
  })
})

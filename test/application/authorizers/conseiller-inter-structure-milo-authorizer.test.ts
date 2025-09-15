import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { ConseillerInterStructureMiloAuthorizer } from '../../../src/application/authorizers/conseiller-inter-structure-milo-authorizer'
import { DroitsInsuffisants } from '../../../src/building-blocks/types/domain-error'
import {
  emptySuccess,
  failure,
  success
} from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller'
import { JeuneMilo } from '../../../src/domain/milo/jeune.milo'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseillerMilo } from '../../fixtures/conseiller-milo.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect } from '../../utils'

describe('ConseillerInterStructureMiloAuthorizer', () => {
  let conseillerRepository: StubbedType<Conseiller.Milo.Repository>
  let jeuneRepository: StubbedType<JeuneMilo.Repository>
  let authorizer: ConseillerInterStructureMiloAuthorizer

  beforeEach(() => {
    const sandbox = createSandbox()
    conseillerRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    authorizer = new ConseillerInterStructureMiloAuthorizer(
      conseillerRepository,
      jeuneRepository
    )
  })

  describe('autoriserConseillerPourUneStructureMilo', () => {
    describe('quand le conseiller est sur la bonne strucutre', () => {
      it('retourne un success', async () => {
        // Given
        const conseiller = unConseillerMilo()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get
          .withArgs(conseiller.id)
          .resolves(success(conseiller))

        // When
        const result = await authorizer.autoriserConseillerPourUneStructureMilo(
          conseiller.structure.id,
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le conseiller est sur une mauvaise strucutre', () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseillerMilo()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        // When
        const result = await authorizer.autoriserConseillerPourUneStructureMilo(
          'autre',
          utilisateur
        )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })

  describe('autoriserConseillerAvecLaMemeStructureQueLeJeune', () => {
    describe('quand le conseiller est sur la strucutre du jeune', () => {
      it('retourne un success', async () => {
        // Given
        const conseiller = unConseillerMilo()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get
          .withArgs(conseiller.id)
          .resolves(success(conseiller))

        const jeune: JeuneMilo = {
          ...unJeune({}),
          idStructureMilo: conseiller.structure.id
        }
        jeuneRepository.get.withArgs(jeune.id).resolves(success(jeune))

        // When
        const result =
          await authorizer.autoriserConseillerAvecLaMemeStructureQueLeJeune(
            jeune.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand le conseiller est sur une autre strucutre que celle du jeune', () => {
      it('retourne une failure', async () => {
        // Given
        const conseiller = unConseillerMilo()
        const utilisateur = unUtilisateurConseiller({ id: conseiller.id })

        conseillerRepository.get.withArgs(conseiller.id).resolves(conseiller)

        const jeune: JeuneMilo = {
          ...unJeune({}),
          idStructureMilo: 'autre-milo'
        }
        jeuneRepository.get.withArgs(jeune.id).resolves(jeune)

        // When
        const result =
          await authorizer.autoriserConseillerAvecLaMemeStructureQueLeJeune(
            jeune.id,
            utilisateur
          )

        // Then
        expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
      })
    })
  })
})

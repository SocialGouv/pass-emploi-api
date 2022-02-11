import { unUtilisateurJeune } from '../../fixtures/authentification.fixture'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import {
  emptySuccess,
  failure
} from '../../../src/building-blocks/types/result'
import { unJeune } from '../../fixtures/jeune.fixture'
import { RechercheNonTrouveeError } from '../../../src/building-blocks/types/domain-error'
import { RechercheAuthorizer } from '../../../src/application/authorizers/authorize-recherche'
import { Recherche } from '../../../src/domain/recherche'
import { uneRecherche } from '../../fixtures/recherche.fixture'
import {
  DeleteRechercheCommand,
  DeleteRechercheCommandHandler
} from '../../../src/application/commands/delete-recherche.command.handler'

describe('DeleteRechercheCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rechercheSqlRepository: StubbedType<Recherche.Repository>
  let rechercheAuthorizer: StubbedClass<RechercheAuthorizer>
  let deleteRechercheCommandHandler: DeleteRechercheCommandHandler
  let recherche: Recherche
  const jeune = unJeune()

  beforeEach(async () => {
    recherche = uneRecherche()
    const sandbox: SinonSandbox = createSandbox()
    rechercheSqlRepository = stubInterface(sandbox)
    rechercheAuthorizer = stubClass(RechercheAuthorizer)

    deleteRechercheCommandHandler = new DeleteRechercheCommandHandler(
      rechercheSqlRepository,
      rechercheAuthorizer
    )
  })

  describe('handle', () => {
    describe('quand la recherche existe', () => {
      it('supprime la recherche', async () => {
        // Given
        rechercheSqlRepository.getRecherche
          .withArgs(recherche.id, jeune.id)
          .resolves(true)

        const command: DeleteRechercheCommand = {
          idRecherche: recherche.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteRechercheCommandHandler.handle(command)
        // Then
        expect(rechercheSqlRepository.deleteRecherche).to.have.been.calledWith(
          command.idRecherche,
          command.idJeune
        )
        expect(result).to.deep.equal(emptySuccess())
      })
    })
    describe('quand la recherche n"existe pas', () => {
      it('renvoie une failure', async () => {
        // Given
        rechercheSqlRepository.getRecherche
          .withArgs(recherche.id, jeune.id)
          .resolves(false)

        const command: DeleteRechercheCommand = {
          idRecherche: recherche.id,
          idJeune: jeune.id
        }

        // When
        const result = await deleteRechercheCommandHandler.handle(command)
        // Then
        expect(result).to.deep.equal(
          failure(
            new RechercheNonTrouveeError(command.idJeune, command.idRecherche)
          )
        )
        expect(
          rechercheSqlRepository.deleteRecherche
        ).not.to.have.been.calledWith(command.idRecherche, command.idJeune)
      })
    })
  })

  describe('authorize', () => {
    it('autorise un jeune a supprimer sa recherche', async () => {
      // Given
      const command: DeleteRechercheCommand = {
        idRecherche: recherche.id,
        idJeune: jeune.id
      }

      const utilisateur = unUtilisateurJeune()

      // When
      await deleteRechercheCommandHandler.authorize(command, utilisateur)

      // Then
      expect(rechercheAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idJeune,
        command.idRecherche,
        utilisateur
      )
    })
  })
})

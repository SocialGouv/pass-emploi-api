import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { SinonSandbox } from 'sinon'
import { JeuneAuthorizer } from 'src/application/authorizers/authorize-jeune'
import { success } from 'src/building-blocks/types/result'
import { IdService } from 'src/utils/id-service'
import {
  CreateRechercheCommand,
  CreateRechercheCommandHandler
} from '../../../src/application/commands/create-recherche.command.handler'
import { Recherche } from '../../../src/domain/recherche'
import {
  createSandbox,
  DatabaseForTesting,
  expect,
  StubbedClass,
  stubClass
} from '../../utils'

describe.only('CreateActionCommandHandler', () => {
  DatabaseForTesting.prepare()
  let rechercheRepository: StubbedType<Recherche.Repository>
  let idService: StubbedClass<IdService>
  let jeuneAuthorizer: StubbedClass<JeuneAuthorizer>
  let createRechercheCommandHandler: CreateRechercheCommandHandler

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    rechercheRepository = stubInterface(sandbox)
    jeuneAuthorizer = stubClass(JeuneAuthorizer)
    idService = stubClass(IdService)
    createRechercheCommandHandler = new CreateRechercheCommandHandler(
      rechercheRepository,
      idService,
      jeuneAuthorizer
    )
  })

  describe('handle', () => {
    describe('quand la recherche est sauvegardée', () => {
      it("renvoie l'id de la recherche", async () => {
        // Given
        const idRecherche = 'un-id'
        idService.uuid.returns(idRecherche)
        const command: CreateRechercheCommand = {
          idJeune: '',
          type: Recherche.Type.OFFRES_EMPLOI,
          titre: '',
          metier: '',
          localisation: '',
          criteres: {}
        }

        // When
        const result = await createRechercheCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(success({ id: idRecherche }))
      })
    })
  })
})

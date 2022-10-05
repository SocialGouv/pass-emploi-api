import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../src/application/authorizers/authorize-conseiller'

import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../../src/application/commands/creer-jeune-milo.command.handler'
import {
  DossierExisteDejaError,
  DroitsInsuffisants,
  EmailExisteDejaError,
  ErreurHttp,
  MauvaiseCommandeError
} from '../../../src/building-blocks/types/domain-error'
import {
  failure,
  isSuccess,
  success
} from '../../../src/building-blocks/types/result'
import { Authentification } from '../../../src/domain/authentification'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Jeune } from '../../../src/domain/jeune/jeune'
import { Milo } from '../../../src/domain/milo'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { unJeune } from '../../fixtures/jeune.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'

describe('CreerJeuneMiloCommandHandler', () => {
  let creerJeuneMiloCommandHandler: CreerJeuneMiloCommandHandler
  const conseiller = unConseiller()
  const idNouveauJeune = 'DFKAL'
  const date = DateTime.fromISO('2020-04-06T12:00:00.000Z')
  let miloRepository: StubbedType<Milo.Repository>
  let jeuneRepository: StubbedType<Jeune.Repository>
  let authentificationRepository: StubbedType<Authentification.Repository>
  let conseillerRepository: StubbedType<Conseiller.Repository>
  let chatRepository: StubbedType<Chat.Repository>
  let conseillerAuthorizer: StubbedClass<ConseillerAuthorizer>

  beforeEach(async () => {
    const sandbox: SinonSandbox = createSandbox()
    miloRepository = stubInterface(sandbox)
    jeuneRepository = stubInterface(sandbox)
    authentificationRepository = stubInterface(sandbox)
    conseillerRepository = stubInterface(sandbox)
    chatRepository = stubInterface(sandbox)
    conseillerAuthorizer = stubClass(ConseillerAuthorizer)
    const dateService = stubClass(DateService)
    const idService = stubClass(IdService)
    idService.uuid.returns(idNouveauJeune)
    dateService.now.returns(date)
    conseillerRepository.get.withArgs('idConseiller').resolves(conseiller)
    creerJeuneMiloCommandHandler = new CreerJeuneMiloCommandHandler(
      conseillerAuthorizer,
      miloRepository,
      jeuneRepository,
      authentificationRepository,
      conseillerRepository,
      chatRepository,
      new Jeune.Factory(dateService, idService)
    )
  })

  describe('handle', () => {
    describe('quand il existe déjà un jeune avec cet email', () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        jeuneRepository.getByEmail.withArgs(command.email).resolves(unJeune())

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new EmailExisteDejaError(command.email))
        )
      })
    })
    describe('quand il existe déjà un jeune avec cet id dossier', () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        jeuneRepository.getByIdDossier
          .withArgs(command.idPartenaire)
          .resolves(unJeune())

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new DossierExisteDejaError(command.idPartenaire))
        )
      })
    })
    describe("quand il n'existe pas dans Milo", () => {
      it('crée un jeune et initialise le chat si besoin', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        miloRepository.creerJeune
          .withArgs(command.idPartenaire)
          .resolves(success({ idAuthentification: 'mon-sub' }))

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        const expextedJeune: Jeune = {
          id: 'DFKAL',
          firstName: 'prenom',
          lastName: 'nom',
          email: 'email',
          isActivated: false,
          creationDate: date,
          conseiller: {
            id: '1',
            lastName: 'Tavernier',
            firstName: 'Nils',
            email: 'nils.tavernier@passemploi.com'
          },
          structure: Core.Structure.MILO,
          preferences: { partageFavoris: true },
          idPartenaire: 'idDossier'
        }
        expect(jeuneRepository.save).to.have.been.calledWithExactly(
          expextedJeune
        )
        expect(
          authentificationRepository.updateJeune
        ).to.have.been.calledWithExactly({
          id: idNouveauJeune,
          idAuthentification: 'mon-sub'
        })
        expect(
          chatRepository.initializeChatIfNotExists
        ).to.have.been.calledWith(idNouveauJeune, conseiller.id)
        expect(result).to.deep.equal(success({ id: idNouveauJeune }))
      })

      it("minusculise l'email", async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'Jeune.Nom@Email.Com',
          idConseiller: 'idConseiller'
        }
        miloRepository.creerJeune
          .withArgs(command.idPartenaire)
          .resolves(success({ idAuthentification: 'mon-sub' }))

        // When
        await creerJeuneMiloCommandHandler.handle(command)

        // Then
        const expected: Jeune = {
          id: 'DFKAL',
          firstName: 'prenom',
          lastName: 'nom',
          email: 'jeune.nom@email.com',
          isActivated: false,
          creationDate: date,
          conseiller: {
            id: '1',
            lastName: 'Tavernier',
            firstName: 'Nils',
            email: 'nils.tavernier@passemploi.com'
          },
          structure: Core.Structure.MILO,
          preferences: { partageFavoris: true },
          idPartenaire: 'idDossier'
        }
        expect(jeuneRepository.save).to.have.been.calledWithExactly(expected)
      })
    })

    describe('quand il existe déjà chez Milo', () => {
      it("renvoie un succès quand il n'existe pas chez nous", async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        miloRepository.creerJeune
          .withArgs(command.idPartenaire)
          .resolves(success({ idAuthentification: 'mon-sub' }))

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(isSuccess(result)).to.be.true()
      })
      it('renvoie une erreur quand il existe pas chez nous', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        const echec = failure(
          new MauvaiseCommandeError(
            'Utilisateur déjà créé, veuillez contacter le support.'
          )
        )
        miloRepository.creerJeune.resolves(echec)

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(echec)
      })
    })
    describe('quand Milo casse', () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        const echec = failure(new ErreurHttp(command.email, 400))
        miloRepository.creerJeune.resolves(echec)

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(echec)
      })
    })

    describe('quand il existe chez Milo ou bien que ça casse', () => {
      it('renvoie une erreur', () => {
        // Given
        // When
        // Then
      })
    })
  })

  describe('authorize', () => {
    it('authorise un conseiller milo', async () => {
      // Given
      const command: CreerJeuneMiloCommand = {
        idPartenaire: 'idDossier',
        nom: 'nom',
        prenom: 'prenom',
        email: 'email',
        idConseiller: 'idConseiller'
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await creerJeuneMiloCommandHandler.authorize(command, utilisateur)

      // Then

      expect(conseillerAuthorizer.authorize).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur
      )
    })
    it('rejette un conseiller pole emploi', async () => {
      // Given
      const command: CreerJeuneMiloCommand = {
        idPartenaire: 'idDossier',
        nom: 'nom',
        prenom: 'prenom',
        email: 'email',
        idConseiller: 'idConseiller'
      }

      const utilisateur = unUtilisateurConseiller({
        structure: Core.Structure.POLE_EMPLOI
      })

      // When
      const result = await creerJeuneMiloCommandHandler.authorize(
        command,
        utilisateur
      )

      // Then
      expect(result).to.deep.equal(failure(new DroitsInsuffisants()))
    })
  })
})

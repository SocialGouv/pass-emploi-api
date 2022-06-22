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
  EmailExisteDejaError,
  ErreurHttp
} from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Chat } from '../../../src/domain/chat'
import { Conseiller } from '../../../src/domain/conseiller'
import { Core } from '../../../src/domain/core'
import { Unauthorized } from '../../../src/domain/erreur'
import { Jeune } from '../../../src/domain/jeune'
import { Milo } from '../../../src/domain/milo'
import { DateService } from '../../../src/utils/date-service'
import { IdService } from '../../../src/utils/id-service'
import { unUtilisateurConseiller } from '../../fixtures/authentification.fixture'
import { unConseiller } from '../../fixtures/conseiller.fixture'
import { createSandbox, expect, StubbedClass, stubClass } from '../../utils'
import { unConseillerDuJeune, unJeune } from '../../fixtures/jeune.fixture'
import { Authentification } from '../../../src/domain/authentification'

describe('CreerJeuneMiloCommandHandler', () => {
  let creerJeuneMiloCommandHandler: CreerJeuneMiloCommandHandler
  const conseiller = unConseiller()
  const idNouveauJeune = 'DFKAL'
  const date = DateTime.fromISO('2020-04-06T12:00:00.000Z').toUTC()
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
    dateService.nowJs.returns(date.toJSDate())
    conseillerRepository.get.withArgs('idConseiller').resolves(conseiller)
    creerJeuneMiloCommandHandler = new CreerJeuneMiloCommandHandler(
      idService,
      dateService,
      conseillerAuthorizer,
      miloRepository,
      jeuneRepository,
      authentificationRepository,
      conseillerRepository,
      chatRepository
    )
  })

  describe('handle', () => {
    describe('quand il existe déjà un jeune avec cet email', () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idDossier: 'idDossier',
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
          idDossier: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        jeuneRepository.getByIdDossier
          .withArgs(command.idDossier)
          .resolves(unJeune())

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(result).to.deep.equal(
          failure(new DossierExisteDejaError(command.idDossier))
        )
      })
    })
    describe("quand il n'existe pas dans Milo", () => {
      it('crée un jeune et initialise le chat si besoin', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idDossier: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller'
        }
        miloRepository.creerJeune
          .withArgs(command.idDossier)
          .resolves(success({ idAuthentification: 'mon-sub' }))

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(
          authentificationRepository.saveJeune
        ).to.have.been.calledWithExactly(
          {
            id: idNouveauJeune,
            idAuthentification: 'mon-sub',
            prenom: command.prenom,
            nom: command.nom,
            structure: Core.Structure.MILO,
            type: Authentification.Type.JEUNE,
            email: command.email,
            roles: []
          },
          unConseillerDuJeune().id,
          command.idDossier,
          date.toJSDate()
        )
        expect(
          chatRepository.initializeChatIfNotExists
        ).to.have.been.calledWith(idNouveauJeune, conseiller.id)
        expect(result).to.deep.equal(success({ id: idNouveauJeune }))
      })

      it("minusculise l'email", async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idDossier: 'idDossier',
          nom: 'nom',
          prenom: 'prenom',
          email: 'Jeune.Nom@Email.Com',
          idConseiller: 'idConseiller'
        }
        miloRepository.creerJeune
          .withArgs(command.idDossier)
          .resolves(success({ idAuthentification: 'mon-sub' }))

        // When
        await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(
          authentificationRepository.saveJeune
        ).to.have.been.calledWithExactly(
          {
            id: idNouveauJeune,
            idAuthentification: 'mon-sub',
            prenom: command.prenom,
            nom: command.nom,
            structure: Core.Structure.MILO,
            type: Authentification.Type.JEUNE,
            email: 'jeune.nom@email.com',
            roles: []
          },
          unConseillerDuJeune().id,
          command.idDossier,
          date.toJSDate()
        )
      })
    })

    describe('quand il existe dans Milo mais pas dans Pass Emploi', () => {
      it('renvoie une erreur', async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idDossier: 'idDossier',
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
  })

  describe('authorize', () => {
    it('authorise un conseiller milo', async () => {
      // Given
      const command: CreerJeuneMiloCommand = {
        idDossier: 'idDossier',
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
        idDossier: 'idDossier',
        nom: 'nom',
        prenom: 'prenom',
        email: 'email',
        idConseiller: 'idConseiller'
      }

      const utilisateur = unUtilisateurConseiller({
        structure: Core.Structure.POLE_EMPLOI
      })

      // When
      const call = creerJeuneMiloCommandHandler.authorize(command, utilisateur)

      // Then
      await expect(call).to.be.rejectedWith(Unauthorized)
    })
  })
})

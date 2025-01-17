import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { DateTime } from 'luxon'
import { SinonSandbox } from 'sinon'
import { ConseillerAuthorizer } from '../../../../src/application/authorizers/conseiller-authorizer'

import {
  CreerJeuneMiloCommand,
  CreerJeuneMiloCommandHandler
} from '../../../../src/application/commands/milo/creer-jeune-milo.command.handler'
import {
  DossierExisteDejaError,
  EmailExisteDejaError,
  ErreurHttp,
  MauvaiseCommandeError,
  NonTrouveError
} from '../../../../src/building-blocks/types/domain-error'
import {
  failure,
  isSuccess,
  success
} from '../../../../src/building-blocks/types/result'
import { Authentification } from '../../../../src/domain/authentification'
import { Chat } from '../../../../src/domain/chat'
import { Conseiller } from '../../../../src/domain/milo/conseiller'
import { Core, estMilo } from '../../../../src/domain/core'
import { Jeune } from '../../../../src/domain/jeune/jeune'
import { JeuneMilo } from '../../../../src/domain/milo/jeune.milo'
import { DateService } from '../../../../src/utils/date-service'
import { IdService } from '../../../../src/utils/id-service'
import { unUtilisateurConseiller } from '../../../fixtures/authentification.fixture'
import { unConseiller } from '../../../fixtures/conseiller.fixture'
import { unJeune } from '../../../fixtures/jeune.fixture'
import { StubbedClass, createSandbox, expect, stubClass } from '../../../utils'
import { unDossierMilo } from '../../../fixtures/milo.fixture'
const idPartenaire = 'idDossier'

describe('CreerJeuneMiloCommandHandler', () => {
  let creerJeuneMiloCommandHandler: CreerJeuneMiloCommandHandler
  const conseiller = unConseiller()
  const idNouveauJeune = 'DFKAL'
  const date = DateTime.fromISO('2020-04-06T12:00:00.000Z')
  let miloRepository: StubbedType<JeuneMilo.Repository>
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
    miloRepository.getByIdDossier
      .withArgs(idPartenaire)
      .resolves(failure(new NonTrouveError('Dossier Milo', idPartenaire)))
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
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.PACEA
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
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.PACEA
        }
        miloRepository.getByIdDossier
          .withArgs(command.idPartenaire)
          .resolves(success(unJeune()))

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
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.PACEA
        }
        miloRepository.creerJeune
          .withArgs(command.idPartenaire)
          .resolves(success({ idAuthentification: 'mon-sub' }))
        const dossier = unDossierMilo()
        miloRepository.getDossier.resolves(success(dossier))

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        const expectedJeune: Jeune = {
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
          preferences: {
            partageFavoris: true,
            alertesOffres: true,
            messages: true,
            creationActionConseiller: true,
            rendezVousSessions: true,
            rappelActions: true
          },
          idPartenaire,
          configuration: {
            idJeune: 'DFKAL'
          },
          dispositif: Jeune.Dispositif.PACEA
        }
        expect(jeuneRepository.save).to.have.been.calledWithExactly(
          expectedJeune
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
        expect(result).to.deep.equal(
          success({ id: 'DFKAL', prenom: 'prenom', nom: 'nom' })
        )
        expect(miloRepository.getDossier).to.have.been.calledOnceWithExactly(
          idPartenaire
        )
        expect(miloRepository.save).to.have.been.calledOnceWithExactly(
          expectedJeune,
          dossier.codeStructure
        )
      })

      it("minusculise l'email", async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'Jeune.Nom@Email.Com',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.CEJ
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
          preferences: {
            partageFavoris: true,
            alertesOffres: true,
            messages: true,
            creationActionConseiller: true,
            rendezVousSessions: true,
            rappelActions: true
          },
          idPartenaire,
          configuration: {
            idJeune: 'DFKAL'
          },
          dispositif: Jeune.Dispositif.CEJ
        }
        expect(jeuneRepository.save).to.have.been.calledWithExactly(expected)
      })
    })

    describe('quand il existe déjà chez Milo', () => {
      it("renvoie un succès quand il n'existe pas chez nous", async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.PACEA
        }
        miloRepository.creerJeune
          .withArgs(command.idPartenaire)
          .resolves(success({ idAuthentification: 'mon-sub' }))

        // When
        const result = await creerJeuneMiloCommandHandler.handle(command)

        // Then
        expect(isSuccess(result)).to.be.true()
      })
      it("renvoie une erreur quand il n'existe pas chez nous", async () => {
        // Given
        const command: CreerJeuneMiloCommand = {
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.PACEA
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
          idPartenaire,
          nom: 'nom',
          prenom: 'prenom',
          email: 'email',
          idConseiller: 'idConseiller',
          dispositif: Jeune.Dispositif.CEJ
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
        idPartenaire,
        nom: 'nom',
        prenom: 'prenom',
        email: 'email',
        idConseiller: 'idConseiller',
        dispositif: Jeune.Dispositif.CEJ
      }

      const utilisateur = unUtilisateurConseiller()

      // When
      await creerJeuneMiloCommandHandler.authorize(command, utilisateur)

      // Then

      expect(
        conseillerAuthorizer.autoriserLeConseiller
      ).to.have.been.calledWithExactly(
        command.idConseiller,
        utilisateur,
        estMilo(utilisateur.structure)
      )
    })
  })
})

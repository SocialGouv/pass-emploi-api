import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { expect } from 'chai'
import { createSandbox } from 'sinon'
import { ErreurHttp } from '../../../src/building-blocks/types/domain-error'
import { failure, success } from '../../../src/building-blocks/types/result'
import { Conseiller } from '../../../src/domain/conseiller/conseiller'
import { Core } from '../../../src/domain/core'
import { KeycloakClient } from '../../../src/infrastructure/clients/keycloak-client'
import { MiloClient } from '../../../src/infrastructure/clients/milo-client'
import { ConseillerSqlModel } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { StructureMiloSqlModel } from '../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { DateService } from '../../../src/utils/date-service'
import { uneDatetime } from '../../fixtures/date.fixture'
import { uneStructureConseillerMiloDto } from '../../fixtures/milo-dto.fixture'
import { unConseillerDto } from '../../fixtures/sql-models/conseiller.sql-model'
import { StubbedClass, stubClass } from '../../utils'
import { getDatabase } from '../../utils/database-for-testing'

const maintenant = uneDatetime()

describe('Conseiller.Milo', () => {
  describe('Service', () => {
    let conseillerMiloService: Conseiller.Milo.Service
    let conseillerMiloRepository: StubbedType<Conseiller.Milo.Repository>
    let miloClient: StubbedClass<MiloClient>
    let keycloakClient: StubbedClass<KeycloakClient>
    let dateService: StubbedClass<DateService>

    beforeEach(() => {
      const sandbox = createSandbox()
      conseillerMiloRepository = stubInterface(sandbox)
      miloClient = stubClass(MiloClient)
      keycloakClient = stubClass(KeycloakClient)
      dateService = stubClass(DateService)
      dateService.now.returns(maintenant)
      conseillerMiloService = new Conseiller.Milo.Service(
        conseillerMiloRepository,
        miloClient,
        keycloakClient,
        dateService
      )
    })

    describe('recupererEtMettreAJourStructure', () => {
      const idConseiller = 'connu'
      const token = 'tok'
      const idpToken = 'idpTok'
      beforeEach(async () => {
        await getDatabase().cleanPG()
      })

      it("ne met pas à jour quand le conseiller Milo n'existe pas", async () => {
        // Given
        const idConseillerInconnu = 'inconnu'

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseillerInconnu,
          token
        )

        // Then
        expect(conseillerMiloRepository.save).not.have.been.called()
      })
      it('ne met pas à jour quand la récupération de la structure Milo échoue', async () => {
        // Given
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO
          })
        )
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
      it('ne met à jour quand dates connexion et verification invalides', async () => {
        // Given
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo,
            dateDerniereConnexion: maintenant.minus({ minutes: 1 }).toJSDate(),
            dateVerificationStructureMilo: maintenant.toJSDate()
          })
        )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(conseillerMiloRepository.save).not.to.have.been.called()
      })
      it('met à jour date vérification quand la structure Milo est inchangée', async () => {
        // Given
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo
          })
        )

        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(uneStructureConseillerMiloDto({ code: idStructureMilo }))
          )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloRepository.save
        ).to.have.been.calledOnceWithExactly({
          id: idConseiller,
          idStructure: idStructureMilo,
          dateVerificationStructureMilo: maintenant
        })
      })
      it('met à jour la structure Milo quand elle existe dans le referentiel', async () => {
        // Given
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo
          })
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
              uneStructureConseillerMiloDto({ code: idNouvelleStructure })
            )
          )
        conseillerMiloRepository.structureExiste
          .withArgs(idNouvelleStructure)
          .resolves(true)

        const conseillerMiloAvecStructure = {
          id: idConseiller,
          idStructure: idNouvelleStructure,
          dateVerificationStructureMilo: maintenant
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
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo
          })
        )
        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)

        const idNouvelleStructure = '11'
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(
              uneStructureConseillerMiloDto({ code: idNouvelleStructure })
            )
          )
        conseillerMiloRepository.structureExiste
          .withArgs(idNouvelleStructure)
          .resolves(false)

        const conseillerMiloAvecStructure = {
          id: idConseiller,
          idStructure: null,
          dateVerificationStructureMilo: maintenant
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
      it('met à jour date quand date connexion valide et verification invalide', async () => {
        // Given
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo,
            dateDerniereConnexion: maintenant.toJSDate(),
            dateVerificationStructureMilo: maintenant.toJSDate()
          })
        )

        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(uneStructureConseillerMiloDto({ code: idStructureMilo }))
          )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloRepository.save
        ).to.have.been.calledOnceWithExactly({
          id: idConseiller,
          idStructure: idStructureMilo,
          dateVerificationStructureMilo: maintenant
        })
      })
      it('met à jour date quand date connexion invalide et verification valide', async () => {
        // Given
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo,
            dateDerniereConnexion: maintenant.minus({ minutes: 1 }).toJSDate(),
            dateVerificationStructureMilo: maintenant
              .minus({ hours: 25 })
              .toJSDate()
          })
        )

        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(uneStructureConseillerMiloDto({ code: idStructureMilo }))
          )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloRepository.save
        ).to.have.been.calledOnceWithExactly({
          id: idConseiller,
          idStructure: idStructureMilo,
          dateVerificationStructureMilo: maintenant
        })
      })
      it('met à jour date quand date connexion valide et verification invalide', async () => {
        // Given
        const idStructureMilo = '10'
        await StructureMiloSqlModel.create({
          id: idStructureMilo,
          nomOfficiel: 'test',
          timezone: 'Europe/Paris'
        })
        await ConseillerSqlModel.create(
          unConseillerDto({
            id: idConseiller,
            structure: Core.Structure.MILO,
            idStructureMilo,
            dateDerniereConnexion: maintenant.toJSDate(),
            dateVerificationStructureMilo: maintenant
              .minus({ hours: 25 })
              .toJSDate()
          })
        )

        keycloakClient.exchangeTokenConseillerMilo
          .withArgs(token)
          .resolves(idpToken)
        miloClient.getStructureConseiller
          .withArgs(idpToken)
          .resolves(
            success(uneStructureConseillerMiloDto({ code: idStructureMilo }))
          )

        // When
        await conseillerMiloService.recupererEtMettreAJourStructure(
          idConseiller,
          token
        )

        // Then
        expect(
          conseillerMiloRepository.save
        ).to.have.been.calledOnceWithExactly({
          id: idConseiller,
          idStructure: idStructureMilo,
          dateVerificationStructureMilo: maintenant
        })
      })
    })
  })
})
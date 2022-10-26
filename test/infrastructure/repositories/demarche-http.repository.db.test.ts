import { DateTime } from 'luxon'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess, success } from 'src/building-blocks/types/result'
import { Demarche } from 'src/domain/demarche'
import { KeycloakClient } from 'src/infrastructure/clients/keycloak-client'
import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client'
import { DemarcheHttpRepositoryDb } from 'src/infrastructure/repositories/demarche-http.repository.db'
import { uneDemarcheDto } from 'test/fixtures/demarches-dto.fixtures'
import { DateService } from '../../../src/utils/date-service'
import { expect, StubbedClass, stubClass } from '../../utils'
import { DatabaseForTesting } from '../../utils/database-for-testing'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('DemarcheHttpRepository', () => {
  DatabaseForTesting.prepare()
  let demarcheHttpRepository: DemarcheHttpRepositoryDb
  let keycloakClient: StubbedClass<KeycloakClient>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    dateService.nowJs.returns(maintenant.toJSDate())
    keycloakClient = stubClass(KeycloakClient)
    keycloakClient.exchangeTokenPoleEmploiJeune.resolves('token')
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)

    demarcheHttpRepository = new DemarcheHttpRepositoryDb(
      keycloakClient,
      poleEmploiPartenaireClient,
      dateService
    )
  })

  describe('update', () => {
    describe('quand tout va bien', () => {
      it('met à jour le statut et renvoie la demarche', async () => {
        // Given
        const demarche: Demarche.Modifiee = {
          id: 'test',
          statut: Demarche.Statut.A_FAIRE,
          dateModification: uneDatetime(),
          dateDebut: uneDatetime(),
          dateFin: uneDatetime()
        }

        const demarcheDto = uneDemarcheDto({
          dateCreation: uneDatetime().toISO(),
          dateModification: uneDatetime().toISO(),
          dateDebut: uneDatetime().toISO(),
          dateFin: uneDatetime().toISO()
        })

        poleEmploiPartenaireClient.updateDemarche
          .withArgs(demarche, 'token')
          .resolves(success(demarcheDto))

        // When
        const result = await demarcheHttpRepository.update(demarche, 'token')

        // Then
        expect(isSuccess(result) && result.data).to.deep.equal({
          attributs: [],
          codeDemarche: 'eyJxdW9pIjoiUTIwIiwicG91cnF1b2kiOiJQMTgifQ==',
          dateDebut: uneDatetime(),
          dateFin: uneDatetime(),
          dateModification: uneDatetime(),
          dateCreation: uneDatetime(),
          contenu: undefined,
          creeeParConseiller: false,
          dateAnnulation: undefined,
          id: 'id-demarche',
          label: 'pourquoi',
          modifieParConseiller: false,
          sousTitre: undefined,
          statut: 'A_FAIRE',
          statutsPossibles: ['ANNULEE', 'REALISEE'],
          titre: 'quoi'
        })
      })
    })
    describe('quand une erreur se produit', () => {
      it('renvoie une failure', async () => {
        // Given
        const demarche: Demarche.Modifiee = {
          id: 'test',
          statut: Demarche.Statut.A_FAIRE,
          dateModification: uneDatetime(),
          dateDebut: uneDatetime(),
          dateFin: uneDatetime()
        }

        poleEmploiPartenaireClient.updateDemarche
          .withArgs(demarche, 'token')
          .resolves(failure(new ErreurHttp('test', 404)))

        // When
        const result = await demarcheHttpRepository.update(demarche, 'token')

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('test', 404)))
      })
    })
  })

  describe('save', () => {
    describe('quand tout va bien', () => {
      it('sauvegarde et renvoie la demarche', async () => {
        // Given
        const demarche: Demarche.Creee = {
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: uneDatetime(),
          dateFin: uneDatetime(),
          pourquoi: 'string',
          quoi: 'string'
        }

        const demarcheDto = uneDemarcheDto({
          dateCreation: uneDatetime().toISO(),
          dateFin: uneDatetime().toISO(),
          dateModification: uneDatetime().toISO(),
          pourQuoi: 'string',
          quoi: 'string'
        })

        poleEmploiPartenaireClient.createDemarche
          .withArgs(demarche, 'token')
          .resolves(success(demarcheDto))

        // When
        const result = await demarcheHttpRepository.save(demarche, 'token')

        // Then
        expect(isSuccess(result) && result.data).to.deep.equal({
          attributs: [],
          codeDemarche: 'eyJxdW9pIjoic3RyaW5nIiwicG91cnF1b2kiOiJzdHJpbmcifQ==',
          contenu: undefined,
          creeeParConseiller: false,
          dateDebut: undefined,
          dateFin: uneDatetime(),
          dateModification: uneDatetime(),
          dateCreation: uneDatetime(),
          dateAnnulation: undefined,
          id: 'id-demarche',
          label: 'pourquoi',
          modifieParConseiller: false,
          sousTitre: undefined,
          statut: 'A_FAIRE',
          statutsPossibles: ['ANNULEE', 'REALISEE'],
          titre: 'quoi'
        })
      })
    })
    describe('quand une erreur se produit', () => {
      it('renvoie une failure', async () => {
        // Given
        const demarche: Demarche.Creee = {
          statut: Demarche.Statut.A_FAIRE,
          dateCreation: uneDatetime(),
          dateFin: uneDatetime(),
          pourquoi: 'string',
          quoi: 'string'
        }

        poleEmploiPartenaireClient.createDemarche
          .withArgs(demarche, 'token')
          .resolves(failure(new ErreurHttp('test', 404)))

        // When
        const result = await demarcheHttpRepository.save(demarche, 'token')

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('test', 404)))
      })
    })
  })
})

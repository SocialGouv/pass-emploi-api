import { DateTime } from 'luxon'
import { ErreurHttp } from 'src/building-blocks/types/domain-error'
import { failure, isSuccess, success } from 'src/building-blocks/types/result'
import { Demarche } from 'src/domain/demarche'
import { OidcClient } from 'src/infrastructure/clients/oidc-client.db'
import { PoleEmploiPartenaireClient } from 'src/infrastructure/clients/pole-emploi-partenaire-client.db'
import { DemarcheHttpRepository } from 'src/infrastructure/repositories/demarche-http.repository'
import { uneDemarcheDto } from 'test/fixtures/demarches-dto.fixtures'
import { Core } from '../../../src/domain/core'
import { DateService } from '../../../src/utils/date-service'
import { expect, StubbedClass, stubClass } from '../../utils'
import { uneDatetime } from '../../fixtures/date.fixture'

describe('DemarcheHttpRepository', () => {
  let demarcheRepository: Demarche.Repository
  let oidcClient: StubbedClass<OidcClient>
  let poleEmploiPartenaireClient: StubbedClass<PoleEmploiPartenaireClient>
  const maintenant = DateTime.fromISO('2020-04-06T12:00:00.000Z')

  beforeEach(async () => {
    const dateService = stubClass(DateService)
    dateService.now.returns(maintenant)
    dateService.nowJs.returns(maintenant.toJSDate())
    oidcClient = stubClass(OidcClient)
    oidcClient.exchangeTokenJeune.resolves('token')
    poleEmploiPartenaireClient = stubClass(PoleEmploiPartenaireClient)

    demarcheRepository = new DemarcheHttpRepository(
      oidcClient,
      poleEmploiPartenaireClient,
      dateService
    )
  })

  describe('update', () => {
    describe('quand tout va bien', () => {
      it('met à jour le statut et renvoie la demarche PE', async () => {
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
        const result = await demarcheRepository.update(
          demarche,
          'token',
          Core.Structure.POLE_EMPLOI
        )

        // Then
        expect(oidcClient.exchangeTokenJeune).to.have.been.calledWith(
          'token',
          Core.Structure.POLE_EMPLOI
        )
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
      it('met à jour le statut et renvoie la demarche BRSA', async () => {
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
        const result = await demarcheRepository.update(
          demarche,
          'token',
          Core.Structure.POLE_EMPLOI_BRSA
        )

        // Then
        expect(oidcClient.exchangeTokenJeune).to.have.been.calledWith(
          'token',
          Core.Structure.POLE_EMPLOI_BRSA
        )
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
        const result = await demarcheRepository.update(
          demarche,
          'token',
          Core.Structure.POLE_EMPLOI
        )

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('test', 404)))
      })
    })
  })

  describe('save', () => {
    describe('quand tout va bien', () => {
      it('sauvegarde et renvoie la demarche PE', async () => {
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
        const result = await demarcheRepository.save(
          demarche,
          'token',
          Core.Structure.POLE_EMPLOI
        )

        // Then
        expect(oidcClient.exchangeTokenJeune).to.have.been.calledWith(
          'token',
          Core.Structure.POLE_EMPLOI
        )
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
      it('sauvegarde et renvoie la demarche BRSA', async () => {
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
        const result = await demarcheRepository.save(
          demarche,
          'token',
          Core.Structure.POLE_EMPLOI_BRSA
        )

        // Then
        expect(oidcClient.exchangeTokenJeune).to.have.been.calledWith(
          'token',
          Core.Structure.POLE_EMPLOI_BRSA
        )
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
        const result = await demarcheRepository.save(
          demarche,
          'token',
          Core.Structure.POLE_EMPLOI
        )

        // Then
        expect(result).to.deep.equal(failure(new ErreurHttp('test', 404)))
      })
    })
  })
})

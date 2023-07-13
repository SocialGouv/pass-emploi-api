import { DateTime } from 'luxon'
import { Success, success } from '../../../../src/building-blocks/types/result'
import { SessionMilo } from '../../../../src/domain/milo/session.milo'
import { MiloClient } from '../../../../src/infrastructure/clients/milo-client'
import { SessionMiloHttpSqlRepository } from '../../../../src/infrastructure/repositories/milo/session-milo-http-sql.repository.db'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { JeuneSqlModel } from '../../../../src/infrastructure/sequelize/models/jeune.sql-model'
import { SessionMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/session-milo.sql-model'
import { StructureMiloSqlModel } from '../../../../src/infrastructure/sequelize/models/structure-milo.sql-model'
import { uneDatetime } from '../../../fixtures/date.fixture'
import {
  unDetailSessionConseillerDto,
  uneInscriptionSessionMiloDto
} from '../../../fixtures/milo-dto.fixture'
import { uneSessionMilo } from '../../../fixtures/sessions.fixture'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { unJeuneDto } from '../../../fixtures/sql-models/jeune.sql-model'
import { expect, StubbedClass, stubClass } from '../../../utils'
import { getDatabase } from '../../../utils/database-for-testing'

describe('SessionMiloSqlRepository', () => {
  let miloClient: StubbedClass<MiloClient>
  let sessionMiloSqlRepository: SessionMiloHttpSqlRepository

  beforeEach(async () => {
    await getDatabase().cleanPG()

    miloClient = stubClass(MiloClient)
    sessionMiloSqlRepository = new SessionMiloHttpSqlRepository(miloClient)
  })

  describe('.getForConseiller', () => {
    const idSession = 'idSession'
    const structureConseiller = {
      id: 'structure-milo',
      timezone: 'America/Cayenne'
    }
    const tokenMilo = 'token-milo'

    beforeEach(async () => {
      // Given
      miloClient.getDetailSessionConseiller.resolves(
        success(unDetailSessionConseillerDto)
      )
      miloClient.getListeInscritsSession.resolves(
        success([
          uneInscriptionSessionMiloDto({
            idDossier: 12345,
            statut: 'ONGOING'
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 12345,
            statut: 'REFUSAL'
          }),
          uneInscriptionSessionMiloDto({
            idDossier: 12345,
            statut: 'REFUSAL_YOUNG'
          }),
          uneInscriptionSessionMiloDto({ idDossier: 67890 })
        ])
      )

      await StructureMiloSqlModel.create({
        ...structureConseiller,
        nomOfficiel: 'Structure Milo'
      })
      await ConseillerSqlModel.create(unConseillerDto())
      await JeuneSqlModel.create(
        unJeuneDto({ id: 'id-jeune', idPartenaire: '12345' })
      )
    })

    it('récupère les informations nécessaires', async () => {
      // When
      await sessionMiloSqlRepository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      expect(
        miloClient.getDetailSessionConseiller
      ).to.have.been.calledOnceWithExactly(tokenMilo, idSession)
      expect(
        miloClient.getListeInscritsSession
      ).to.have.been.calledOnceWithExactly(tokenMilo, idSession)
    })

    it('reconstruit la session avec les inscrits et les dates dans la timezone du conseiller', async () => {
      // When
      const actual = await sessionMiloSqlRepository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      expect(actual).to.deep.equal(success(uneSessionMilo()))
    })

    it('récupère la visibilité si elle a été modifiée', async () => {
      // Given
      const now = DateTime.now()
      await SessionMiloSqlModel.create({
        id: idSession,
        estVisible: true,
        idStructureMilo: structureConseiller.id,
        dateModification: now.toJSDate()
      })

      // When
      const actual = await sessionMiloSqlRepository.getForConseiller(
        idSession,
        structureConseiller,
        tokenMilo
      )

      // Then
      const actualSession = (actual as Success<SessionMilo>).data
      expect(actualSession.estVisible).to.be.true()
      expect(actualSession.dateModification).to.deep.equal(now)
    })
  })

  describe('.save', () => {
    it('met à jour la structure Milo du conseiller', async () => {
      // Given
      const idStructure = '1'
      const idSession = '1'
      await StructureMiloSqlModel.create({
        id: idStructure,
        nomOfficiel: 'Structure',
        timezone: 'Europe/Paris'
      })

      // When
      await sessionMiloSqlRepository.save({
        id: idSession,
        idStructureMilo: idStructure,
        estVisible: true,
        dateModification: uneDatetime()
      })

      // Then
      const sessionTrouve = await SessionMiloSqlModel.findByPk(idSession)
      expect(sessionTrouve?.idStructureMilo).to.equal('1')
    })
  })
})

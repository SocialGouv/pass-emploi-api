import { DatabaseForTesting } from '../../../utils/database-for-testing'
import { HandleJobAgenceAnimationCollectiveCommandHandler } from '../../../../src/application/commands/jobs/handle-job-agence-animation-collective.command.db'
import { AgenceSqlModel } from '../../../../src/infrastructure/sequelize/models/agence.sql-model'
import { uneAgenceMiloDTO } from '../../../fixtures/sql-models/agence.sql-model'
import { unConseillerDto } from '../../../fixtures/sql-models/conseiller.sql-model'
import { ConseillerSqlModel } from '../../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import {
  RendezVousDto,
  RendezVousSqlModel
} from '../../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { unRendezVousDto } from '../../../fixtures/sql-models/rendez-vous.sql-model'
import { expect } from '../../../utils'
import { CodeTypeRendezVous } from '../../../../src/domain/rendez-vous/rendez-vous'
import { AsSql } from '../../../../src/infrastructure/sequelize/types'
import { DateService } from '../../../../src/utils/date-service'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import { createSandbox } from 'sinon'
import { SuiviJob } from '../../../../src/domain/suivi-job'

describe('HandleJobAgenceAnimationCollectiveCommand', () => {
  const database = DatabaseForTesting.prepare()
  let command: HandleJobAgenceAnimationCollectiveCommandHandler

  let atelierAvecAgence: AsSql<RendezVousDto>
  let atelierAvecAgenceARemplir: AsSql<RendezVousDto>
  let atelierSansAgenceARemplir: AsSql<RendezVousDto>
  let rendezVousIndividuel: AsSql<RendezVousDto>
  const agenceNantes = uneAgenceMiloDTO({ id: '1', nomAgence: 'Nantes' })

  beforeEach(async () => {
    const notificationSupportService: StubbedType<SuiviJob.Service> =
      stubInterface(createSandbox())
    command = new HandleJobAgenceAnimationCollectiveCommandHandler(
      database.sequelize,
      new DateService(),
      notificationSupportService
    )

    // Given
    await AgenceSqlModel.bulkCreate([agenceNantes])

    const conseillerNantais = unConseillerDto({
      id: '1',
      idAgence: agenceNantes.id
    })
    const conseillerSansAgence = unConseillerDto({
      id: '2',
      idAgence: undefined
    })
    await ConseillerSqlModel.bulkCreate([
      conseillerNantais,
      conseillerSansAgence
    ])

    atelierAvecAgence = unRendezVousDto({
      idAgence: agenceNantes.id,
      type: CodeTypeRendezVous.ATELIER,
      createur: {
        id: conseillerNantais.id,
        nom: conseillerNantais.nom,
        prenom: conseillerNantais.prenom
      }
    })

    atelierAvecAgenceARemplir = unRendezVousDto({
      idAgence: null,
      type: CodeTypeRendezVous.ATELIER,
      createur: {
        id: conseillerNantais.id,
        nom: conseillerNantais.nom,
        prenom: conseillerNantais.prenom
      }
    })

    atelierSansAgenceARemplir = unRendezVousDto({
      idAgence: null,
      type: CodeTypeRendezVous.ATELIER,
      createur: {
        id: conseillerSansAgence.id,
        nom: conseillerSansAgence.nom,
        prenom: conseillerSansAgence.prenom
      }
    })

    rendezVousIndividuel = unRendezVousDto({
      idAgence: null,
      type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
      createur: {
        id: conseillerNantais.id,
        nom: conseillerNantais.nom,
        prenom: conseillerNantais.prenom
      }
    })

    await RendezVousSqlModel.bulkCreate([
      atelierSansAgenceARemplir,
      atelierAvecAgenceARemplir,
      atelierAvecAgence,
      rendezVousIndividuel
    ])

    // When
    await command.handle()
  })

  it('ne met pas à jour les AC qui ont une agence', async () => {
    // Then
    const atelierAvecAgenceSql = await RendezVousSqlModel.findByPk(
      atelierAvecAgence.id
    )
    expect(atelierAvecAgenceSql?.get()).to.deep.equal(atelierAvecAgence)
  })

  it("ne met pas à jour l'agence quand le conseiller n'a pas d'agence", async () => {
    const atelierSansAgenceARemplirSql = await RendezVousSqlModel.findByPk(
      atelierSansAgenceARemplir.id
    )
    expect(atelierSansAgenceARemplirSql?.get()).to.deep.equal(
      atelierSansAgenceARemplir
    )
  })

  it("met à jour l'agence quand le conseiller a une agence", async () => {
    const atelierAvecAgenceARemplirSql = await RendezVousSqlModel.findByPk(
      atelierAvecAgenceARemplir.id
    )
    expect(atelierAvecAgenceARemplirSql?.get()).to.deep.equal({
      ...atelierAvecAgenceARemplir,
      idAgence: agenceNantes.id
    })
  })

  it('ne change pas les rendez vous', async () => {
    const rendezVousIndividuelSql = await RendezVousSqlModel.findByPk(
      rendezVousIndividuel.id
    )
    expect(rendezVousIndividuelSql?.get()).to.deep.equal(rendezVousIndividuel)
  })
})

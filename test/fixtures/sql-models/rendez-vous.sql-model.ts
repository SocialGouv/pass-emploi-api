import { RendezVousDto } from '../../../src/infrastructure/sequelize/models/rendez-vous.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { IdService } from '../../../src/utils/id-service'

const idService = new IdService()

export function unRendezVousDto(
  args: Partial<AsSql<RendezVousDto>> = {}
): AsSql<RendezVousDto> {
  const defaults: AsSql<RendezVousDto> = {
    id: idService.uuid(),
    titre: 'rdv',
    duree: 30,
    modalite: 'modalite',
    date: new Date('2021-11-11T08:03:30.000Z'),
    idJeune: '1',
    commentaire: 'commentaire',
    sousTitre: 'sous titre',
    idConseiller: '1',
    dateSuppression: null
  }

  return { ...defaults, ...args }
}

import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { ListeDeDiffusionDto } from '../../../src/infrastructure/sequelize/models/liste-de-diffusion.sql-model'
import { uneDatetime } from '../date.fixture'
import { unConseiller } from '../conseiller.fixture'
import { ListeDeDiffusionJeuneAssociationSqlModel } from '../../../src/infrastructure/sequelize/models/liste-de-diffusion-jeune-association.sql-model'
import { unJeune } from '../jeune.fixture'
import { IdService } from '../../../src/utils/id-service'

const idService = new IdService()

export const uneListeDeDiffusionDto = (
  args?: Partial<ListeDeDiffusionDto>
): AsSql<ListeDeDiffusionDto> => {
  const defaults: AsSql<ListeDeDiffusionDto> = {
    id: idService.uuid(),
    titre: 'Liste de diffusion',
    dateDeCreation: uneDatetime().toJSDate(),
    idConseiller: unConseiller().id
  }
  return { ...defaults, ...args }
}

export const uneListeDeDiffusionAssociationDto = (
  args?: Partial<Omit<AsSql<ListeDeDiffusionJeuneAssociationSqlModel>, 'id'>>
): Omit<AsSql<ListeDeDiffusionJeuneAssociationSqlModel>, 'id'> => {
  const defaults: Omit<
    AsSql<ListeDeDiffusionJeuneAssociationSqlModel>,
    'id'
  > = {
    idListe: '921bdc43-692a-4a6d-b32b-8baf0d7b494e',
    idBeneficiaire: unJeune().id,
    dateAjout: uneDatetime().toJSDate()
  }
  return { ...defaults, ...args }
}

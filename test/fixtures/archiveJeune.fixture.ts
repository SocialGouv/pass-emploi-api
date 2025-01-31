import { Jeune } from '../../src/domain/jeune/jeune'
import { ArchiveJeune } from '../../src/domain/archive-jeune'
import { uneDate } from './date.fixture'
import { Core } from '../../src/domain/core'
import Structure = Core.Structure
import { DateTime } from 'luxon'

export const uneArchiveJeuneMetadonnees = (
  args: Partial<ArchiveJeune.Metadonnees> = {}
): ArchiveJeune.Metadonnees => {
  const defaults: ArchiveJeune.Metadonnees = {
    idJeune: '1',
    motif: ArchiveJeune.MotifSuppression.CONTRAT_ARRIVE_A_ECHEANCE,
    commentaire: 'Il a loupé un rdv',
    nomJeune: 'test',
    prenomJeune: 'test',
    structure: Structure.MILO,
    dispositif: Jeune.Dispositif.PACEA,
    dateCreation: DateTime.fromJSDate(uneDate()).minus({ month: 1 }).toJSDate(),
    dateArchivage: uneDate()
  }

  return { ...defaults, ...args }
}

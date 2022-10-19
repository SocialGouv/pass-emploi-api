import { ArchiveJeune } from '../../src/domain/archive-jeune'
import { uneDate } from './date.fixture'
import { Core } from '../../src/domain/core'
import Structure = Core.Structure

export const uneArchiveJeuneMetadonnees = (
  args: Partial<ArchiveJeune.Metadonnees> = {}
): ArchiveJeune.Metadonnees => {
  const defaults: ArchiveJeune.Metadonnees = {
    idJeune: '1',
    motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ,
    commentaire: 'Il a loupé un rdv',
    nomJeune: 'test',
    prenomJeune: 'test',
    structure: Structure.MILO,
    dateArchivage: uneDate()
  }

  return { ...defaults, ...args }
}

import { ArchiveJeune } from '../../src/domain/archive-jeune'
import { uneDate } from './date.fixture'

export const uneArchiveJeuneMetadonnees = (
  args: Partial<ArchiveJeune.Metadonnees> = {}
): ArchiveJeune.Metadonnees => {
  const defaults: ArchiveJeune.Metadonnees = {
    idJeune: '1',
    motif: ArchiveJeune.MotifSuppression.RADIATION_DU_CEJ,
    commentaire: 'Il a loupé un rdv',
    nomJeune: 'test',
    prenomJeune: 'test',
    dateArchivage: uneDate()
  }

  return { ...defaults, ...args }
}

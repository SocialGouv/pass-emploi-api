import { Core } from '../../../src/domain/core'
import { ConseillerDto } from '../../../src/infrastructure/sequelize/models/conseiller.sql-model'
import { AsSql } from '../../../src/infrastructure/sequelize/types'
import { uneDatetime } from '../date.fixture'

export function unConseillerDto(
  args: Partial<AsSql<ConseillerDto>> = {}
): AsSql<ConseillerDto> {
  const defaults: AsSql<ConseillerDto> = {
    id: '1',
    prenom: 'Nils',
    nom: 'Tavernier',
    email: 'nils.tavernier@passemploi.com',
    structure: Core.Structure.MILO,
    idAuthentification: 'un-id',
    dateCreation: uneDatetime().toJSDate(),
    dateVerificationMessages: uneDatetime().toJSDate(),
    dateDerniereConnexion: null,
    dateSignatureCGU: null,
    dateVisionnageActus: null,
    dateVerificationStructureMilo: null,
    idAgence: null,
    nomManuelAgence: null,
    notificationsSonores: false,
    idStructureMilo: null,
    username: null
  }

  return { ...defaults, ...args }
}

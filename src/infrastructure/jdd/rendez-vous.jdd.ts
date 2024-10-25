import { AsSql } from '../sequelize/types'
import { RendezVousDto } from '../sequelize/models/rendez-vous.sql-model'
import {
  CodeTypeRendezVous,
  RendezVous
} from '../../domain/rendez-vous/rendez-vous'
import * as uuid from 'uuid'
import { DateTime } from 'luxon'

export function unRendezVousJDD(
  args: Partial<AsSql<RendezVousDto>> = {}
): AsSql<RendezVousDto> {
  const defaults: AsSql<RendezVousDto> = {
    id: uuid.v4(),
    source: RendezVous.Source.PASS_EMPLOI,
    titre: 'rdv',
    duree: 30,
    modalite: 'modalite',
    date: DateTime.now().plus({ day: 5 }).toJSDate(),
    commentaire: 'commentaire',
    sousTitre: 'sous titre',
    type: CodeTypeRendezVous.ENTRETIEN_INDIVIDUEL_CONSEILLER,
    precision: null,
    adresse: null,
    organisme: null,
    presenceConseiller: true,
    invitation: null,
    icsSequence: null,
    dateCloture: null,
    idAgence: null,
    createur: { id: '1', nom: 'Tavernier', prenom: 'Nils' },
    typePartenaire: null,
    idPartenaire: null,
    nombreMaxParticipants: null
  }

  return { ...defaults, ...args }
}

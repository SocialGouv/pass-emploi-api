import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { JeuneMilo } from '../../../domain/jeune/jeune.milo'
import { ArchiveJeune } from '../../../domain/archive-jeune'
import { Jeune } from '../../../domain/jeune/jeune'

import {
  RendezVousJeuneDetailQueryModel,
  RendezVousJeuneQueryModel
} from './rendez-vous.query-model'
import { RechercheQueryModel } from './recherches.query-model'
import { FavorisQueryModel } from './favoris.query-model'

class SituationQueryModel {
  @ApiProperty()
  etat: string

  @ApiProperty()
  categorie: string

  @ApiProperty({ required: false })
  dateFin?: string
}

export class JeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  lastName: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  idConseiller: string
}

export class IdentiteJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

class ConseillerDuJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

export class JeuneMiloResumeQueryModel {
  @ApiProperty()
  jeune: IdentiteJeuneQueryModel

  @ApiProperty()
  referent: ConseillerDuJeuneQueryModel

  @ApiPropertyOptional({ required: false })
  situation?: JeuneMilo.CategorieSituation

  @ApiPropertyOptional({
    format: 'date-time',
    required: false
  })
  dateDerniereActivite?: string
}

class ConseillerQueryModel {
  @ApiProperty({ required: false })
  email?: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

export class ConseillerJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty({ required: false })
  email?: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiProperty()
  depuis: string
}

export class HistoriqueConseillerJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string | undefined

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string

  @ApiProperty()
  date: string
}

export class DetailJeuneQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty({ required: false })
  email: string | undefined

  @ApiProperty()
  creationDate: string

  @ApiPropertyOptional()
  datePremiereConnexion?: string

  @ApiProperty()
  isActivated: boolean

  @ApiProperty()
  isReaffectationTemporaire: boolean

  @ApiProperty()
  conseiller: ConseillerJeuneQueryModel

  @ApiProperty({ required: false })
  situations?: SituationQueryModel[]

  @ApiProperty({ required: false })
  urlDossier?: string

  @ApiProperty({ required: false })
  idPartenaire?: string

  @ApiProperty({ required: false })
  dateFinCEJ?: string
}

class ResumeSemaineJeune {
  @ApiProperty()
  nombreRendezVous: number

  @ApiProperty()
  nombreActionsDemarchesEnRetard: number

  @ApiProperty()
  nombreActionsDemarchesARealiser: number
}

export class AccueilJeuneQueryModel {
  @ApiProperty({
    description: 'Uniquement pour PE'
  })
  dateDerniereMiseAJour: string | null

  @ApiProperty()
  cetteSemaine: ResumeSemaineJeune

  @ApiProperty()
  prochainRendezVous: RendezVousJeuneQueryModel

  @ApiProperty({
    description: 'AC et sessions uniques à Milo'
  })
  evenementsAVenir: RendezVousJeuneDetailQueryModel[] | null

  @ApiProperty()
  mesAlertes: RechercheQueryModel[]

  @ApiPropertyOptional()
  mesFavoris: FavorisQueryModel[]
}

export class DetailJeuneConseillerQueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiProperty({ required: false })
  email: string | undefined

  @ApiProperty()
  creationDate: string

  @ApiProperty()
  isActivated: boolean

  @ApiProperty()
  isReaffectationTemporaire: boolean

  @ApiProperty({ required: false })
  lastActivity?: string

  @ApiProperty({ required: false })
  conseillerPrecedent?: ConseillerQueryModel

  @ApiProperty({ required: false })
  situationCourante?: SituationQueryModel
}

export class ResumeActionsDuJeuneQueryModel {
  @ApiProperty()
  jeuneId: Jeune.Id

  @ApiProperty()
  jeuneFirstName: string

  @ApiProperty()
  jeuneLastName: string

  @ApiProperty()
  todoActionsCount: number

  @ApiProperty()
  doneActionsCount: number

  @ApiProperty()
  inProgressActionsCount: number
}

export class PreferencesJeuneQueryModel {
  @ApiProperty()
  partageFavoris: boolean
}

export class MotifSuppressionJeuneQueryModel {
  @ApiProperty()
  motif: ArchiveJeune.MotifSuppression
  @ApiProperty({ required: false })
  description?: string
}

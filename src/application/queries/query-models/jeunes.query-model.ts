import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { JeuneMilo } from '../../../domain/jeune/jeune.milo'
import { ArchiveJeune } from '../../../domain/archive-jeune'
import { Jeune } from '../../../domain/jeune/jeune'

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
}

export class JeuneV2QueryModel {
  @ApiProperty()
  id: string

  @ApiProperty()
  nom: string

  @ApiProperty()
  prenom: string
}

export class JeuneMiloResumeQueryModel {
  @ApiProperty()
  jeune: JeuneV2QueryModel

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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { JeuneMilo } from '../../../domain/milo/jeune.milo'
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

class StructureMiloDuJeuneQueryModel {
  @ApiProperty()
  id: string
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
  structureMilo?: StructureMiloDuJeuneQueryModel

  @ApiProperty({ required: false })
  urlDossier?: string

  @ApiProperty({ required: false })
  estAArchiver?: boolean

  @ApiProperty({ required: false })
  idPartenaire?: string

  @ApiProperty({ required: false })
  dateFinCEJ?: string

  @ApiProperty({ required: false })
  dateSignatureCGU?: string
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
  dateFinCEJ?: string

  @ApiProperty({ required: false })
  lastActivity?: string

  @ApiProperty({ required: false })
  conseillerPrecedent?: ConseillerQueryModel

  @ApiProperty({ required: false })
  situationCourante?: SituationQueryModel

  @ApiProperty({ required: false })
  structureMilo?: StructureMiloDuJeuneQueryModel
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
  motif: string
  @ApiProperty({ required: false })
  description?: string
}

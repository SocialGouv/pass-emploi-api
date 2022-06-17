import { ApiProperty } from '@nestjs/swagger'
import { Jeune } from 'src/domain/jeune'

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

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

  @ApiProperty({ required: false })
  lastActivity?: string

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

  @ApiProperty()
  dispositif: Jeune.Dispositif

  @ApiProperty({ required: false })
  peutVoirLeComptageDesHeures?: boolean

  @ApiProperty({ required: false })
  featuresActives?: string[]
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

  @ApiProperty()
  estAArchiver: boolean

  @ApiProperty()
  dispositif: Jeune.Dispositif
}

export class PreferencesJeuneQueryModel {
  @ApiProperty()
  partageFavoris: boolean
  @ApiProperty()
  alertesOffres: boolean
  @ApiProperty()
  messages: boolean
  @ApiProperty()
  creationActionConseiller: boolean
  @ApiProperty()
  rendezVousSessions: boolean
  @ApiProperty()
  rappelActions: boolean
}

export class MotifSuppressionJeuneQueryModel {
  @ApiProperty()
  motif: string
  @ApiProperty({ required: false })
  description?: string
}

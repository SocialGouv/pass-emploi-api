import { Body, Controller, Param, Post } from '@nestjs/common'
import {
  ApiOAuth2,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags
} from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CreateContactImmersionCommandHandler } from 'src/application/commands/immersion/create-contact-immersion.command.handler'
import { emptySuccess, isSuccess } from 'src/building-blocks/types/result'
import { Authentification } from 'src/domain/authentification'
import { Utilisateur } from '../decorators/authenticated.decorator'
import { handleFailure } from './failure.handler'

class PostContactImmersionQueryBody {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codeRome: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  labelRome: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  siret: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  prenom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contactMode: ModeContact

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message?: string
}

enum ModeContact {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  IN_PERSON = 'IN_PERSON'
}

type Offer = {
  romeCode: string
  romeLabel: string
}

export interface CreateContactImmersionCommand {
  idJeune?: string
  offer: Offer
  siret: string
  potentialBeneficiaryFirstName: string
  potentialBeneficiaryLastName: string
  potentialBeneficiaryEmail: string
  contactMode: string
  message?: string
}

@Controller('jeunes/:idJeune/immersion')
@ApiOAuth2([])
@ApiTags('Immersion')
export class ImmersionController {
  constructor(
    private readonly createContactImmersionCommandHandler: CreateContactImmersionCommandHandler
  ) {}

  @Post('contact')
  async postImmersionContactEtablissement(
    @Param('idJeune') idJeune: string,
    @Body() postContactImmersionQueryBody: PostContactImmersionQueryBody,
    @Utilisateur()
    utilisateur: Authentification.Utilisateur
  ): Promise<unknown> {
    const command: CreateContactImmersionCommand = {
      idJeune,
      offer: {
        romeCode: postContactImmersionQueryBody.codeRome,
        romeLabel: postContactImmersionQueryBody.labelRome
      },
      siret: postContactImmersionQueryBody.siret,
      potentialBeneficiaryFirstName: postContactImmersionQueryBody.prenom,
      potentialBeneficiaryLastName: postContactImmersionQueryBody.nom,
      potentialBeneficiaryEmail: postContactImmersionQueryBody.email,
      contactMode: postContactImmersionQueryBody.contactMode,
      message:
        postContactImmersionQueryBody.contactMode === ModeContact.EMAIL &&
        postContactImmersionQueryBody.message
          ? postContactImmersionQueryBody.message
          : undefined
    }
    const result = await this.createContactImmersionCommandHandler.execute(
      command,
      utilisateur
    )

    if (isSuccess(result)) {
      return emptySuccess()
    }
    throw handleFailure(result)
  }
}

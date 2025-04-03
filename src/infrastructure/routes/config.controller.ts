import { Controller, Get, Header } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '../decorators/public.decorator'

@Controller('config')
@ApiTags('Config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('')
  @Public()
  @Header('Cache-Control', 'max-age=1200')
  async getConseillersCVM(): Promise<unknown> {
    return this.configService.get('remoteConfig')
  }
}

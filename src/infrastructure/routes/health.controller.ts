import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface'
import { Public } from '../decorators/public.decorator'
import { ConfigService } from '@nestjs/config'

@Public()
@Controller()
@ApiTags('Metrics')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private configService: ConfigService
  ) {}

  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([])
  }

  @Get('version')
  @HealthCheck()
  async version(): Promise<{ version: string }> {
    return { version: this.configService.get('version')! }
  }
}

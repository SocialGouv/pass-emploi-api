import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiSecurity, ApiTags } from '@nestjs/swagger'
import { ApiKeyAuthGuard } from '../auth/api-key.auth-guard'
import { SkipOidcAuth } from '../decorators/skip-oidc-auth.decorator'
import { SynchronizeJobsCommandHandler } from '../../application/commands/synchronize-jobs.command'

@Controller()
@ApiTags('Jobs')
export class JobsController {
  constructor(
    private synchronizeJobsCommandHandler: SynchronizeJobsCommandHandler
  ) {}

  @SkipOidcAuth()
  @UseGuards(ApiKeyAuthGuard)
  @ApiSecurity('api_key')
  @Post('jobs/init')
  async init(): Promise<void> {
    this.synchronizeJobsCommandHandler.handle({})
  }
}

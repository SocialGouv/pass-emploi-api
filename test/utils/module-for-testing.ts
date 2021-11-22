import { HttpModule } from '@nestjs/axios'
import { Provider, Type } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import {
  buildModuleMetadata,
  buildQueryCommandsProviders
} from '../../src/app.module'
import configuration from '../../src/config/configuration'

export function buildTestingModuleForHttpTesting(): TestingModuleBuilder {
  const moduleMetadata = buildModuleMetadata()
  return Test.createTestingModule({
    imports: [
      HttpModule,
      ConfigModule.forRoot({
        load: [configuration]
      }),
      TerminusModule
    ],
    providers: stubProviders(),
    controllers: moduleMetadata.controllers
  })
}

const stubProviders = (): Provider[] => {
  return buildQueryCommandsProviders().map((provider: Provider): Provider => {
    return {
      provide: provider as Type,
      useClass: FakeHandler
    }
  })
}

class FakeHandler {
  execute(): Promise<unknown> {
    return Promise.resolve(undefined)
  }
}

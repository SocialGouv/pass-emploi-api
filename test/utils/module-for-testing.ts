import { HttpModule, Provider, Type } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'
import { Test, TestingModuleBuilder } from '@nestjs/testing'
import {
  AppModule,
  buildModuleMetadata,
  buildQueryCommandsProviders
} from '../../src/app.module'
import configuration from '../../src/config/configuration'
import { FirebaseClient } from '../../src/infrastructure/repositories/firebase-client'
import { FakeFirebaseClient } from '../infrastructure/repositories/fakes/fake-firebase-client'

export function buildTestingModuleForHttpTesting(): TestingModuleBuilder {
  const moduleMetadata = buildModuleMetadata()
  return Test.createTestingModule({
    imports: [
      AppModule,
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
  const fakeProviders = buildQueryCommandsProviders().map(
    (provider: Provider): Provider => {
      return {
        provide: provider as Type,
        useClass: FakeHandler
      }
    }
  )

  fakeProviders.push({
    provide: FirebaseClient,
    useClass: FakeFirebaseClient
  })
  return fakeProviders
}

class FakeHandler {
  execute(): Promise<unknown> {
    return Promise.resolve(undefined)
  }
}

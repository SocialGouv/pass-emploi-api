/* eslint-disable no-process-env */
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { createSandbox } from 'sinon'
import * as sinonChai from 'sinon-chai'
import { DatabaseForTesting } from './database-for-testing'
import { buildTestingModuleForHttpTesting } from './module-for-testing'
import { StubbedClass, stubClass } from './types'
import { setAPMInstance } from '../../src/infrastructure/monitoring/apm.init'
import { StubbedType, stubInterface } from '@salesforce/ts-sinon'
import * as apm from 'elastic-apm-node'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect
export { createSandbox, expect }

export { stubClass, StubbedClass }

export { buildTestingModuleForHttpTesting }

export { DatabaseForTesting }

const instanceMock: StubbedType<apm.Agent> = stubInterface(createSandbox())
setAPMInstance(instanceMock)

/* eslint-disable no-process-env */
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { createSandbox } from 'sinon'
import * as sinonChai from 'sinon-chai'
import { DatabaseForTesting } from './database-for-testing'
import { buildTestingModuleForHttpTesting } from './module-for-testing'
import { StubbedClass, stubClass } from './types'

chai.use(sinonChai)
chai.use(chaiAsPromised)

const expect = chai.expect
export { createSandbox, expect }

export { stubClass, StubbedClass }

export { buildTestingModuleForHttpTesting }

export { DatabaseForTesting }

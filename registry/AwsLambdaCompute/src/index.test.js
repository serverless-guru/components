import path from 'path'
import AwsLambdaCompute from './index'

const AwsLambdaFunctionType = {
  name: 'AwsLambdaFunction',
  class: true
}

const AwsLambdaFunctionInstance = {
  name: 'AwsLambdaFunction',
  instance: true
}

const SuperContext = {
  loadType: async () => AwsLambdaFunctionType
}

const context = {
  construct: jest.fn().mockReturnValue(AwsLambdaFunctionInstance)
}

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('AwsLambdaCompute', () => {
  it('should defineFunction and return AwsLambdaFunction instance', async () => {
    const scope = {
      runtime: 'nodejs',
      provider: 'aws',
      memory: 128,
      timeout: 10
    }
    const functionInstance = {
      code: './code',
      handler: 'index.hello',
      functionName: 'abc',
      functionDescription: 'abc function'
    }

    const inputs = {
      provider: 'aws',
      role: undefined,
      functionName: 'abc',
      functionDescription: 'abc function',
      memorySize: 128,
      timeout: 10,
      runtime: 'nodejs8.10',
      handler: 'index.hello',
      environment: {},
      code: './code',
      tags: {}
    }

    const awsLambdaCompute = await AwsLambdaCompute({}, SuperContext)

    const children = await awsLambdaCompute.defineFunction.call(scope, functionInstance, context)

    expect(children).toEqual(AwsLambdaFunctionInstance)
    expect(context.construct).toBeCalledWith(AwsLambdaFunctionType, inputs)
  })

  it('function config should overwrite compute config', async () => {
    const scope = {
      runtime: 'nodejs',
      provider: 'aws',
      memory: 512,
      timeout: 20,
      environment: {
        HELLO: 'world'
      },
      role: 'role'
    }
    const functionInstance = {
      code: './code',
      functionName: 'abc',
      functionDescription: 'abc function',
      memory: 128,
      timeout: 10,
      handler: 'index.hello',
      environment: {
        WORLD: 'hello'
      }
    }

    const inputs = {
      provider: 'aws',
      role: 'role',
      functionName: 'abc',
      functionDescription: 'abc function',
      memorySize: 128,
      timeout: 10,
      runtime: 'nodejs8.10',
      handler: 'index.hello',
      environment: {
        ...scope.environment,
        ...functionInstance.environment
      },
      code: './code',
      tags: {}
    }

    const awsLambdaCompute = await AwsLambdaCompute({}, SuperContext)

    const children = await awsLambdaCompute.defineFunction.call(scope, functionInstance, context)

    expect(children).toEqual(AwsLambdaFunctionInstance)
    expect(context.construct).toBeCalledWith(AwsLambdaFunctionType, inputs)
  })

  it('should use UFS and inject shim', async () => {
    const scope = {
      ufs: true,
      runtime: 'nodejs',
      provider: 'aws',
      memory: 128,
      timeout: 10
    }
    const functionInstance = {
      ufs: true,
      runtime: 'nodejs',
      code: './code',
      functionName: 'abc',
      functionDescription: 'abc function',
      handler: 'index.hello'
    }

    const inputs = {
      provider: 'aws',
      role: undefined,
      functionName: 'abc',
      functionDescription: 'abc function',
      memorySize: 128,
      timeout: 10,
      runtime: 'nodejs8.10',
      handler: 'shim.handler',
      environment: {
        SERVERLESS_HANDLER: 'index.hello'
      },
      code: ['./code', path.resolve(__dirname, 'shims', 'shim.js')],
      tags: {}
    }

    const awsLambdaCompute = await AwsLambdaCompute({}, SuperContext)

    const children = await awsLambdaCompute.defineFunction.call(scope, functionInstance, context)

    expect(children).toEqual(AwsLambdaFunctionInstance)
    expect(context.construct).toBeCalledWith(AwsLambdaFunctionType, inputs)
  })

  it('should define schedule and return AwsEventsRule as a child', async () => {
    const AwsEventsRuleType = {
      name: 'AwsEventsRule',
      class: true
    }
    const AwsEventsRuleInstance = {
      name: 'AwsEventsRule',
      instance: true
    }
    const awsEventsRuleContext = {
      loadType: async () => AwsEventsRuleType,
      construct: jest.fn().mockReturnValue(AwsEventsRuleInstance)
    }

    const scope = {
      provider: 'aws'
    }

    const inputs = {
      provider: 'aws',
      lambda: 'lambda',
      schedule: 'rate(5 minutes)',
      enabled: true
    }

    const awsLambdaCompute = await AwsLambdaCompute({}, SuperContext)

    const children = await awsLambdaCompute.defineSchedule.call(
      scope,
      'lambda',
      '5m',
      awsEventsRuleContext
    )

    expect(children).toEqual(AwsEventsRuleInstance)
    expect(awsEventsRuleContext.construct).toBeCalledWith(AwsEventsRuleType, inputs)
  })

  it('should define schedule and parse singular schedule', async () => {
    const AwsEventsRuleType = {
      name: 'AwsEventsRule',
      class: true
    }
    const AwsEventsRuleInstance = {
      name: 'AwsEventsRule',
      instance: true
    }
    const awsEventsRuleContext = {
      loadType: async () => AwsEventsRuleType,
      construct: jest.fn().mockReturnValue(AwsEventsRuleInstance)
    }

    const scope = {
      provider: 'aws'
    }

    const inputs = {
      provider: 'aws',
      lambda: 'lambda',
      schedule: 'rate(1 hour)',
      enabled: true
    }

    const awsLambdaCompute = await AwsLambdaCompute({}, SuperContext)

    const children = await awsLambdaCompute.defineSchedule.call(
      scope,
      'lambda',
      '1h',
      awsEventsRuleContext
    )

    expect(children).toEqual(AwsEventsRuleInstance)
    expect(awsEventsRuleContext.construct).toBeCalledWith(AwsEventsRuleType, inputs)
  })

  it('should define schedule and parse cron schedule', async () => {
    const AwsEventsRuleType = {
      name: 'AwsEventsRule',
      class: true
    }
    const AwsEventsRuleInstance = {
      name: 'AwsEventsRule',
      instance: true
    }
    const awsEventsRuleContext = {
      loadType: async () => AwsEventsRuleType,
      construct: jest.fn().mockReturnValue(AwsEventsRuleInstance)
    }

    const scope = {
      provider: 'aws'
    }

    const inputs = {
      provider: 'aws',
      lambda: 'lambda',
      schedule: 'cron(0 12 * * ? *)',
      enabled: true
    }

    const awsLambdaCompute = await AwsLambdaCompute({}, SuperContext)

    const children = await awsLambdaCompute.defineSchedule.call(
      scope,
      'lambda',
      '0 12 * * ? *',
      awsEventsRuleContext
    )

    expect(children).toEqual(AwsEventsRuleInstance)
    expect(awsEventsRuleContext.construct).toBeCalledWith(AwsEventsRuleType, inputs)
  })
})

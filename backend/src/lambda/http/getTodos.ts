import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('getTodosForUser')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todos = await getTodosForUser(event)

    logger.info("Processing get all User's todo event", {
      event
    })

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          items: todos
        },
        null,
        2
      )
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)

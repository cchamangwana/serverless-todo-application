import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodoBody: CreateTodoRequest = JSON.parse(event.body)

    logger.info('Processing create new todo event', {
      event
    })

    const todo = await createTodo(newTodoBody, event)

    return {
      statusCode: 201,
      body: JSON.stringify(
        {
          item: todo
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

import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { canUserUpdateTodo, deleteTodo } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId

    logger.info('Processing delete todo event', {
      event
    })

    const userId = getUserId(event)
    const canUpdate = await canUserUpdateTodo(todoId, userId)

    if (!canUpdate.status) {
      const statusCode = canUpdate.reason === 'NOT_FOUND' ? 404 : 403
      const error =
        canUpdate.reason === 'NOT_FOUND'
          ? 'Todo Does not exist'
          : 'You are not allowed to delete this todo'

      logger.error('Delete todo failed', {
        statusCode,
        error
      })

      return {
        statusCode,
        body: JSON.stringify({
          error
        })
      }
    }

    await deleteTodo(todoId, userId)

    return {
      statusCode: 200,
      body: ''
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)

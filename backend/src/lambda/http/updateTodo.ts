import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { canUserUpdateTodo, updateTodo } from '../../businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('updateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const todoRequestBody: UpdateTodoRequest = JSON.parse(event.body)

    logger.info('Processing update todo event', {
      event
    })

    const userId = getUserId(event)
    const canUpdate = await canUserUpdateTodo(todoId, userId)
    if (!canUpdate.status) {
      const statusCode = canUpdate.reason === 'NOT_FOUND' ? 404 : 403
      const error =
        canUpdate.reason === 'NOT_FOUND'
          ? 'Todo Does not exist'
          : 'You are not allowed to update this todo'

      logger.error('Update todo failed', {
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

    await updateTodo(todoId, userId, todoRequestBody)

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

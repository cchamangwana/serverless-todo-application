import { APIGatewayProxyEvent } from 'aws-lambda'
import * as uuid from 'uuid'

import { TodosAccess } from '../dataAccess/todosAcess'
import { getUploadUrl } from '../helpers/attachmentUtils'
import { TodoItem } from '../models/TodoItem'

import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { getUserId } from '../lambda/utils'
import { CanUserUpdateStatus } from '../helpers/types'
import { createLogger } from '../utils/logger'

const todoItemAccess = new TodosAccess()
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

const logger = createLogger('TodosLogic')

/**
 * Get all todos for one user.
 * @param event Api gateway event
 * @returns all the todos of the given user
 */
export async function getTodosForUser(
  event: APIGatewayProxyEvent
): Promise<TodoItem[]> {
  const userId = getUserId(event)

  logger.info('Get all todo for user', {
    userId
  })

  return todoItemAccess.getTodoForUser(userId)
}

/**
 * Create a new todo.
 * @param createTodoRequest the body of the new todo to create
 * @param event api gate event
 * @returns the newly created todo
 */
export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  event: APIGatewayProxyEvent
): Promise<TodoItem> {
  const todoId = uuid.v4() as string
  const userId = getUserId(event)

  logger.info('Create todo', {
    userId,
    todoId
  })

  return await todoItemAccess.createTodo({
    todoId,
    userId,
    createdAt: new Date().toISOString(),
    done: false,
    ...createTodoRequest,
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  })
}

/**
 * Create a presigned url for todo attachement updload.
 * @param todoId the todo id
 * @returns a presigned s3 url.
 */
export function createAttachmentPresignedUrl(todoId: string): string {
  logger.info('createAttachmentPresignedUrl', {
    todoId
  })

  return getUploadUrl(todoId, bucketName, parseInt(urlExpiration))
}

/**
 * Update a todo.
 * @param todoId todos'id
 * @param createTodoRequest the data to update
 */
export async function updateTodo(
  todoId: string,
  userId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<void> {
  logger.info('Update todo', {
    todoId,
    updateTodoRequest
  })

  await todoItemAccess.updateTodo(todoId, userId, updateTodoRequest)
}

/**
 * Get a todo by id.
 * @param todoId the todo id
 * @returns the todoItem or null
 */
export async function getTodo(todoId: string): Promise<TodoItem | null> {
  logger.info('get one todo by id', {
    todoId
  })

  return await todoItemAccess.getTodo(todoId)
}

/**
 * Check if a user can update (edit, delete) a todo.
 * @param todoId todo's id
 * @param userId user's id
 * @returns can the user updated the given todo ?
 */
export async function canUserUpdateTodo(
  todoId: string,
  userId: string
): Promise<CanUserUpdateStatus> {
  const todo = await getTodo(todoId)

  if (todo == null) {
    return {
      status: false,
      reason: 'NOT_FOUND'
    }
  }

  if (todo.userId != userId) {
    return {
      status: false,
      reason: 'UNAUTHORIZED'
    }
  }

  return {
    status: true
  }
}

/**
 * Delete one todo
 * @param todoId todo's id
 */
export async function deleteTodo(
  todoId: string,
  userId: string
): Promise<void> {
  logger.info('deletng one todo', {
    todoId
  })

  await todoItemAccess.deleteTodo(todoId, userId)
}

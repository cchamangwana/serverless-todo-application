import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { getDocumentClient } from '@shelf/aws-ddb-with-xray'

import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = getDocumentClient({
      ddbClientParams: {},
      ddbParams: {}
    }),
    private readonly todoItemsTable = process.env.TODOS_TABLE,
    private readonly todoIdIndex = process.env.TODOS_ID_INDEX
  ) {}

  async getTodoForUser(userId: string): Promise<TodoItem[]> {
    logger.info('getting todos for user', {
      userId
    })

    const result = await this.docClient
      .query({
        TableName: this.todoItemsTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    logger.info('Creating new todo', {
      todo
    })

    await this.docClient
      .put({
        TableName: this.todoItemsTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async getTodo(todoId: string): Promise<TodoItem | null> {
    logger.info('Getting one todo by id', {
      todoId
    })

    const result = await this.docClient
      .query({
        TableName: this.todoItemsTable,
        KeyConditionExpression: 'todoId = :todoId',
        IndexName: this.todoIdIndex,
        ExpressionAttributeValues: {
          ':todoId': todoId
        }
      })
      .promise()

    if (result.Count == 0) {
      return null
    }

    return result.Items[0] as TodoItem
  }

  async updateTodo(
    todoId: string,
    userId: string,
    body: TodoUpdate
  ): Promise<void> {
    logger.info('Updating one todo', {
      todoId,
      body
    })

    await this.docClient
      .update({
        TableName: this.todoItemsTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: `set 
          name = :n,
          dueDate = :m,
          done = :d,
        `,
        ExpressionAttributeValues: {
          ':n': body.name,
          ':m': body.dueDate,
          ':d': body.done
        }
      })
      .promise()
  }

  async deleteTodo(todoId: string, userId: string): Promise<void> {
    logger.info('deleting one todo', {
      todoId,
      userId
    })

    await this.docClient
      .delete({
        TableName: this.todoItemsTable,
        Key: {
          userId,
          todoId
        }
      })
      .promise()
  }
}

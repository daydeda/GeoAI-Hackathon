import { describe, it, expect, vi } from 'vitest'
import { ZodError } from 'zod'
import { globalErrorHandler } from '../error.js'

describe('Global Error Handler', () => {
  const mockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as any

  const mockRequest = {
    log: {
      error: vi.fn(),
    },
  } as any

  it('handles ZodError correctly', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['name'],
        message: 'Expected string, received number',
      },
    ])

    globalErrorHandler(zodError as any, mockRequest, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(400)
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Validation Error',
      details: expect.any(Object),
    }))
  })

  it('handles generic errors with default 500 status', () => {
    const error = new Error('Something went wrong')
    
    globalErrorHandler(error as any, mockRequest, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(500)
    expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String),
    }))
  })

  it('preserves status code from error object', () => {
    const error = new Error('Not Found') as any
    error.statusCode = 404
    
    globalErrorHandler(error, mockRequest, mockReply)

    expect(mockReply.status).toHaveBeenCalledWith(404)
  })
})

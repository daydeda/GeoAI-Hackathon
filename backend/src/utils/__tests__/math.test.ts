import { describe, it, expect } from 'vitest'
import { add, subtract, multiply, divide } from '../math.js'

describe('Math Utilities', () => {
  it('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('subtracts two numbers correctly', () => {
    expect(subtract(10, 4)).toBe(6)
  })

  it('multiplies two numbers correctly', () => {
    expect(multiply(3, 4)).toBe(12)
  })

  describe('divide', () => {
    it('divides two numbers correctly', () => {
      expect(divide(20, 5)).toBe(4)
    })

    it('throws error when dividing by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero')
    })
  })
})

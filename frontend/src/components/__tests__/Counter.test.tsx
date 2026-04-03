import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Counter } from '../Counter'

describe('Counter Component', () => {
  it('renders with initial count of 0 by default', () => {
    render(<Counter />)
    const countDisplay = screen.getByTestId('count-value')
    expect(countDisplay).toHaveTextContent('Count: 0')
  })

  it('renders with custom initial count', () => {
    render(<Counter initialCount={10} />)
    const countDisplay = screen.getByTestId('count-value')
    expect(countDisplay).toHaveTextContent('Count: 10')
  })

  it('increments the count when the increment button is clicked', () => {
    render(<Counter />)
    const incrementButton = screen.getByLabelText('increment')
    const countDisplay = screen.getByTestId('count-value')

    fireEvent.click(incrementButton)
    expect(countDisplay).toHaveTextContent('Count: 1')
  })

  it('decrements the count when the decrement button is clicked', () => {
    render(<Counter initialCount={5} />)
    const decrementButton = screen.getByLabelText('decrement')
    const countDisplay = screen.getByTestId('count-value')

    fireEvent.click(decrementButton)
    expect(countDisplay).toHaveTextContent('Count: 4')
  })
})

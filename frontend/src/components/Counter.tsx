  import React, { useState } from 'react'

export interface CounterProps {
  initialCount?: number
}

export const Counter: React.FC<CounterProps> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState(initialCount)

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold">Counter</h2>
      <p data-testid="count-value" className="text-lg">Count: {count}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setCount(prev => prev - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded"
          aria-label="decrement"
        >
          -
        </button>
        <button
          onClick={() => setCount(prev => prev + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
          aria-label="increment"
        >
          +
        </button>
      </div>
    </div>
  )
}

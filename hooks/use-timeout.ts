"use client"

import { useEffect, useRef } from "react"

/**
 * useTimeout Hook
 *
 * Executes a callback function after a specified delay
 * Automatically cleans up the timeout on unmount or when dependencies change
 *
 * @param callback - Function to execute after the delay
 * @param delay - Delay in milliseconds (null to disable)
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the timeout
  useEffect(() => {
    // Don't schedule if no delay is specified
    if (delay === null) {
      return
    }

    const id = setTimeout(() => savedCallback.current(), delay)

    return () => clearTimeout(id)
  }, [delay])
}

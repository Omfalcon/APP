import { useEffect, useCallback } from 'react';
import { getSocket, onEvent, offEvent, emitEvent } from '../services/socket';

/**
 * Custom hook for Socket.IO event handling
 * Automatically cleans up listeners on unmount
 */
export const useSocket = (eventName, callback) => {
  useEffect(() => {
    if (!eventName || !callback) return;

    onEvent(eventName, callback);

    return () => {
      offEvent(eventName, callback);
    };
  }, [eventName, callback]);
};

/**
 * Custom hook to emit Socket.IO events
 */
export const useEmit = () => {
  return useCallback((event, data) => {
    emitEvent(event, data);
  }, []);
};

/**
 * Custom hook to get Socket.IO instance
 */
export const useGetSocket = () => {
  return getSocket();
};

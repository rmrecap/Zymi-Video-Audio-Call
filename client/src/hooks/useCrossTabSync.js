import { useState, useEffect, useRef } from 'react';

/**
 * Hook to synchronize state across browser tabs using BroadcastChannel API
 * @param {string} channelName - Name of the BroadcastChannel
 * @param {any} initialState - Initial state value
 * @returns {[any, function]} - [current state, setter function]
 */
export const useCrossTabSync = (channelName, initialState) => {
  const [state, setState] = useState(initialState);
  const channelRef = useRef(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Create BroadcastChannel
    channelRef.current = new BroadcastChannel(channelName);

    // Listen for messages from other tabs
    channelRef.current.onmessage = (event) => {
      if (event.data.type === 'SYNC_STATE') {
        setState(event.data.state);
      }
    };

    // Send current state to other tabs when this tab initializes
    if (!isInitialized.current) {
      channelRef.current.postMessage({
        type: 'SYNC_STATE',
        state: initialState
      });
      isInitialized.current = true;
    }

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [channelName, initialState]);

  // Override setState to broadcast changes to other tabs
  const setSyncedState = (newState) => {
    const updatedState = typeof newState === 'function' ? newState(state) : newState;
    setState(updatedState);

    // Broadcast to other tabs
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'SYNC_STATE',
        state: updatedState
      });
    }
  };

  return [state, setSyncedState];
};
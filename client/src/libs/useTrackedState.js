import { useState, useEffect } from 'react';
import stateTracker from './stateTracker';

// Custom hook to track state changes
export const useTrackedState = (initialState, componentName = 'UnnamedComponent', stateName = 'state') => {
  const [state, setState] = useState(initialState);
  
  // Track the state in our global tracker
  useEffect(() => {
    console.log(`[DEBUG] ${componentName}.${stateName} updated:`, state);
    stateTracker.registerState(componentName, stateName, state);
  }, [state, componentName, stateName]);
  
  // Wrap setState to add logging
  const setTrackedState = (newState) => {
    console.log(`[DEBUG] ${componentName}.${stateName} setting state:`, 
      typeof newState === 'function' ? newState(state) : newState
    );
    setState(newState);
  };

  return [state, setTrackedState];
};

// Helper function to get component name
export function getComponentName(component) {
  return component.displayName || component.name || 'UnknownComponent';
} 
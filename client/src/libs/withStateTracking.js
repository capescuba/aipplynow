import React from 'react';

export const withStateTracking = (WrappedComponent) => {
  return function WithStateTracking(props) {
    // Add debug logging for component rendering
    console.log(`[DEBUG] Rendering ${WrappedComponent.name} with props:`, props);

    // Add debug logging for state changes
    React.useEffect(() => {
      console.log(`[DEBUG] ${WrappedComponent.name} mounted`);
      return () => {
        console.log(`[DEBUG] ${WrappedComponent.name} unmounted`);
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
}; 
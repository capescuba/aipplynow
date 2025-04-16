import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, Accordion, AccordionSummary, AccordionDetails, Fab } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import ReactJson from 'react-json-view';
import stateTracker from '../libs/stateTracker';

// Custom JSON stringifier that handles circular references
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Handle special cases
    if (typeof value === 'function') {
      return '[Function]';
    }
    if (value instanceof Error) {
      return `[Error: ${value.message}]`;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value instanceof RegExp) {
      return value.toString();
    }
    if (value instanceof HTMLElement) {
      return `[HTMLElement: ${value.tagName}]`;
    }
    if (value instanceof Event) {
      return `[Event: ${value.type}]`;
    }
    if (value instanceof Window) {
      return '[Window]';
    }
    if (value instanceof Document) {
      return '[Document]';
    }
    if (value instanceof Node) {
      return `[Node: ${value.nodeName}]`;
    }
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    
    return value;
  }, 2);
};

// Global state tracker to capture all React states
const globalStateTracker = {
  states: new Map(),
  registerState(componentName, stateName, value) {
    const key = `${componentName}.${stateName}`;
    this.states.set(key, value);
  },
  getAllStates() {
    return Object.fromEntries(this.states);
  },
  clearStates() {
    this.states.clear();
  }
};

// Override React's useState to track all states
const originalUseState = React.useState;
React.useState = function(initialState) {
  const [state, setState] = originalUseState(initialState);
  
  // Get component name from stack trace
  const stack = new Error().stack;
  const componentMatch = stack.match(/at\s+([A-Z][A-Za-z0-9$_]*)\s+/);
  const componentName = componentMatch ? componentMatch[1] : 'UnknownComponent';
  
  // Track state changes
  useEffect(() => {
    globalStateTracker.registerState(componentName, 'state', state);
  }, [state, componentName]);
  
  return [state, setState];
};

const DebugPanel = () => {
  const [states, setStates] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState({});

  useEffect(() => {
    // Update states every 500ms
    const interval = setInterval(() => {
      const trackedStates = stateTracker.getAllStates();
      const allStates = globalStateTracker.getAllStates();
      
      // Organize states by component
      const organizedStates = {};
      
      // Process tracked states
      Object.entries(trackedStates).forEach(([key, value]) => {
        const [componentName, stateName] = key.split('.');
        if (!organizedStates[componentName]) {
          organizedStates[componentName] = {};
        }
        organizedStates[componentName][stateName] = value;
      });
      
      // Process all states
      Object.entries(allStates).forEach(([key, value]) => {
        const [componentName, stateName] = key.split('.');
        if (!organizedStates[componentName]) {
          organizedStates[componentName] = {};
        }
        organizedStates[componentName][stateName] = value;
      });
      
      setStates(organizedStates);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleAccordionChange = (componentName) => (event, isExpanded) => {
    setExpandedComponents(prev => ({
      ...prev,
      [componentName]: isExpanded
    }));
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      <Fab
        color="primary"
        size="small"
        onClick={toggleVisibility}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1001,
        }}
      >
        <BugReportIcon />
      </Fab>
      
      {isVisible && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            p: 2,
            width: 400,
            maxHeight: 500,
            overflow: 'auto',
            zIndex: 1000,
            opacity: 0.9,
            '&:hover': {
              opacity: 1,
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              React States Debug Panel
            </Typography>
            <IconButton 
              size="small" 
              onClick={toggleVisibility}
              sx={{ ml: 1 }}
            >
              ×
            </IconButton>
          </Box>
          <Box sx={{ mt: 1 }}>
            {Object.keys(states).length > 0 ? (
              Object.entries(states).map(([componentName, componentStates]) => (
                <Accordion 
                  key={componentName}
                  expanded={expandedComponents[componentName] || false}
                  onChange={handleAccordionChange(componentName)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      {componentName} ({Object.keys(componentStates).length} states)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {Object.entries(componentStates).map(([stateName, value]) => (
                      <Box key={stateName} sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {stateName}:
                        </Typography>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: 'rgba(0,0,0,0.03)', 
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '0.8rem'
                        }}>
                          <ReactJson 
                            src={value} 
                            name={false}
                            theme="rjv-default"
                            displayDataTypes={false}
                            enableClipboard={false}
                            displayObjectSize={false}
                            collapsed={1}
                            collapseStringsAfterLength={50}
                            style={{ 
                              backgroundColor: 'transparent',
                              fontSize: '0.8rem'
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No states detected yet.
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </>
  );
};

export default DebugPanel; 
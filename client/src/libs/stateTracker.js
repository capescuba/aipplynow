// Simple state tracking singleton
class StateTracker {
  constructor() {
    this.states = new Map();
  }

  registerState(componentName, stateName, value) {
    const key = `${componentName}.${stateName}`;
    this.states.set(key, value);
    console.log(`[StateTracker] ${key} updated:`, value);
  }

  getState(componentName, stateName) {
    const key = `${componentName}.${stateName}`;
    return this.states.get(key);
  }

  getAllStates() {
    return Object.fromEntries(this.states);
  }
}

export default new StateTracker(); 
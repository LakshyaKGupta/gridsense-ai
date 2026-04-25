import React, { createContext, useContext, useEffect, useState } from 'react';
import { startSystemEngine, subscribeSystemState, SystemState } from '../system/stateEngine';

type SystemStateShape = SystemState;

type SystemStateContextValue = {
  state: SystemStateShape;
};

const SystemStateContext = createContext<SystemStateContextValue | undefined>(undefined);

export const SystemStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SystemStateShape>({ 
    zones: [], 
    stations: [], 
    total_demand: 0, 
    peak_load: 0, 
    optimized_peak: 0, 
    reduction_percent: 0, 
    alerts: [], 
    timestamp: '',
    current_hour: 0,
    scenario: null,
    data_source: 'fallback'
  });

  useEffect(() => {
    // Start the engine on first mount
    startSystemEngine();
    const unsubscribe = subscribeSystemState((newState) => {
      setState(newState);
    });
    // seed initial state via a one-off fetch from engine (subscriber will also fire immediately)
    return () => unsubscribe();
  }, []);

  return (
    <SystemStateContext.Provider value={{ state }}>
      {children}
    </SystemStateContext.Provider>
  );
};

export const useSystemState = (): SystemStateShape => {
  const ctx = useContext(SystemStateContext);
  if (!ctx) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return ctx.state;
};

export const withSystemState = (Comp: React.ComponentType<any>) => {
  return (props: any) => (
    <SystemStateProvider>
      <Comp {...props} />
    </SystemStateProvider>
  );
};

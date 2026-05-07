import React, { createContext, useContext, useEffect, useState } from 'react';
import { startSystemEngine, subscribeSystemState, SystemState, UserRole } from '../system/stateEngine';
import { useAuth } from './AuthContext';

type SystemStateShape = SystemState;

type SystemStateContextValue = {
  state: SystemStateShape;
};

const SystemStateContext = createContext<SystemStateContextValue | undefined>(undefined);

export const SystemStateProvider = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth();

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
    data_source: 'fallback',
  });

  useEffect(() => {
    // Start engine with the user's role so polling cadence is correct
    startSystemEngine(role as UserRole);
    const unsubscribe = subscribeSystemState((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, [role]); // restart if role changes

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

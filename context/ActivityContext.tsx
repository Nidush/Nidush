import React, { createContext, useContext, useState } from 'react';

const ActivityContext = createContext<any>(null);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<any[]>([]);

  const addActivity = (newActivity: any) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) return { activities: [], addActivity: () => {} };
  return context;
};

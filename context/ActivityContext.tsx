import React, { createContext, useContext, useState } from 'react';
import type { Activity } from '@/constants/data/types';

type ActivityContextValue = {
  activities: Activity[];
  addActivity: (newActivity: Activity) => void;
};

const defaultActivityContextValue: ActivityContextValue = {
  activities: [],
  addActivity: () => undefined,
};

const ActivityContext = createContext<ActivityContextValue>(defaultActivityContextValue);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = (newActivity: Activity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

export const useActivities = () => {
  return useContext(ActivityContext);
};

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Database } from "@/integrations/supabase/types";

type FlowerMood = Database["public"]["Enums"]["flower_mood"];

export interface FlowData {
  mood: FlowerMood | null;
  recipient: string;
  budget: number;
  customBudget: string;
  description: string;
  selectedFlowerIds: string[];
}

interface FlowContextType {
  step: number;
  setStep: (step: number) => void;
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  direction: "forward" | "backward";
  goNext: () => void;
  goBack: () => void;
  reset: () => void;
}

const FlowContext = createContext<FlowContextType | null>(null);

const initialData: FlowData = {
  mood: null,
  recipient: "",
  budget: 0,
  customBudget: "",
  description: "",
  selectedFlowerIds: [],
};

export const FlowProvider = ({ children }: { children: ReactNode }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FlowData>(initialData);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const updateData = useCallback((partial: Partial<FlowData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const goNext = useCallback(() => {
    setDirection("forward");
    setStep((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection("backward");
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const reset = useCallback(() => {
    setStep(0);
    setData(initialData);
    setDirection("forward");
  }, []);

  return (
    <FlowContext.Provider value={{ step, setStep, data, updateData, direction, goNext, goBack, reset }}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
};

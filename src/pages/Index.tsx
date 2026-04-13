import { useState } from "react";
import { FlowProvider, useFlow } from "@/contexts/FlowContext";
import { StepTransition } from "@/components/StepTransition";
import { StepIndicator } from "@/components/StepIndicator";
import { SplashScreen } from "@/components/steps/SplashScreen";
import { MoodStep } from "@/components/steps/MoodStep";
import { RecipientStep } from "@/components/steps/RecipientStep";
import { BudgetStep } from "@/components/steps/BudgetStep";
import { DescriptionStep } from "@/components/steps/DescriptionStep";
import { PreviewStep } from "@/components/steps/PreviewStep";
import { ResultStep } from "@/components/steps/ResultStep";
import { PetalBackground } from "@/components/PetalBackground";

// Bước 0–3 hiện progress bar, bước 4 (Preview) + 5 (Result) ẩn
const TOTAL_STEPS = 4;

const FlowContent = () => {
  const { step, direction } = useFlow();
  const [started, setStarted] = useState(false);

  if (!started) {
    return <SplashScreen onStart={() => setStarted(true)} />;
  }

  return (
    <div className="relative flex flex-col min-h-screen animated-gradient-bg">
      <PetalBackground />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <h1 className="text-lg font-display font-semibold text-foreground tracking-wide">
          FLEURÉA
        </h1>
        {step < TOTAL_STEPS && (
          <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
        )}
      </div>

      {/* Step Content */}
      <div className="relative z-10 flex-1 flex items-start justify-center overflow-hidden">
        <StepTransition stepKey={`step-${step}`} direction={direction}>
          {step === 0 && <MoodStep />}
          {step === 1 && <RecipientStep />}
          {step === 2 && <BudgetStep />}
          {step === 3 && <DescriptionStep />}
          {step === 4 && <PreviewStep />}
          {step >= 5 && <ResultStep />}
        </StepTransition>
      </div>
    </div>
  );
};

const Index = () => (
  <FlowProvider>
    <FlowContent />
  </FlowProvider>
);

export default Index;
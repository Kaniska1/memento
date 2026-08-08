type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/45">
          Taste profile
        </p>

        <p className="text-xs text-white/40">
          {currentStep} of {totalSteps}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const completed = index + 1 <= currentStep;

          return (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                completed ? "bg-[#6D001A]" : "bg-white/10"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
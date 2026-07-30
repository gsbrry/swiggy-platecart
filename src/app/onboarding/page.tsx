import { ScreenStub } from "@/components/screen-stub";

export default function OnboardingPage() {
  return (
    <ScreenStub
      title="Onboarding"
      description="Five-step setup: goal, diet, household, budget, exclusions."
      apis={["PATCH /api/user/profile"]}
    />
  );
}

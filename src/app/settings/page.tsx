import { ScreenStub } from "@/components/screen-stub";

export default function SettingsPage() {
  return (
    <ScreenStub
      title="Settings"
      description="Update profile, dietary preferences, budget and exclusions."
      apis={["GET /api/user/profile", "PATCH /api/user/profile"]}
    />
  );
}

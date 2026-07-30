import { ScreenStub } from "@/components/screen-stub";

export default function MyTemplatesPage() {
  return (
    <ScreenStub
      title="My templates"
      description="Templates the current user has created or forked."
      apis={["GET /api/templates?creator_id=me"]}
    />
  );
}

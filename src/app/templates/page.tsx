import { ScreenStub } from "@/components/screen-stub";

export default function TemplatesPage() {
  return (
    <ScreenStub
      title="Template browser"
      description="Browse public dish templates by lane, goal, cuisine, diet."
      apis={["GET /api/templates"]}
    />
  );
}

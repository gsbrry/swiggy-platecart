import { ScreenStub } from "@/components/screen-stub";

export default function NewTemplatePage() {
  return (
    <ScreenStub
      title="Create template"
      description="Author a new dish template with ingredients, tags and pricing."
      apis={["POST /api/templates"]}
    />
  );
}

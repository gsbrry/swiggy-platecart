import { ScreenStub } from "@/components/screen-stub";

export default function TemplateDetailPage() {
  return (
    <ScreenStub
      title="Template detail"
      description="Full ingredient list, tags and fork controls for a single template."
      apis={["GET /api/templates/[id]", "POST /api/templates/[id]/fork"]}
    />
  );
}

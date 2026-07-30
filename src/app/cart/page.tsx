import { ScreenStub } from "@/components/screen-stub";

export default function CartPage() {
  return (
    <ScreenStub
      title="Cart preview"
      description="Aggregated ingredient list ready to push to Instamart via MCP."
      apis={["POST /api/cart/build", "POST /api/cart/add-to-instamart"]}
    />
  );
}

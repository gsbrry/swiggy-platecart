export const metadata = { title: "Terms and community rules" };

// Plain-language draft. Have it reviewed by a lawyer before public launch (see docs/reviews/05-qa-compliance.md).
export default function TermsPage() {
  return (
    <>
      <h1>Terms and community rules</h1>
      <p className="text-sm text-ink-muted">Draft · last updated 29 October 2026</p>
      <h2>Using Planetto</h2>
      <p>Planetto is a free tool for planning meals and sharing menus. You must be 18 or older. Keep your password safe; you are responsible for activity on your account.</p>
      <h2>What you share</h2>
      <p>You keep ownership of the dishes and menus you create. By making them public or sharing a link, you let others view and copy them into their own plans.</p>
      <h2>Community rules</h2>
      <ul>
        <li>Share your own work, or credit the person whose recipe you used.</li>
        <li>No hateful, abusive, sexual or misleading content, spam, links or phone numbers.</li>
        <li>No medical claims. Menus are general ideas, not diet or medical advice.</li>
        <li>Rate menus honestly and only after using them.</li>
      </ul>
      <p>Anyone can report a menu, dish or rating. We review reports within 48 hours and may hide content or close accounts that break these rules.</p>
      <h2>Food and health</h2>
      <p>Check ingredients for allergies and talk to a doctor or dietitian about medical diets. Planetto does not verify nutrition or allergen information.</p>
      <h2>Changes</h2>
      <p>Menus are free today. If we add paid menus later, we will update these terms and tell you first.</p>
    </>
  );
}

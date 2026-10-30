export const metadata = { title: "Privacy Policy" };

// Plain-language draft. Have it reviewed by a lawyer before public launch (see docs/reviews/05-qa-compliance.md).
export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-ink-muted">Draft · last updated 29 October 2026</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account: your name, email address and, if you use Google sign-in, your Google profile name.</li>
        <li>Food preferences: diet, foods you avoid and household size. These are private and never shown to others.</li>
        <li>What you create: your meal plan, dishes, menus, ratings and reports.</li>
      </ul>
      <p>We do not collect your location, phone number or payment details, and we do not use advertising trackers.</p>
      <h2>Why we use it</h2>
      <p>Only to run Planetto: to save your plan, suggest suitable dishes, size your shopping list and show the menus you choose to share.</p>
      <h2>What others can see</h2>
      <p>Your name and username appear on dishes, menus and ratings that you make public or share by link. Everything else is private to you.</p>
      <h2>Where it is stored</h2>
      <p>Data is stored with Supabase in Mumbai, India. The app is hosted on Vercel. These providers process data on our behalf.</p>
      <h2>Your rights</h2>
      <ul>
        <li>Correct your details any time on the Me page.</li>
        <li>Delete your account and all your data from the Me page. Deletion is immediate and permanent.</li>
        <li>Ask us what we hold about you, or raise a complaint, by writing to the grievance contact below.</li>
      </ul>
      <h2>Age</h2>
      <p>Planetto is for people aged 18 and over.</p>
      <h2>Grievance contact</h2>
      <p>Email: <a className="text-ink-orange underline" href="mailto:grievance@planetto.app">grievance@planetto.app</a>. We reply within 30 days.</p>
    </>
  );
}

type Props = {
  title: string;
  description: string;
  apis: string[];
};

export function ScreenStub({ title, description, apis }: Props) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">{title}</h1>
        <p className="text-sm text-charcoal/70">{description}</p>
      </header>
      <div className="rounded-lg border border-charcoal/10 bg-white/70 backdrop-blur-md p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
          APIs this screen calls
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-charcoal/80">
          {apis.map((api) => (
            <li key={api}>
              <code className="rounded bg-gray-50 px-1.5 py-0.5 text-xs">{api}</code>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

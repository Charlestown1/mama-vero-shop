function renderValue(value) {
  if (value === null || value === undefined || value === "unavailable") {
    return <span className="text-ink-700">Data unavailable</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {value.map((v, i) => <li key={i}>{typeof v === "string" ? v : JSON.stringify(v)}</li>)}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([k, v]) => (
          <p key={k}><span className="text-ink-500">{k}:</span> {String(v ?? "Data unavailable")}</p>
        ))}
      </div>
    );
  }
  return <p>{String(value)}</p>;
}

export default function ReportSection({ title, value }) {
  return (
    <div className="card p-4">
      <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold-500">{title}</h4>
      <div className="mt-2 text-sm text-ink-300">{renderValue(value)}</div>
    </div>
  );
}

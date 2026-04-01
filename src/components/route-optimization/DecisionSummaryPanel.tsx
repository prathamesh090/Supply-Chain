export function DecisionSummaryPanel({ decisionSummary }: { decisionSummary: string[] }) {
  return (
    <div className="space-y-2">
      {decisionSummary.map((item, idx) => (
        <div key={idx} className="rounded-lg border bg-card p-3 text-sm">{item}</div>
      ))}
    </div>
  );
}

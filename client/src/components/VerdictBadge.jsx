export default function VerdictBadge({ verdict }) {
  const key = (verdict || 'NOT_TESTED').toLowerCase();
  const labels = {
    exceeds: 'Exceeds limit',
    no_exceedance: 'No exceedance',
    not_tested: 'Not tested',
  };

  return <span className={`verdict-badge ${key}`}>{labels[key] || 'Not tested'}</span>;
}

export function VerdictStatement({ verdict }) {
  if (!verdict?.statement) return null;
  return (
    <div>
      <VerdictBadge verdict={verdict.verdict} />
      <div className="statement-box">{verdict.statement}</div>
    </div>
  );
}

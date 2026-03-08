import { Info } from "lucide-react";

type CommitmentInfoProps = {
  commitmentCount: number;
  tokenType: string | null | undefined;
  isLoading: boolean;
};

export function CommitmentInfo({
  commitmentCount,
  tokenType,
  isLoading,
}: CommitmentInfoProps) {
  const displayToken = tokenType?.toUpperCase() || "TOKEN";

  if (isLoading) {
    return (
      <div className="flex items-start gap-2 glass px-4 py-3 rounded-xl border border-white/10 text-sm">
        <Info size={14} className="text-white/40 mt-0.5 shrink-0" />
        <p className="text-white/50">Loading available commitments...</p>
      </div>
    );
  }

  if (commitmentCount === 0) {
    return (
      <div className="flex items-start gap-2 glass px-4 py-3 rounded-xl border border-yellow-500/20 text-sm">
        <Info size={14} className="text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-white/70">
          No {displayToken} commitments found.
          <span className="text-yellow-400">
            {" "}
            Buy tokens first to enable selling.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 glass px-4 py-3 rounded-xl border border-green-500/20 text-sm">
      <Info size={14} className="text-green-400 mt-0.5 shrink-0" />
      <p className="text-white/70">
        ✓ You have{" "}
        <span className="text-green-400 font-semibold">{commitmentCount}</span>{" "}
        available {displayToken} commitment(s).
        <br />
        <span className="text-white/50 text-xs">
          You can sell any amount from your purchased balance.
        </span>
      </p>
    </div>
  );
}

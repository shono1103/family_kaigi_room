type BalancePanelProps = {
  isActive: boolean;
  index: number;
};

export function BalancePanel({ isActive, index }: BalancePanelProps) {
  return (
    <section
      id={`panel-${index}`}
      role="tabpanel"
      aria-labelledby={`tab-${index}`}
      aria-hidden={!isActive}
      className={[
        "min-h-[60svh] origin-top transition duration-150 ease-out",
        isActive
          ? "block translate-y-0 scale-100 opacity-100"
          : "hidden translate-y-2 scale-[0.98] opacity-0",
      ].join(" ")}
    >
      <h2 className="mt-0 text-2xl font-semibold">残高</h2>
      <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.03] p-4">
        <p className="text-sm text-[#4b4b65]">残高パネル（準備中）</p>
      </div>
    </section>
  );
}

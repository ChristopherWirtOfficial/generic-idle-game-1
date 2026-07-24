import { AMOUNTS } from "./Rail";
import { amountLabel } from "./vocab";
import type { BuyAmount } from "../game/types";

interface Props {
  amount: BuyAmount;
  setAmount: (a: BuyAmount) => void;
}

/**
 * One global quantity for the whole chain. Because every row prices the selected
 * quantity, picking →×N turns the entire rail into a cost-to-next-milestone
 * readout — the chain answers "what would this take" all at once.
 */
export function QuantityBar({ amount, setAmount }: Props): JSX.Element {
  return (
    <div className="qbar">
      <div className="seg" role="group" aria-label="buy quantity">
        {AMOUNTS.map((a) => (
          <button
            key={String(a)}
            className={`${a === amount ? "on" : ""}${a === "milestone" ? " wide" : ""}`}
            onClick={() => setAmount(a)}
            aria-pressed={a === amount}
          >
            {amountLabel(a)}
          </button>
        ))}
      </div>
    </div>
  );
}

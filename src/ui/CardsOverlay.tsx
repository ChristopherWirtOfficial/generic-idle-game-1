import { useState } from "react";
import { hue } from "./Rail";
import { fmt } from "../game/format";
import type { Card, DrawOffer } from "../game/types";

interface Props { offer: DrawOffer; onDone: (picked: Card[]) => void; }

function cardText(c: Card): { big: string; small: string; tc: string | null } {
  if (c.kind === "flywheel") return { big: "FLYWHEEL", small: "every reset: all wheels complete once", tc: null };
  if (c.kind === "hotstart") return { big: `START +${c.levels}`, small: "runs begin holding more tier 1", tc: null };
  return { big: `${(c.tier ?? 0) + 1} ${c.stat} +${c.levels}`, small: `tier ${(c.tier ?? 0) + 1} ${c.stat === "cst" ? "costs down" : c.stat === "spd" ? "cycles faster" : "pays more"}`, tc: hue(c.tier) };
}

export function CardsOverlay({ offer, onDone }: Props): JSX.Element {
  const [taken, setTaken] = useState<number[]>([]);
  const left = offer.picks - taken.length;

  return (
    <div className="veil">
      <div className="ceremony">
        <div className="liq">cashed out<b>+{fmt(offer.liquidated)}</b></div>
        <div className="fan">
          {offer.cards.map((c, idx) => {
            const t = cardText(c);
            const isTaken = taken.includes(idx);
            return (
              <button
                key={idx}
                className={`playcard r${c.rarity}${isTaken ? " taken" : ""}`}
                style={t.tc ? ({ ["--tc" as string]: t.tc } as Record<string, string>) : undefined}
                disabled={!isTaken && left <= 0}
                onClick={() => setTaken((cur) => (cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx]))}
              >
                <span className="band" />
                <span className="big">{t.big}</span>
                <span className="small">{t.small}</span>
              </button>
            );
          })}
        </div>
        <div className="cere-actions">
          <span className="cere-count">take {taken.length}/{offer.picks}</span>
          <button className="donebtn" disabled={taken.length !== offer.picks} onClick={() => onDone(taken.map((i) => offer.cards[i]!).filter(Boolean))}>
            KEEP
          </button>
        </div>
      </div>
    </div>
  );
}

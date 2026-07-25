import { useState } from "react";
import { hue } from "./Rail";
import { fmt } from "../game/format";
import { STAT_EFFECT, STAT_NAME, StatGlyph } from "./vocab";
import type { Card, DrawOffer, Stat } from "../game/types";

interface Props {
  offer: DrawOffer;
  onDone: (picked: Card[]) => void;
  onReroll: () => void;
  rerolls: number;
}

function cardText(c: Card): { big: string; small: string; tc: string | null; stat: Stat | null } {
  if (c.kind === "flywheel") {
    return { big: "FLYWHEEL", small: "every reset: all wheels complete once", tc: null, stat: null };
  }
  if (c.kind === "hotstart") {
    return { big: `START +${c.levels}`, small: "runs begin holding more tier 1", tc: null, stat: null };
  }
  const stat = c.stat ?? "value";
  return {
    big: `${(c.tier ?? 0) + 1} ${STAT_NAME[stat]} +${c.levels}`,
    small: `tier ${(c.tier ?? 0) + 1} ${STAT_EFFECT[stat]}`,
    tc: hue(c.tier),
    stat,
  };
}

export function CardsOverlay({ offer, onDone, onReroll, rerolls }: Props): JSX.Element {
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
                <span className="big">{t.stat && <StatGlyph stat={t.stat} />}{t.big}</span>
                <span className="small">{t.small}</span>
              </button>
            );
          })}
        </div>
        <div className="cere-actions">
          {/* Taking a card first would make the reroll a free re-pick, so it is
              only offered on an untouched hand: give up what you can see for
              what you cannot. */}
          <button
            className="rerollbtn"
            disabled={rerolls < 1 || taken.length > 0}
            onClick={onReroll}
            aria-label={`reroll the hand, ${rerolls} left`}
          >
            reroll <b>{rerolls}</b>
          </button>
          <span className="cere-count">take {taken.length}/{offer.picks}</span>
          <button className="donebtn" disabled={taken.length !== offer.picks} onClick={() => onDone(taken.map((i) => offer.cards[i]!).filter(Boolean))}>
            KEEP
          </button>
        </div>
      </div>
    </div>
  );
}

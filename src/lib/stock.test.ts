import { describe, expect, it } from "vitest";
import {
  applyTake,
  canUndo,
  formatQuantity,
  fromBaseUnits,
  pluralise,
  stockBarFraction,
  stockStatus,
  suggestedReorderQty,
  toBaseUnits,
} from "./stock";

describe("stockStatus", () => {
  it("is out at zero or below", () => {
    expect(stockStatus({ quantity: 0, threshold: 5 })).toBe("out");
    expect(stockStatus({ quantity: -1, threshold: 5 })).toBe("out");
  });
  it("is low at or under the threshold", () => {
    expect(stockStatus({ quantity: 5, threshold: 5 })).toBe("low");
    expect(stockStatus({ quantity: 1, threshold: 5 })).toBe("low");
  });
  it("is ok above the threshold", () => {
    expect(stockStatus({ quantity: 6, threshold: 5 })).toBe("ok");
  });
  it("is never low with a zero threshold unless out", () => {
    expect(stockStatus({ quantity: 1, threshold: 0 })).toBe("ok");
    expect(stockStatus({ quantity: 0, threshold: 0 })).toBe("out");
  });
});

describe("pluralise", () => {
  it("handles kitchen words", () => {
    expect(pluralise("bag", 2)).toBe("bags");
    expect(pluralise("bag", 1)).toBe("bag");
    expect(pluralise("box", 3)).toBe("boxes");
    expect(pluralise("case", 2)).toBe("cases");
    expect(pluralise("each", 2)).toBe("each".concat("es"));
  });
});

describe("formatQuantity", () => {
  const blueRoll = { quantity: 40, unitName: "bag", packSize: 12, packName: "case" };
  it("splits into packs and units", () => {
    expect(formatQuantity(blueRoll)).toBe("3 cases + 4 bags");
  });
  it("drops the unit part when it is zero", () => {
    expect(formatQuantity({ ...blueRoll, quantity: 24 })).toBe("2 cases");
  });
  it("drops the pack part when under one pack", () => {
    expect(formatQuantity({ ...blueRoll, quantity: 7 })).toBe("7 bags");
  });
  it("uses singular words", () => {
    expect(formatQuantity({ ...blueRoll, quantity: 13 })).toBe("1 case + 1 bag");
  });
  it("uses plain units when there are no packs", () => {
    expect(formatQuantity({ quantity: 3, unitName: "bottle", packSize: null, packName: null })).toBe("3 bottles");
    expect(formatQuantity({ quantity: 0, unitName: "bottle", packSize: null, packName: null })).toBe("0 bottles");
  });
});

describe("toBaseUnits and fromBaseUnits", () => {
  it("converts packs and units", () => {
    expect(toBaseUnits(2, 3, 12)).toBe(27);
    expect(toBaseUnits(0, 5, 12)).toBe(5);
    expect(toBaseUnits(2, 0, null)).toBe(2);
  });
  it("ignores negatives and NaN", () => {
    expect(toBaseUnits(-1, NaN, 12)).toBe(0);
  });
  it("round-trips", () => {
    expect(fromBaseUnits(27, 12)).toEqual({ packs: 2, units: 3 });
    expect(fromBaseUnits(5, null)).toEqual({ packs: 0, units: 5 });
  });
});

describe("stockBarFraction", () => {
  it("is full at twice the threshold", () => {
    expect(stockBarFraction({ quantity: 20, threshold: 10 })).toBe(1);
    expect(stockBarFraction({ quantity: 50, threshold: 10 })).toBe(1);
  });
  it("is proportional under that", () => {
    expect(stockBarFraction({ quantity: 5, threshold: 10 })).toBe(0.25);
    expect(stockBarFraction({ quantity: 0, threshold: 10 })).toBe(0);
  });
  it("copes with a zero threshold", () => {
    expect(stockBarFraction({ quantity: 3, threshold: 0 })).toBe(1);
  });
});

describe("applyTake", () => {
  it("takes the requested amount", () => {
    expect(applyTake(10, 4)).toEqual({ next: 6, taken: 4, clamped: false });
  });
  it("clamps at zero and says so", () => {
    expect(applyTake(3, 5)).toEqual({ next: 0, taken: 3, clamped: true });
  });
  it("ignores negative requests", () => {
    expect(applyTake(3, -5)).toEqual({ next: 3, taken: 0, clamped: false });
  });
});

describe("suggestedReorderQty", () => {
  it("orders back to twice the threshold", () => {
    expect(suggestedReorderQty({ quantity: 2, threshold: 6, packSize: null })).toBe(10);
  });
  it("orders at least one pack", () => {
    expect(suggestedReorderQty({ quantity: 5, threshold: 6, packSize: 24 })).toBe(24);
  });
  it("orders at least one unit", () => {
    expect(suggestedReorderQty({ quantity: 0, threshold: 0, packSize: null })).toBe(1);
  });
});

describe("canUndo", () => {
  const now = new Date("2026-09-11T12:00:00Z");
  it("allows the latest movement inside ten minutes", () => {
    expect(canUndo({ createdAt: new Date("2026-09-11T11:55:00Z"), type: "TAKE" }, true, now)).toBe(true);
  });
  it("refuses after ten minutes", () => {
    expect(canUndo({ createdAt: new Date("2026-09-11T11:49:59Z"), type: "TAKE" }, true, now)).toBe(false);
  });
  it("refuses if not the latest", () => {
    expect(canUndo({ createdAt: now, type: "TAKE" }, false, now)).toBe(false);
  });
  it("refuses to undo an undo", () => {
    expect(canUndo({ createdAt: now, type: "ADJUST" }, true, now)).toBe(false);
  });
});

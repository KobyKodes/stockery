import { describe, expect, it } from "vitest";
import {
  applyTake,
  canUndo,
  formatQuantity,
  formatWeight,
  fromBaseUnits,
  pluralise,
  quantityParts,
  stockBarFraction,
  stockStatus,
  suggestedReorderQty,
  toBaseUnits,
  toGrams,
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
    expect(pluralise("each", 2)).toBe("each");
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

describe("pluralise and formatQuantity outside English", () => {
  it("leaves an Arabic unit name exactly as the kitchen typed it", () => {
    expect(pluralise("كيس", 5, "ar")).toBe("كيس");
    expect(pluralise("box", 5, "ar")).toBe("box");
  });

  it("still applies English rules by default", () => {
    expect(pluralise("box", 5)).toBe("boxes");
    expect(pluralise("box", 5, "en")).toBe("boxes");
  });

  it("keeps pack wording unpluralised in Arabic", () => {
    const item = { quantity: 40, unitName: "كيس", packSize: 12, packName: "صندوق" };
    expect(formatQuantity(item, "ar")).toBe("3 صندوق + 4 كيس");
  });
});

describe("weight", () => {
  const cumin = { quantity: 1250, unitName: "g", packSize: null, packName: null, measure: "WEIGHT" as const };

  it("shows grams under a kilo and kilograms from a kilo up", () => {
    expect(formatWeight(0)).toBe("0 g");
    expect(formatWeight(750)).toBe("750 g");
    expect(formatWeight(1000)).toBe("1 kg");
    expect(formatWeight(1250)).toBe("1.25 kg");
    expect(formatWeight(12005)).toBe("12.005 kg");
    expect(formatWeight(-1500)).toBe("-1.5 kg");
  });

  it("uses Arabic unit symbols in Arabic", () => {
    expect(formatWeight(500, "ar")).toBe("500 غ");
    expect(formatWeight(2000, "ar")).toBe("2 كغ");
  });

  it("formats a weighed item's quantity as a weight", () => {
    expect(formatQuantity(cumin)).toBe("1.25 kg");
    expect(formatQuantity({ ...cumin, quantity: 80 })).toBe("80 g");
  });

  it("converts grams and kilograms to whole grams", () => {
    expect(toGrams(250, "g")).toBe(250);
    expect(toGrams(1.5, "kg")).toBe(1500);
    expect(toGrams(1.005, "kg")).toBe(1005);
    expect(toGrams(0.4, "g")).toBe(0);
    expect(toGrams(-2, "kg")).toBe(0);
    expect(toGrams(NaN, "g")).toBe(0);
  });

  it("splits a quantity into number and word", () => {
    expect(quantityParts(cumin, 1250)).toEqual({ quantity: "1.25", unit: "kg" });
    expect(quantityParts(cumin, 40)).toEqual({ quantity: "40", unit: "g" });
    expect(quantityParts({ unitName: "bottle" }, 3)).toEqual({ quantity: "3", unit: "bottles" });
  });

  it("never pluralises a gram symbol", () => {
    expect(pluralise("g", 2)).toBe("g");
    expect(pluralise("kg", 5)).toBe("kg");
  });
});

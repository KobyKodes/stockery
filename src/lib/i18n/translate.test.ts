import { describe, expect, it } from "vitest";
import { ar } from "./ar";
import { en } from "./en";
import { dirOf, isLocale, otherLocale } from "./config";
import { msg, resolveMessage } from "./message";
import { createTranslator } from "./translate";

const t = createTranslator("en");
const tAr = createTranslator("ar");

describe("dictionaries", () => {
  it("translate every key English defines", () => {
    const missing = Object.keys(en).filter((key) => !(key in ar));
    expect(missing).toEqual([]);
  });

  it("give Arabic an \"other\" form wherever English counts", () => {
    for (const [key, value] of Object.entries(en)) {
      if (typeof value === "string") continue;
      const arabic = ar[key as keyof typeof ar];
      expect(typeof arabic, `${key} should be plural in Arabic too`).toBe("object");
      expect(arabic, `${key} needs an "other" form`).toHaveProperty("other");
    }
  });
});

describe("createTranslator", () => {
  it("returns a plain string unchanged", () => {
    expect(t("nav.storeroom")).toBe("Storeroom");
    expect(tAr("nav.storeroom")).toBe("المخزن");
  });

  it("fills placeholders", () => {
    expect(t("row.editAria", { name: "Flour" })).toBe("Edit Flour");
    expect(tAr("row.editAria", { name: "طحين" })).toBe("تعديل طحين");
  });

  it("leaves a placeholder alone when no value is given", () => {
    expect(t("row.editAria")).toBe("Edit {name}");
  });

  it("picks the English singular and plural", () => {
    expect(t("common.itemCount", { count: 1 })).toBe("1 item");
    expect(t("common.itemCount", { count: 4 })).toBe("4 items");
    expect(t("common.itemCount", { count: 0 })).toBe("0 items");
  });

  it("picks all six Arabic shapes", () => {
    expect(tAr("common.itemCount", { count: 0 })).toBe("لا أصناف");
    expect(tAr("common.itemCount", { count: 1 })).toBe("صنف واحد");
    expect(tAr("common.itemCount", { count: 2 })).toBe("صنفان");
    expect(tAr("common.itemCount", { count: 3 })).toBe("3 أصناف");
    expect(tAr("common.itemCount", { count: 11 })).toBe("11 صنفاً");
    expect(tAr("common.itemCount", { count: 100 })).toBe("100 صنف");
  });

  it("falls back to the \"other\" form without a count", () => {
    expect(t("common.itemCount")).toBe("{count} items");
  });
});

describe("message tokens", () => {
  it("resolve a bare key", () => {
    expect(resolveMessage(msg("error.itemMissing"), t)).toBe("That item isn't in the storeroom.");
    expect(resolveMessage(msg("error.itemMissing"), tAr)).toBe("هذا الصنف ليس في المخزن.");
  });

  it("resolve a key with values", () => {
    expect(resolveMessage(msg("error.tooLong", { max: 200 }), t)).toBe("Keep this under 200 characters.");
  });

  it("pass an ordinary sentence straight through", () => {
    expect(resolveMessage("Written before any of this existed", t)).toBe("Written before any of this existed");
  });
});

describe("config", () => {
  it("knows its two locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("runs Arabic right to left", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });

  it("toggles between the two", () => {
    expect(otherLocale("en")).toBe("ar");
    expect(otherLocale("ar")).toBe("en");
  });
});

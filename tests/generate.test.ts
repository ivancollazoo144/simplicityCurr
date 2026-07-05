import { describe, it, expect } from "vitest";
import { FORMAT_SECTIONS, type LessonFormat } from "../lib/generate";

describe("FORMAT_SECTIONS", () => {
  it("includes all five LessonFormat keys", () => {
    const keys = Object.keys(FORMAT_SECTIONS) as LessonFormat[];
    expect(keys).toContain("ICAP");
    expect(keys).toContain("WARMUP");
    expect(keys).toContain("5E");
    expect(keys).toContain("INQUIRY");
    expect(keys).toContain("UDL");
  });

  it("ICAP has exactly 5 sections", () => {
    expect(FORMAT_SECTIONS.ICAP).toHaveLength(5);
  });

  it("5E has exactly 5 sections", () => {
    expect(FORMAT_SECTIONS["5E"]).toHaveLength(5);
  });

  it("every format has at least 3 sections", () => {
    for (const sections of Object.values(FORMAT_SECTIONS)) {
      expect(sections.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("all section names are non-empty strings", () => {
    for (const sections of Object.values(FORMAT_SECTIONS)) {
      for (const s of sections) {
        expect(typeof s).toBe("string");
        expect(s.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

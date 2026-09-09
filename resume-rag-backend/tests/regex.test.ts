import {
  extractEmail,
  extractPhone,
  extractExperienceYears,
  EMAIL_REGEX,
  PHONE_REGEX,
  EXPERIENCE_REGEX,
} from "../src/modules/ingestion/utils/regex";

describe("regex utilities (Phase 7)", () => {
  describe("extractExperienceYears", () => {
    it("extracts 13 from '13+ years of experience'", () => {
      expect(extractExperienceYears("13+ years of experience")).toBe(13);
    });

    it("extracts a whole number from '13 years'", () => {
      expect(extractExperienceYears("13 years")).toBe(13);
    });

    it("extracts a decimal from '7.5 yrs'", () => {
      expect(extractExperienceYears("7.5 yrs")).toBe(7.5);
    });

    it("handles surrounding text", () => {
      expect(
        extractExperienceYears("Senior engineer with 8 years in QA")
      ).toBe(8);
    });

    it("returns null when no experience is present", () => {
      expect(extractExperienceYears("No relevant tenure info")).toBeNull();
    });
  });

  describe("extractEmail", () => {
    it("extracts a standard email", () => {
      expect(extractEmail("Contact: abzsh05@gmail.com today")).toBe(
        "abzsh05@gmail.com"
      );
    });

    it("extracts emails with dots and plus", () => {
      expect(extractEmail("first.last+tag@sub.domain.co")).toBe(
        "first.last+tag@sub.domain.co"
      );
    });

    it("returns null when no email is present", () => {
      expect(extractEmail("no email here")).toBeNull();
    });
  });

  describe("extractPhone", () => {
    it("extracts a 10-digit Indian mobile", () => {
      expect(extractPhone("Call 9876543210 now")).toBe("9876543210");
    });

    it("extracts a +91 prefixed number", () => {
      const result = extractPhone("Phone: +91 8668169115");
      expect(result).not.toBeNull();
      expect(result?.replace(/\s/g, "")).toContain("8668169115");
    });

    it("returns null when no phone is present", () => {
      expect(extractPhone("no digits worth calling")).toBeNull();
    });
  });

  describe("exported patterns", () => {
    it("exposes EMAIL_REGEX, PHONE_REGEX, EXPERIENCE_REGEX", () => {
      expect(EMAIL_REGEX).toBeInstanceOf(RegExp);
      expect(PHONE_REGEX).toBeInstanceOf(RegExp);
      expect(EXPERIENCE_REGEX).toBeInstanceOf(RegExp);
    });
  });
});

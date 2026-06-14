import { describe, expect, it } from "vitest";

import {
  courseThumbnailInputSchema,
  normalizeCourseThumbnailUrl,
} from "./courseThumbnailUrl.js";

describe("normalizeCourseThumbnailUrl", () => {
  it("strips production host from upload paths", () => {
    expect(
      normalizeCourseThumbnailUrl(
        "https://studyzhouse.com/api/v1/uploads/course-thumbnails/7c0933d5-fa36-4a76-96f9-5249d59f4ac2.png",
      ),
    ).toBe(
      "/api/v1/uploads/course-thumbnails/7c0933d5-fa36-4a76-96f9-5249d59f4ac2.png",
    );
  });

  it("keeps youtube thumbnails", () => {
    const url = "https://i.ytimg.com/vi/abc/mqdefault.jpg";
    expect(normalizeCourseThumbnailUrl(url)).toBe(url);
  });

  it("returns null for empty", () => {
    expect(normalizeCourseThumbnailUrl(null)).toBeNull();
    expect(normalizeCourseThumbnailUrl("")).toBeNull();
  });
});

describe("courseThumbnailInputSchema", () => {
  it("accepts local upload paths", () => {
    const path =
      "/api/v1/uploads/course-thumbnails/7c0933d5-fa36-4a76-96f9-5249d59f4ac2.png";
    expect(courseThumbnailInputSchema.safeParse(path).success).toBe(true);
  });

  it("accepts external https urls", () => {
    expect(
      courseThumbnailInputSchema.safeParse("https://i.ytimg.com/vi/x/hqdefault.jpg")
        .success,
    ).toBe(true);
  });

  it("rejects invalid paths", () => {
    expect(courseThumbnailInputSchema.safeParse("/not-a-valid-path").success).toBe(
      false,
    );
  });
});

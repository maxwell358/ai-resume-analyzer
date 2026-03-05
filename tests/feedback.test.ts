import test from "node:test";
import assert from "node:assert/strict";
import { asNumber, buildCloudUrl, normalizeTip, parseJsonObject } from "../app/lib/feedback.js";

test("parseJsonObject parses plain JSON", () => {
    const parsed = parseJsonObject('{"overallScore": 92, "summary": "Solid resume"}');
    assert.ok(parsed);
    assert.equal(parsed.overallScore, 92);
    assert.equal(parsed.summary, "Solid resume");
});

test("parseJsonObject parses fenced JSON blocks", () => {
    const parsed = parseJsonObject("```json\n{\"score\": 73}\n```");
    assert.ok(parsed);
    assert.equal(parsed.score, 73);
});

test("asNumber clamps values to the 0-100 range", () => {
    assert.equal(asNumber(120), 100);
    assert.equal(asNumber(-5), 0);
    assert.equal(asNumber("80"), 80);
    assert.equal(asNumber("bad-value"), null);
});

test("normalizeTip supports string and object tips", () => {
    const fromString = normalizeTip("Add quantified impact.");
    assert.deepEqual(fromString, { type: "improve", tip: "Add quantified impact." });

    const fromObject = normalizeTip({
        type: "good",
        tip: "Strong action verbs",
        explanation: "You consistently start bullets with strong verbs.",
    });
    assert.deepEqual(fromObject, {
        type: "good",
        tip: "Strong action verbs",
        explanation: "You consistently start bullets with strong verbs.",
    });
});

test("buildCloudUrl only allows supported paths", () => {
    assert.equal(buildCloudUrl("https://example.com/file.pdf"), "https://example.com/file.pdf");
    assert.equal(buildCloudUrl("/images/resume_01.png"), "/images/resume_01.png");
    assert.equal(buildCloudUrl("/resumes/sample.pdf"), "/resumes/sample.pdf");
    assert.equal(buildCloudUrl("/private/file.pdf"), "");
});

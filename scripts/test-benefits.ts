import { BENEFITS_LIST, BENEFIT_KEYWORDS } from '../app/lib/benefits';

const extractBenefits = (text: string) => {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  // 1. Exact match against canonical list (optional but safe)
  for (const benefit of BENEFITS_LIST) {
    if (lowerText.includes(benefit.toLowerCase())) {
      found.add(benefit);
    }
  }

  // 2. Keyword mapping (fuzzy match)
  for (const [keyword, benefit] of Object.entries(BENEFIT_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      found.add(benefit);
    }
  }

  return Array.from(found);
};

const tests = [
  { text: "Wir bieten flexible Arbeitszeiten und ein Firmenhandy.", expected: ["flexible Arbeitszeiten", "Mitarbeiterhandy"] },
  { text: "Hunde sind bei uns willkommen.", expected: ["Hunde geduldet"] },
  { text: "Unser Büro hat eine Kantine und bietet Coaching an.", expected: ["Kantine", "Coaching"] },
  { text: "Wir unterstützen das Homeoffice.", expected: ["Homeoffice"] },
];

console.log("Running Benefit Extraction Tests...");

let failed = false;

tests.forEach(({ text, expected }, index) => {
  const result = extractBenefits(text);
  const missing = expected.filter(e => !result.includes(e));

  // We don't check for unexpected strictly here because some words might trigger other benefits inadvertently,
  // but we want to ensure the EXPECTED ones are present.

  if (missing.length > 0) {
      console.error(`Test ${index + 1} FAILED: "${text}"`);
      console.error(`  Expected to find: ${missing.join(', ')}`);
      console.error(`  Actually found: ${result.join(', ')}`);
      failed = true;
  } else {
      console.log(`Test ${index + 1} PASSED: Found ${result.join(', ')}`);
  }
});

console.log("\nVerifying specific keyword mappings:");
const mappingTests = [
    { input: "handy", output: "Mitarbeiterhandy" },
    { input: "flexible", output: "flexible Arbeitszeiten" },
    { input: "hund", output: "Hunde geduldet" },
    { input: "homeoffice", output: "Homeoffice" },
    { input: "internet", output: "Private Internetnutzung erlaubt" }
];

mappingTests.forEach(({ input, output }) => {
    const res = extractBenefits(input);
    if (res.includes(output)) {
        console.log(`  PASS: "${input}" -> "${output}"`);
    } else {
        console.error(`  FAIL: "${input}" -> Expected "${output}", got ${JSON.stringify(res)}`);
        failed = true;
    }
});

if (failed) {
    process.exit(1);
} else {
    console.log("\nAll tests passed!");
}

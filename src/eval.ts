import { readFile, writeFile, mkdir } from "node:fs/promises";
import { generateTestCases } from "./generator";
import { renderReport, type EvalResult } from "./report";
import type { GenerationResult } from "./schema";

type DatasetEntry = {
  requirement: string;
  acceptance_criteria: string[];
  expects_boundary_value_analysis: boolean;
  boundary_values: number[];
};

const RUNS = 3;

const dataset: DatasetEntry[] = JSON.parse(
  await readFile("evals/dataset.json", "utf-8")
);

const results: EvalResult[] = [];

for (const entry of dataset) {
  console.log(`\n=== ${entry.requirement} ===`);

  // Test the tests: does the dataset match the requirement file?
  const requirementText = await readFile(entry.requirement, "utf-8");
  const acsInRequirement = [...new Set(requirementText.match(/AC\d+/g) ?? [])];
  const datasetMatches =
    acsInRequirement.length === entry.acceptance_criteria.length &&
    acsInRequirement.every((ac) => entry.acceptance_criteria.includes(ac));
  if (!datasetMatches) {
    throw new Error(
      `Dataset does not match ${entry.requirement}. Found in file: ${acsInRequirement.join(", ")}`
    );
  }

  const passed = { coverage: 0, noUnknownAcs: 0, technique: 0, boundaryValues: 0 };
  let lastResult: GenerationResult | undefined;

  for (let run = 1; run <= RUNS; run++) {
    const result = await generateTestCases(entry.requirement);
    lastResult = result;
    const testCases = result.test_cases;

    // 1. Coverage: every AC has at least one test case
    const allCovered = entry.acceptance_criteria.every((ac) =>
      testCases.some((tc) => tc.acceptance_criteria.includes(ac))
    );
    if (allCovered) passed.coverage++;

    // 2. No unknown ACs: every AC referenced by a test case exists in the dataset
    const noUnknownAcs = testCases.every((tc) =>
      tc.acceptance_criteria.every((ac) => entry.acceptance_criteria.includes(ac))
    );
    if (noUnknownAcs) passed.noUnknownAcs++;

    // 3. Technique: BVA used if and only if expected
    const usesBva = testCases.some(
      (tc) => tc.technique === "boundary_value_analysis"
    );
    if (usesBva === entry.expects_boundary_value_analysis) passed.technique++;

    // 4. Boundary values: every expected value appears in the steps
    const stepsText = testCases.flatMap((tc) => tc.steps).join(" ");
    const allBoundariesPresent = entry.boundary_values.every((value) =>
      new RegExp(`\\b${value}\\b`).test(stepsText)
    );
    if (allBoundariesPresent) passed.boundaryValues++;

    console.log(`Run ${run}/${RUNS} done`);
  }

  console.log(`Coverage:          ${passed.coverage}/${RUNS}`);
  console.log(`No unknown ACs:    ${passed.noUnknownAcs}/${RUNS}`);
  console.log(`Technique:         ${passed.technique}/${RUNS}`);
  console.log(`Boundary values:   ${passed.boundaryValues}/${RUNS}`);

  results.push({
    requirement: entry.requirement,
    runs: RUNS,
    passed,
    lastResult: lastResult!,
  });
}

await mkdir("reports", { recursive: true });
await writeFile("reports/report.html", renderReport(results));
console.log("\nReport written to reports/report.html");
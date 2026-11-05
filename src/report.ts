import type { GenerationResult } from "./schema";

export type EvalResult = {
  requirement: string;
  runs: number;
  passed: {
    coverage: number;
    noUnknownAcs: number;
    technique: number;
    boundaryValues: number;
  };
  lastResult: GenerationResult;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function score(passed: number, runs: number): string {
  const cssClass = passed === runs ? "pass" : "fail";
  return `<span class="${cssClass}">${passed}/${runs}</span>`;
}

export function renderReport(results: EvalResult[]): string {
  const sections = results
    .map(
      (r) => `
    <section>
      <h2>${escapeHtml(r.requirement)}</h2>
      <table>
        <tr><td>Coverage</td><td>${score(r.passed.coverage, r.runs)}</td></tr>
        <tr><td>No unknown ACs</td><td>${score(r.passed.noUnknownAcs, r.runs)}</td></tr>
        <tr><td>Technique</td><td>${score(r.passed.technique, r.runs)}</td></tr>
        <tr><td>Boundary values</td><td>${score(r.passed.boundaryValues, r.runs)}</td></tr>
      </table>

      <h3>Open questions</h3>
      <ul>
        ${r.lastResult.open_questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}
      </ul>

      <h3>Test cases (last run)</h3>
      ${r.lastResult.test_cases
        .map(
          (tc) => `
        <article class="card">
          <h4>${escapeHtml(tc.id)}: ${escapeHtml(tc.title)}</h4>
          <p class="meta">${escapeHtml(tc.acceptance_criteria.join(", "))} · ${tc.technique} · ${tc.priority}</p>
          <ol>${tc.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
          <p><strong>Expected:</strong> ${escapeHtml(tc.expected_result)}</p>
        </article>`
        )
        .join("")}
    </section>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Eval report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .pass { color: green; font-weight: bold; }
    .fail { color: crimson; font-weight: bold; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .meta { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Eval report</h1>
  <p>Generated ${new Date().toLocaleString("nb-NO")}</p>
  ${sections}
</body>
</html>`;
}
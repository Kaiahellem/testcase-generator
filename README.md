# AI Test Case Generator

Generates structured test cases from requirements using Azure OpenAI — and automatically evaluates the quality of what the AI produces.

## Why

AI can produce test cases in seconds. But a test case generator is only useful if you can trust its output. This project treats the AI as a system under test: every generated test case is checked against a test set with known expectations, across multiple runs, because the model doesn't answer the same way twice.

## How it works

```
requirement (.md)  →  system prompt  →  Azure OpenAI (gpt-5-mini)  →  test cases + open questions
                                         with strict JSON schema
```

- **Requirements** are Markdown files with acceptance criteria IDs (`AC1`, `AC2` …), kept separate from the code as test data.
- **The system prompt** lives in `prompts/system.md` and is versioned in Git (prompt as code).
- **Structured outputs** with a strict JSON schema guarantee the format: fixed fields, fixed technique values, no invented fields.
- **Open questions:** instead of guessing when a requirement is vague, the model lists ambiguities and uncovered input classes — the questions a tester would ask the product owner.

## Evaluation

The test set contains three requirements, each chosen to test a specific behaviour:

| Requirement | What it tests |
|---|---|
| Login | Uses equivalence partitioning, and does *not* use boundary value analysis when there is no boundary |
| Cart quantity (1–10) | Uses boundary value analysis and includes the values 0, 1, 10, 11 |
| Product search | Stays within the requirement instead of inventing features |

Each requirement is run 3 times. Four checks run on every result:

| Check | Question |
|---|---|
| Coverage | Does every acceptance criterion have at least one test case? |
| No unknown ACs | Does any test case reference an acceptance criterion that doesn't exist? |
| Technique | Is boundary value analysis used if — and only if — the requirement has a boundary? |
| Boundary values | Are all expected boundary values present in the steps? |

Before running, the evaluation also verifies that the expected results in `evals/dataset.json` match the acceptance criteria in the requirement files — the oracle is tested too.

**Testing the evaluator:** to make sure the checks can actually fail, I injected known errors (a non-existent `AC4` in the dataset, a wrong technique expectation) and confirmed that both were detected.

### Results

| Requirement | Coverage | No unknown ACs | Technique | Boundary values |
|---|---|---|---|---|
| Login | 3/3 | 3/3 | 3/3 | 3/3 |
| Cart quantity | 3/3 | 3/3 | 3/3 | 3/3 |
| Product search | 3/3 | 3/3 | 3/3 | 3/3 |

`npm run eval` also produces an HTML report with scores, test cases and open questions.

## Findings along the way

Early manual testing in the Azure AI Foundry playground revealed problems that shaped the design:

- **Format drift:** two runs of the same requirement gave different IDs, field values and technique names. → Solved with a strict JSON schema and enums.
- **Wrong technique labels:** empty fields were labelled "boundary value analysis". An empty field is its own equivalence class, not a boundary. → Prompt rule: only use BVA when the requirement defines a boundary.
- **Guessing on vague requirements:** expected results contained "(or equivalent)" and "e.g." because the requirement didn't specify error texts or URLs. → The model now adds an open question instead of guessing.
- **A flaw in my own schema:** one test case can cover several acceptance criteria, but the schema only allowed one. → Changed to a list.

## Design decisions

- **Deployment type:** Global Standard for this demo. For real customer data I would use Data Zone (EU) for GDPR reasons.
- **Deployment name in `.env`**, not in code, so the model can be swapped without code changes.
- **AI output is untrusted input:** all model output is HTML-escaped in the report to prevent XSS.
- **Cost control:** budget alert set in Azure Cost Management.

## Limitations

- The checks measure structure and coverage, not whether expected results are concrete or whether test cases outside the requirement were added under a valid AC.
- Boundary values are matched as text in the steps, which is a simple heuristic.
- The test set is small (3 requirements, 3 runs each).
- The output format is defined twice (JSON schema and TypeScript type).

## Next steps

- **Mutation testing:** run the generated boundary values against a reference implementation and mutants (e.g. `>` instead of `>=`) to measure whether the tests actually catch bugs — not just whether they mention the right values.
- **LLM-as-judge** to evaluate how concrete the expected results are.
- **Zod** to define the format once.
- **Azure AI Foundry Evaluations** for built-in metrics.
- **GitHub Actions** to run the evaluation when the prompt changes.
- **Interactive UI** with a small backend, so the API key never reaches the browser.

## Getting started

Requires Node 18+ and an Azure OpenAI deployment.

```bash
npm install
cp .env.example .env   # fill in your own values
npm run generate -- requirements/login.md
npm run eval
open reports/report.html
```
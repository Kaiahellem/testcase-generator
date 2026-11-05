export const testCaseSchema = {
  type: "object",
  properties: {
    test_cases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          acceptance_criteria: { type: "array", items: { type: "string" } },
          preconditions: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          expected_result: { type: "string" },
          technique: {
            type: "string",
            enum: [
              "equivalence_partitioning",
              "boundary_value_analysis",
              "decision_table",
              "state_transition",
                ],
            },
            priority: {
                type: "string",
                enum: [
                    "high",
                    "medium",
                    "low"
                ]
            }
        },
        required: [
          "id",
          "title",
          "acceptance_criteria",
          "preconditions",
          "steps",
          "expected_result",
          "technique",
          "priority",
        ],
        additionalProperties: false,
      },
    },
    open_questions: { type: "array", items: { type: "string" } },
  },
  required: ["test_cases", "open_questions"],
  additionalProperties: false,
};
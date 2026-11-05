import { generateTestCases } from "./generator";

const requirementPath = process.argv[2] ?? "requirements/login.md";
const result = await generateTestCases(requirementPath);

console.log(JSON.stringify(result, null, 2));
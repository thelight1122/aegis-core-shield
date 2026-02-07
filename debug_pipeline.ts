import { processPrompt, IDSResult } from './src/shared/main/ids-processor';

const prompt = "Please analyze the Mars Rover tomorrow.";
const result = processPrompt(prompt) as IDSResult;
console.log('Observations:', JSON.stringify(result.observations, null, 2));
console.log('Analysis:', JSON.stringify(result.analysis, null, 2));

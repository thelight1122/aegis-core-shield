import { discernmentGate } from './src/shared/main/discernment-gate';

const prompt = "This is a statement of fact for consideration.";
const result = discernmentGate(prompt);
console.log(JSON.stringify(result, null, 2));

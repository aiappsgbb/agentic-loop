import { analyze } from './analysis';
import { recommendWorkshop } from '../src/data/workshop';

const brief = 'Help a fictional community center schedule shared telescopes fairly across volunteer teams.';
const coverage = recommendWorkshop(brief);
const result = await analyze({
  brief, gaps: coverage.gaps, coveredRequirementIds: [],
}, new AbortController().signal);
console.log(`Live SDK smoke passed: ${result.suggestions.length} validated suggestions; ${result.questions.length} review questions.`);

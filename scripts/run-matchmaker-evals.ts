/** Dev harness: run the matchmaker eval suite standalone. */
import { runAllEvals } from '../src/lib/matchmakerEvals';

let failed = 0;
for (const { case_, result } of runAllEvals()) {
  if (!result.pass) failed++;
  console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${case_.id}: ${result.detail}`);
}
console.log(failed ? `${failed} FAILED` : 'all evals pass');
process.exit(failed ? 1 : 0);

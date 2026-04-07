function testLogic(searchKeyword, excludeKeyword, memo) {
  if (!searchKeyword) return true; // simplified for test

  const searchKeywords = searchKeyword.split(',').map(k => k.trim().toUpperCase()).filter(k => k.length > 0);
  const excludeKeywords = excludeKeyword ? excludeKeyword.split(',').map(k => k.trim().toUpperCase()).filter(k => k.length > 0) : [];

  const memoUpper = memo.toUpperCase();
  
  const matchesSearch = searchKeywords.length === 0 || searchKeywords.every(k => memoUpper.includes(k));
  if (!matchesSearch) return false;

  const matchesExclude = excludeKeywords.length > 0 && excludeKeywords.some(k => memoUpper.includes(k));
  if (matchesExclude) return false;

  return true;
}

const cases = [
  { s: "NET, BOLETO", e: "", m: "PAGAMENTO NET BOLETO", expected: true, desc: "AND Search match" },
  { s: "NET, BOLETO", e: "", m: "PAGAMENTO NET", expected: false, desc: "AND Search partial mismatch" },
  { s: "NET", e: "ESTORNO, REFUND", m: "PAGAMENTO NET", expected: true, desc: "Exclude OR match (no hit)" },
  { s: "NET", e: "ESTORNO, REFUND", m: "ESTORNO NET", expected: false, desc: "Exclude OR match (hit first)" },
  { s: "NET", e: "ESTORNO, REFUND", m: "REFUND NET", expected: false, desc: "Exclude OR match (hit second)" },
  { s: " NET , BOLETO ", e: " ", m: "NET BOLETO", expected: true, desc: "Trim check" },
];

let failed = 0;
cases.forEach(c => {
  const result = testLogic(c.s, c.e, c.m);
  if (result !== c.expected) {
    console.error(`FAILED: ${c.desc}. Expected ${c.expected}, got ${result}`);
    failed++;
  } else {
    console.log(`PASSED: ${c.desc}`);
  }
});

process.exit(failed > 0 ? 1 : 0);

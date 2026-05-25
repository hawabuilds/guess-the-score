import { FIXTURES, type Fixture } from "../app/data/fixtures";
import {
  getTeamAliases,
  matchTeamsInOrder,
  parsePrediction,
  type ParsedPrediction,
} from "./predictionParser";

type TestCase = {
  name: string;
  reply: string;
  fixture: Pick<Fixture, "home" | "away">;
  expected: ParsedPrediction | null;
};

function fixture(home: string, away: string): Pick<Fixture, "home" | "away"> {
  const found = FIXTURES.find((item) => item.home === home && item.away === away);
  if (!found) throw new Error(`Missing fixture: ${home} vs ${away}`);
  return found;
}

const CASES: TestCase[] = [
  {
    name: "valid: home score away with hyphen",
    reply: "Brazil 2-1 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: colon separator",
    reply: "Brazil 2:1 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: spaced separator",
    reply: "Brazil 2 - 1 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: case insensitive",
    reply: "brazil 3-0 morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 3, awayScore: 0 },
  },
  {
    name: "valid: extra punctuation and words",
    reply: "Going with Brazil, 2-1, Morocco tonight!",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: USA alias",
    reply: "United States 2-1 Paraguay",
    fixture: fixture("USA", "Paraguay"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: US alias",
    reply: "US 1-0 Paraguay",
    fixture: fixture("USA", "Paraguay"),
    expected: { homeScore: 1, awayScore: 0 },
  },
  {
    name: "valid: Bosnia alias",
    reply: "Canada 2-1 Bosnia",
    fixture: fixture("Canada", "Bosnia & Herzegovina"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: Bosnia and Herzegovina full alias",
    reply: "Canada 1-1 Bosnia and Herzegovina",
    fixture: fixture("Canada", "Bosnia & Herzegovina"),
    expected: { homeScore: 1, awayScore: 1 },
  },
  {
    name: "valid: Cabo Verde alias",
    reply: "Spain 3-2 Cabo Verde",
    fixture: fixture("Spain", "Cape Verde"),
    expected: { homeScore: 3, awayScore: 2 },
  },
  {
    name: "valid: score before teams but names in order",
    reply: "2-1 Brazil Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "valid: nil-nil",
    reply: "Argentina 0-0 Algeria",
    fixture: fixture("Argentina", "Algeria"),
    expected: { homeScore: 0, awayScore: 0 },
  },
  {
    name: "valid: max score 20",
    reply: "Mexico 20-19 South Africa",
    fixture: fixture("Mexico", "South Africa"),
    expected: { homeScore: 20, awayScore: 19 },
  },
  {
    name: "valid: reversed team order maps scores to teams",
    reply: "Morocco 2-1 Brazil",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 1, awayScore: 2 },
  },
  {
    name: "valid: away team first with score before names",
    reply: "Morocco vs Brazil 2-1",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 1, awayScore: 2 },
  },
  {
    name: "valid: away-first winner for Brazil vs Argentina",
    reply: "Argentina 2-0 Brazil",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 0, awayScore: 2 },
  },
  {
    name: "adjacent: Brazil 3-1 Argentina",
    reply: "Brazil 3-1 Argentina",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 3, awayScore: 1 },
  },
  {
    name: "adjacent: reversed order Argentina 1-3 Brazil",
    reply: "Argentina 1-3 Brazil",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 3, awayScore: 1 },
  },
  {
    name: "adjacent: draw Brazil 1-1 Argentina",
    reply: "Brazil 1-1 Argentina",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 1, awayScore: 1 },
  },
  {
    name: "adjacent: draw reversed Argentina 1-1 Brazil",
    reply: "Argentina 1-1 Brazil",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 1, awayScore: 1 },
  },
  {
    name: "adjacent: draw 0-0 Brazil vs Argentina",
    reply: "Brazil 0-0 Argentina",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 0, awayScore: 0 },
  },
  {
    name: "adjacent: draw 2-2 reversed Argentina 2-2 Brazil",
    reply: "Argentina 2-2 Brazil",
    fixture: fixture("Brazil", "Argentina"),
    expected: { homeScore: 2, awayScore: 2 },
  },
  {
    name: "reject: bare score only",
    reply: "2-1",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: missing away team",
    reply: "Brazil 2-1",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: missing home team",
    reply: "2-1 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: only one team name",
    reply: "Brazil wins tonight",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: score out of range",
    reply: "Brazil 21-0 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: negative score",
    reply: "Brazil -1-0 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: junk text",
    reply: "Great match!!!",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "reject: wrong fixture pairing",
    reply: "Brazil 2-1 Morocco",
    fixture: fixture("Spain", "Cape Verde"),
    expected: null,
  },
  {
    name: "reject: decimal score",
    reply: "Brazil 2.5-1 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  // Real-world X reply patterns
  {
    name: "real: split score around team names",
    reply: "Brazil 2 Morocco 1",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "real: extra words before, lowercase",
    reply: "i think brazil 2-1 morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "real: emojis after",
    reply: "Brazil 2-1 Morocco 🔥🔥",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "real: all caps",
    reply: "BRAZIL 2-1 MOROCCO",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "real: no spaces around score",
    reply: "Brazil2-1Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "real: United States full name",
    reply: "United States 0-0 Paraguay",
    fixture: fixture("USA", "Paraguay"),
    expected: { homeScore: 0, awayScore: 0 },
  },
  {
    name: "real: two matches mentioned — parse target fixture only",
    reply: "Brazil 2-1 Morocco and Spain 1-0",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 2, awayScore: 1 },
  },
  {
    name: "real: missing away team name",
    reply: "Brazil won 2-1",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
  {
    name: "real: high score within range",
    reply: "Brazil 10-1 Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: { homeScore: 10, awayScore: 1 },
  },
  {
    name: "real: written numbers not digits",
    reply: "Brazil one - nil Morocco",
    fixture: fixture("Brazil", "Morocco"),
    expected: null,
  },
];

function samePrediction(
  actual: ParsedPrediction | null,
  expected: ParsedPrediction | null,
): boolean {
  if (actual === null && expected === null) return true;
  if (!actual || !expected) return false;
  return actual.homeScore === expected.homeScore && actual.awayScore === expected.awayScore;
}

function run(): void {
  let passed = 0;
  let failed = 0;

  console.log("predictionParser tests\n");

  for (const testCase of CASES) {
    const actual = parsePrediction(testCase.reply, testCase.fixture);
    const ok = samePrediction(actual, testCase.expected);

    if (ok) {
      passed += 1;
      console.log(`PASS  ${testCase.name}`);
    } else {
      failed += 1;
      console.log(`FAIL  ${testCase.name}`);
      console.log(`      reply:   ${JSON.stringify(testCase.reply)}`);
      console.log(`      fixture: ${testCase.fixture.home} vs ${testCase.fixture.away}`);
      console.log(`      expected: ${JSON.stringify(testCase.expected)}`);
      console.log(`      actual:   ${JSON.stringify(actual)}`);
    }
  }

  console.log("\nTeam matcher smoke checks");
  const bothTeams = matchTeamsInOrder("Brazil 2-1 Morocco", fixture("Brazil", "Morocco"));
  const reversedTeams = matchTeamsInOrder("Morocco 2-1 Brazil", fixture("Brazil", "Morocco"));
  console.log(bothTeams ? "PASS  matchTeamsInOrder finds both teams" : "FAIL  matchTeamsInOrder finds both teams");
  console.log(
    reversedTeams ? "PASS  matchTeamsInOrder finds reversed teams" : "FAIL  matchTeamsInOrder finds reversed teams",
  );
  if (!bothTeams) failed += 1;
  else passed += 1;
  if (!reversedTeams) failed += 1;
  else passed += 1;

  console.log("\nAlias coverage");
  console.log(`USA aliases include United States: ${getTeamAliases("USA").includes("United States")}`);
  console.log(
    `Cape Verde aliases include Cabo Verde: ${getTeamAliases("Cape Verde").includes("Cabo Verde")}`,
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run();

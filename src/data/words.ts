import type { Word } from '../types'

const RAW = `
1|Abbreviate|shorten, reduce, condense
1|Abundant|ample, plenty, large quantities
1|Abode|residence, house, home
1|Abrupt|brief, blunt, rude
1|Absolute|complete, full, entire
1|Accentuate|emphasize, highlight, focus on
1|Adequate|sufficient, enough, passable
1|Adorn|embellish, enhance, garnish
1|Advisable|prudent, wise, expedient
1|Affirm|assert, claim, contend
1|Aghast|fearful, afraid, scared
1|Agenda|calendar, schedule, plan
1|Agile|athletic, energetic, lively
1|Ailment|illness, disease, sickness
1|Aloof|standoffish, detached, haughty
2|Ambassador|representative, emissary, delegate
2|Amiable|friendly, pleasant, warmhearted
2|Ample|abundant, plentiful, sufficient
2|Anatomy|structure, breakdown, framework
2|Annex|extension, addition, wing
2|Antagonist|enemy, opponent, competitor
2|Appease|satisfy, pacify, calm
2|Ardent|passionate, fervent, impassioned
2|Arid|dry, parched, moisture-less
2|Aspire|aim, hope, strive
2|Barren|desolate, empty, unproductive
2|Bias|favoritism, partiality, preference
2|Bide|endure, persist, hold on
2|Blight|blemish, flaw, defect
2|Bliss|gladness, joy, euphoria
3|Boast|brag, self-congratulate, flaunt
3|Bombard|attack, barrage, pummel, flood
3|Buoyant|lighthearted, cheerful, joyful
3|Calamity|disaster, tragedy, mishap
3|Camouflage|disguise, mask, coverup
3|Catapult|throw, cast, hurl
3|Certify|approve, authorize, authenticate
3|Charter|hire, rent, lease
3|Cherish|appreciate, treasure, value
3|Classification|category, group, division
3|Clinch|secure, confirm, settle
3|Collision|crash, impact, strike
3|Colossal|very large, enormous, gigantic
3|Coma|deep unconsciousness, stupor, deep sleep
3|Compel|coerce, force, obligate
4|Competent|able, capable, fit
4|Concise|to the point, succinct, brief
4|Confer|award, grant, give to
4|Conditional|dependent, subject to, based on
4|Controversial|disputed, questionable, at issue
4|Corrosive|wearing away, consuming, destructive
4|Cruelty|barbarity, savagery, brutality
4|Cumbersome|awkward, clumsy, clunky
4|Custom|ritual, policy, routine
4|Decent|respectable, appropriate, proper
4|Décor|furnishings, ornamentation, decoration
4|Deduction|conclusion, answer, inference
4|Defective|imperfect, flawed, faulty
4|Deliberate|intentional, purposeful, planned
4|Depart|exit, leave, evacuate
5|Depiction|drawing, illustration, representation
5|Deprive|deny, strip, dispossess
5|Derive|obtain, get, acquire
5|Destitute|poor, impoverished, bankrupt
5|Detain|arrest, apprehend, hinder
5|Detest|hate, despise, loathe
5|Devout|dedicated, devoted, faithful
5|Devour|eat quickly, consume, swallow
5|Dialogue|talk, communication, conversation
5|Diminish|lessen, decline, decrease
5|Discard|cancel, abandon, get rid of
5|Disdain|hate, indifference, scorn
5|Distort|twist, warp, misrepresent
5|Divisive|disruptive, at odds, conflicting
5|Doctrine|belief, principle, teaching
6|Duration|period, extent, lifespan
6|Eclipse|outmatch, exceed, surpass
6|Effective|productive, efficient, compelling
6|Eligible|allowed, acceptable, worthy
6|Embezzle|steal money, misuse, thieve
6|Endeavor|attempt to achieve, effort, struggle
6|Enclosure|yard, courtyard, patio
6|Enthusiastic|excited, eager, passionate
6|Epidemic|pandemic, plague, infection
6|Equality|parity, sameness, similarity
6|Evict|throw out, remove, expel
6|Exaggerated|overstated, far-fetched, unrealistic
6|Exclusive|exclusionary, restricted, unshared
6|Exult|rejoice, celebrate, cheer
6|Extinct|gone, expired, dead
7|Extract|remove, draw out, extricate
7|Facility|institution, building, establishment
7|Falter|stumble, hesitate, waver
7|Feeble|weak, ineffective, puny
7|Fixture|icon, institution, symbol
7|Flourish|grow, prosper, multiply
7|Foresee|anticipate, predict, foretell
7|Fortitude|boldness, bravery, strength of mind
7|Fraud|fake, imposter, sham
7|Frolic|play, skip, rollick
7|Frustrate|prevent, annoy, irritate
7|Fugitive|runaway, refugee, deserter
7|Gaudy|flashy, noisy, loud
7|Genuine|authentic, real, actual
7|Gloat|brag, boast, relish
8|Grapple|wrestle, fight, contend with
8|Grave|serious, gloomy, somber
8|Guttural|hoarse, gruff, growling
8|Haphazard|unplanned, careless, random
8|Hereditary|inherited, genetic, innate
8|Hindrance|obstacle, hurdle, obstruction
8|Honorary|token, nominal, commemorative
8|Hospitable|gracious, friendly, kind
8|Humane|compassionate, sympathetic, considerate
8|Immune|invulnerable, resistant, unaffected
8|Impart|communicate, convey, give
8|Inability|ineffectiveness, incapacity, lack of ability
8|Incentive|motivation, inducement, enticement
8|Incense|anger, infuriate, enrage
8|Indulge|satisfy, spoil, nourish
9|Infantile|childish, immature, adolescent
9|Inference|conclusion, deduction, reasoning
9|Initial|beginning, primary, basic
9|Inspiration|creativity, ingenuity, innovation
9|Integrate|combine, merge, blend
9|Intricate|complicated, elaborate, complex
9|Intrude|interfere, invade, meddle
9|Irate|very annoyed, angry, furious
9|Jeer|mock, taunt, ridicule
9|Jovial|happy, lighthearted, cheerful
9|Keen|piercing, eager, intense
9|Kin|family, clan, relation
9|Lament|mourn, grieve, regret
9|Lapse|setback, fault, error
9|Legible|understandable, plain, clear
10|Lecture|lesson, speech, sermon
10|Ledger|journal, record, register
10|Lofty|elevated, soaring, high
10|Maneuver|guide, scheme, navigate
10|Meager|scarce, slim, sparse
10|Memorandum|directive, memo, notice
10|Miscellaneous|assorted, varied, diverse
10|Mosaic|collage, patchwork, montage
10|Multitude|mass, abundance, drove
10|Mystify|perplex, confuse, baffle
10|Naturalize|make a citizen, enfranchise, absorb
10|Neutral|indifferent, impartial, objective
10|Nomad|roamer, drifter, traveler
10|Notorious|infamous, well known, fabled
10|Nourish|feed, sustain, maintain
11|Novel|new, original, unique
11|Nuisance|annoyance, irritant, problem
11|Observatory|lookout, lookout station, observation tower
11|Obstinate|stubborn, determined, headstrong
11|Omit|exclude, leave out, delete
11|Ornate|fancy, elaborate, elegant
11|Optical|visual, seeing, related to sight
11|Pacify|appease, placate, smooth over
11|Pantomime|gesture, show, mime
11|Parasite|hanger-on, barnacle, leech
11|Pedigree|ancestry, bloodline, descent
11|Periodical|occasional, regular, recurring
11|Pester|bother, harass, annoy
11|Perturb|dismay, upset, alarm
11|Plateau|highland, plain, flat land
12|Ponder|consider, contemplate, think about
12|Precipice|cliff, height, bluff
12|Precaution|carefulness, safety measure, protection
12|Predicament|bind, dilemma, jam
12|Prose|essay, speech, written text
12|Prosperous|successful, thriving, wealthy
12|Protrude|stick out, jut, project
12|Provisional|temporary, short-term, interim
12|Provoke|make angry, aggravate, irritate
12|Pulverize|grind, pound, crush
12|Quake|agitate, shake, jolt
12|Quarantine|isolate, seclude, separate
12|Quizzical|puzzled, curious, mocking
12|Quota|allotment, allowance, portion
12|Ravenous|very hungry, famished, insatiable
13|Recede|withdraw, diminish, decrease
13|Reluctant|hesitant, unsure, disinclined
13|Renegade|traitor, rebel, defector
13|Repeal|abolish, cancel, dismantle
13|Reprieve|pardon, suspension, truce
13|Resourceful|inventive, imaginative, clever
13|Respectable|honorable, trustworthy, worthy
13|Restore|fix, make new, improve
13|Revelation|discovery, announcement, news
13|Revere|admire, adore, worship
13|Rouse|wake up, stir, excite
13|Sacrifice|give up, surrender, lose
13|Sanctuary|haven, oasis, holy place
13|Sentimental|emotional, nostalgic, tender
13|Serene|calm, undisturbed, easygoing
14|Sever|cut apart, detach, separate
14|Scarce|insufficient, limited, sparse
14|Signify|mean, signal, indicate
14|Siphon|drain, pump, tap
14|Sly|clever, devious, smart
14|Solitary|alone, separate, remote
14|Spectacle|performance, display, showy event
14|Spectator|observer, onlooker, watcher
14|Specification|definition, description, detailing
14|Splice|braid, mesh, combine
14|Stealthy|secretive, hidden, private
14|Strenuous|difficult, demanding, tiring
14|Strategy|plan of action, approach, method
14|Stifle|hold back, restrain, smother
14|Subdue|control, overpower, defeat
15|Sullen|gloomy, bad-tempered, pouting
15|Superfluous|extra, unnecessary, expendable
15|Synopsis|summary, outline, rundown
15|Tamper|interfere, alter, damage
15|Technique|method, approach, tactic
15|Temper|bad mood, anger, fury
15|Tempo|beat, rhythm, meter
15|Tendency|habit, likelihood, proneness
15|Testament|testimony, witness, evidence
15|Timid|shy, bashful, modest
15|Torrid|hot, scorching, blistering
15|Toxic|harmful, dangerous, poisonous
15|Transmission|communication, dispatch, circulation
15|Transplant|transfer, relocate, move
15|Trivial|unimportant, insignificant, meaningless
16|Tuition|fee, charge, price
16|Tundra|prairie, flatland, open country
16|Unanimous|in agreement, unified, uncontested
16|Universal|common, general, found everywhere
16|Upholster|pad, protect, cushion
16|Unique|distinct, special, individual
16|Unison|harmony, agreement, accord
16|Vacant|empty, unoccupied, deserted
16|Vaccine|inoculation, injection, shot
16|Vengeance|payback, retaliation, revenge
16|Verdict|decision, opinion, judgment
16|Veto|reject, forbid, overrule
16|Virtue|honesty, character, excellence
16|Vigor|strength, energy, stamina
16|Vile|offensive, horrible, appalling
17|Visible|clear, conspicuous, apparent
17|Vocal|verbal, expressed, opinionated
17|Vouch|attest, certify, support
17|Wane|diminish, lessen, decrease
17|Wary|careful, cautious, attentive
17|Witty|funny, clever, amusing
17|Woe|suffering, sorrow, sadness
17|Wrath|anger, fury, hatred
17|Wretched|miserable, very bad, distressed
17|Zeal|enthusiasm, devotion, intensity
`.trim()

function slug(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

export const WORDS: Word[] = RAW.split('\n').map((line) => {
  const [setRaw, word, synRaw] = line.split('|')
  return {
    id: slug(word),
    word,
    synonyms: synRaw.split(',').map((s) => s.trim()),
    set: Number(setRaw),
  }
})

export const SET_COUNT = 17
export const TOTAL_WORDS = WORDS.length

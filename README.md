# ISEE Vocab Study

A static, Quizlet-style study site for the 250-word ISEE list. There is no server and no account. Progress, stars, and high scores stay in this browser via `localStorage`.

## Sets

- Sets 1–17 from the study list
- All 250 words

Each card is a word and its synonyms.

## Modes

- **Flashcards** — flip, shuffle, star, word-first or synonyms-first
- **Learn** — adaptive multiple choice, true/false, write, and spell
- **Test** — graded mix of question types
- **Match** — timed pairing
- **Blocks** — answer questions to earn pieces and clear lines
- **Blast** — solo asteroid game (click the matching answer)

## Run locally

```bash
npm install
npm run dev
```

## Static build

```bash
npm run build
```

The `dist/` folder is a static site. Hash routes (`#/sets/1/flashcards`) work on GitHub Pages and other static hosts.

# Development and data notes

## Source layout

| Path                        | Responsibility                                                                  |
| --------------------------- | ------------------------------------------------------------------------------- |
| `App.tsx`                   | Responsive shell, navigation, and language switch                               |
| `src/screens/`              | Overview, lessons, simulator, forecast lab, resource library                    |
| `src/components/ui.tsx`     | Shared visual components, charts, formatting, error messages                    |
| `src/domain/engine.ts`      | Pure order/accounting, corporate-action primitives, valuation, reconciliation   |
| `src/domain/forecast.ts`    | Prediction locking and absolute-error evaluation                                |
| `src/storage/repository.ts` | Schema version 1, ledger persistence, transaction boundary, revision checks     |
| `src/storage/database.ts`   | Expo SQLite opening, transactional seeding, persisted price-cache loading       |
| `src/storage/state.tsx`     | Local application state and serialized writes                                   |
| `src/data/learning.ts`      | Bilingual lessons, reviewed questions, source mappings, resource cards          |
| `src/data/instruments.json` | Approved 10 Taiwan + 10 US instruments                                          |
| `src/data/demo-prices.json` | Generated synthetic OHLCV in integer minor units                                |
| `src/data/forecasts.json`   | Precomputed synthetic-data forecasts                                            |
| `scripts/`                  | Fixture generation, model training, staged CSV import and Python tests          |
| `tests/`                    | Accounting, SQLite rollback, data integrity, forecast, lesson interaction tests |
| `data/legacy/`              | Original quiz extraction for review; excluded from the app bundle               |

## Persistence

The first build stores a versioned application snapshot for learning and session state, plus an independently queryable append-only trade journal. Saving both happens in one SQLite transaction. Portfolio updates must pass cash/share/cost and realized-profit reconciliation. Loading and saving verify that active portfolios match their journal entries. Existing trades cannot be removed or rewritten, and resetting a replay retains its old journal under its old session ID. Revision checks reject a stale writer rather than overwriting another window's save. Databases from newer schema versions are rejected without downgrading them.

Market data has normalized dataset, instrument, and daily-price tables. The app seeds the bundled fixture once, then loads its persisted prices into a read cache. The active dataset remains `synthetic-v1`; external staging databases cannot silently replace it.

Quiz attempts record the answer, correctness, question version, time, and language. Older version-1 snapshots without attempt history remain readable; previous answers are preserved without inventing historical attempts. The lesson screen shows the latest five attempts for its question while retaining all attempts in storage. Repository saves enforce append-only quiz history and allow locked forecasts only to transition to revealed.

The current state snapshot is deliberately small. Future accounts, normalized learning-history tables, and synchronization will require further schema migrations and an explicit conflict policy. SQLite/PostgreSQL synchronization is not automatic.

## Import a permitted CSV

The importer makes **no network requests**. Give it a file whose acquisition and intended use you have authorized. For each record:

```csv
instrument_id,date,open,high,low,close,volume
TW:2330,2024-01-02,100.10,102.20,99.90,101.20,1000
US:AAPL,2024-01-02,150.00,152.00,149.00,151.00,2000
```

The rows above are invented examples. Input prices are decimal currency amounts; output prices are integer hundredths. Dates use `YYYY-MM-DD` in the exchange's local session calendar. Instrument IDs must match `src/data/instruments.json`.

```sh
npm run data:import -- \
  --csv data/private/prices.csv \
  --output data/private/history.db \
  --dataset-id licensed-review-v1 \
  --source "Provider and delivery reference" \
  --license-note "Reference to permission for the intended uses"
```

Use `--kind synthetic` for an authored fixture. The default kind is `historical`.

The importer rejects unknown instruments, duplicate instrument/date pairs, invalid dates, inconsistent OHLC ranges, invalid volume, excess precision, and unsafe integer amounts. It records the source-file SHA-256 and metadata. Repeating identical input is a no-op; changed input or metadata requires a new dataset ID.

Every imported dataset starts with `replay_eligible = 0`. This staging schema is separate from the app database. It does **not** verify a license, certify trading-calendar completeness, or import corporate actions. Do not simply change the flag to enable replay. The next integration milestone must validate calendars, splits, dividend entitlements and pay dates, missing sessions, and scenario coverage, then package an approved app-compatible version with corresponding forecasts.

The app does not scrape TWSE or call a paid API. Provider selection, credentials, and redistribution permissions remain external dependencies.

## Forecast experiment

`scripts/train_forecasts.py` uses a fixed `StandardScaler` + `Ridge(alpha=10)` pipeline. Features are the five trailing daily returns; targets are one- or five-session returns. Each cutoff is fitted separately on up to approximately 180 prior observations, and all training labels end at or before that cutoff. Scaling is fitted only to those training rows.

The first fixture contains 13 cutoffs per instrument in early 2025, two horizons, and 20 instruments: 520 forecasts. No real prices were used. The model is a functional learning experiment, not a validated investment model. The no-change baseline is evaluated alongside it.

The future-data test changes all prices after a cutoff and asserts the prediction is unchanged. The UI stores a learner's prediction before enabling reveal, and evaluation requires a revealed attempt. All future fixture values still exist locally, so this is an educational reveal mechanism, not a cheating-resistant competition.

## Local verification

```sh
npm run check
npm run test:models
npm run format:check
npm run export:native
```

`npm run test:models` requires the local Python virtual environment described in the README. It is separate so a normal JavaScript install can run the app and its core checks without Python ML dependencies.

Manual checks for native device follow-up:

- Launch on each platform and verify SQLite initialization, restart persistence, and language detection.
- Buy, partially sell, reject insufficient cash/holdings, and verify no duplicate fill on rapid taps.
- Switch markets and confirm independent wallets; reset one and preserve the other.
- Complete a lesson, switch language, and confirm progress remains.
- Open an external resource, bookmark it, and explicitly mark it read.
- Lock a forecast, restart, reveal, and confirm the original prediction remains unchanged.
- Check keyboard behavior, safe areas, large text, and screen-reader navigation.

An Expo native export verifies bundling, not runtime device behavior, signing, or store readiness.

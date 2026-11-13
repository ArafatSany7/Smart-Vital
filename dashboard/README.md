# dashboard: clinician dashboard (R1, R4, R5, R6, R8, R9, R10)

The clinician-facing part of Smart Vitals. A clinician signs in, sees only the patients assigned to them, watches each patient's vital signs update live, is alerted when a reading is Critical, reviews trends and history, and sets alert thresholds per patient.

All data is simulated in the browser. No real patient data is used at any stage.

## Run it

Requires Node.js 20 or later.

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000 for the landing page, which explains the system with a scroll-driven 3D story. Choose **Sign in** and use a demo account. The login screen lists them and fills the form for you. The dashboard itself is at `/dashboard`.

| Clinician | Email | Passcode |
|---|---|---|
| Dr Amara Okafor | `amara.okafor@medlink.example` | `medlink-demo` |
| Dr Daniel Whitfield | `daniel.whitfield@medlink.example` | `medlink-demo` |
| Priya Raman | `priya.raman@medlink.example` | `medlink-demo` |

Each clinician has 20 of the 60 simulated patients, and no patient appears on two lists.

## Check it

```bash
npm test         # unit tests (Vitest)
npm run lint     # ESLint
npm run build    # production build, including the TypeScript check
```

On Windows, run `npm test` from PowerShell or the VS Code terminal. In Git Bash a lower-case drive path (`/f/...`) makes Vitest load itself twice and every suite fails to start.

## What it does, by requirement

| Brief | In the dashboard | Code | Tests |
|---|---|---|---|
| R1 Risk groups | Sidebar and overview group patients into High, Medium and Low risk | `lib/vitals/roster.ts`, `components/shell/sidebar.tsx` | `lib/data/patients.test.ts` |
| R2 Continuous feed | A simulated sensor feed sends one reading per patient every 3 seconds | `stores/feed.ts`, `lib/vitals/simulator.ts` | `lib/vitals/simulator.test.ts` |
| R3 Normal / Warning / Critical | Every reading is scored and shown with a status; the tile shows which vitals scored | `lib/vitals/rules.ts`, `components/vitals/` | `lib/vitals/rules.test.ts` |
| R4 Critical alerts | A toast with patient ID, timestamp and each failing vital; acknowledge from the toast, the bell or the patient page | `lib/vitals/alerts.ts`, `components/alerts/` | `lib/vitals/alerts.test.ts` |
| R5 Own patients only | Every screen reads patients through one module that filters by the signed-in clinician; another clinician's patient URL is refused | `lib/data/patients.ts`, `components/auth-gate.tsx` | `lib/data/patients.test.ts` |
| R6 History | Per-patient reading log (with CSV export) and alert history with who acknowledged and when | `components/charts/reading-log.tsx`, `components/alerts/alerts-tile.tsx` | `lib/vitals/feed.test.ts` |
| R8 Trends | History chart with normal range and limits, and a live streaming chart, per vital | `components/charts/` | — |
| R9 Sensor problems | Dropouts, impossible values, duplicates, late and stalled messages are handled without false or missing alerts | `lib/vitals/validate.ts`, `lib/vitals/feed.ts`, `lib/vitals/faults.ts` | `lib/vitals/feed.test.ts` |
| R10 Thresholds per patient | A dialog with a slider per vital; saved per patient with who changed them and when | `lib/vitals/threshold-editor.ts`, `components/thresholds/` | `lib/vitals/threshold-editor.test.ts` |

### How readings are classified

The points rule comes from `notebooks/01_first_model` (`make_demo_data`). It was invented for teaching and is not a clinical score.

| Vital | 1 point | Severe |
|---|---|---|
| Heart rate (bpm) | above 100 | below 50 or above 120 (2 points) |
| SpO2 (%) | below 94 | below 91 (3 points) |
| Systolic BP (mmHg) | below 100 or above 170 | below 90 or above 200 (3 points) |
| Temperature (°C) | above 38 | below 35.5 or above 39 (2 points) |
| Glucose (mg/dL), patients with diabetes only | above 220 | below 70 or above 300 (3 points) |

Three points or more is Critical, one or two is Warning, none is Normal. Diastolic pressure is displayed but not scored. A value exactly on a limit does not score.

### How sensor problems are handled (R9)

| Problem | What happens |
|---|---|
| A sensor sends nothing | The tile shows "No signal" with the last real value and its age. A missing value scores no points. |
| An impossible value (for example SpO2 127%) | Rejected before scoring and shown as "Value rejected". |
| The same message twice | The second copy is ignored. |
| A message arrives late | Filed in history at its own time. It does not replace the latest reading or raise an alert. |
| A patient's feed stalls | After about 7 seconds the patient shows Delayed, then Offline, and the stale values are dimmed. |
| A dropout during a Critical episode | Does not count as recovery, so the alert stays open. |

### How alerts behave (R4)

- One alert covers a whole Critical episode, rather than one per reading.
- An alert resolves after three Normal readings in a row. A Warning does not count as recovery.
- An alert that nobody acknowledges within 45 seconds is escalated with a second notification that stays on screen.
- Alerts already open at sign-in are brought forward, so they notify and can escalate.
- Only one notification is ever on screen. It shows the newest open alert and a "+N more" link that opens the full list under the bell. It hides itself after 10 seconds; the alert stays open under the bell until someone acknowledges it.

### How the simulation behaves (R2)

The live feed is designed to look like a real caseload, where most patients are stable most of the time.

| | Behaviour | Measured over 20 simulated hours |
|---|---|---|
| Stable patient | Vitals stay close to the patient's own baseline, including a personal glucose level | About 98% of readings are Normal |
| Mild blip | An occasional single reading drifts out of range, usually a Warning | Under 2% of readings |
| Deterioration | Rare. Builds up over about 15 seconds, holds, then eases off; 45 to 105 seconds in total. Each vital moves in one direction throughout. More likely for higher-risk patients | A new Critical alert about every 3.5 minutes across a 20-patient caseload |

The **Simulate deterioration** button on a patient page starts a 90-second deterioration on demand. It is a demonstration control, not a clinical feature.

The settings are in `lib/vitals/deterioration.ts` (`SCENARIO`). Called without options, `generateReading` still uses the notebook's original formulas and rates, which is what you would use to produce training data.

## How it is organised

```
src/
├── app/                 routes: /login, / (overview), /patients/[patientId]
├── components/
│   ├── alerts/          toast, bell, alert list
│   ├── charts/          history chart, live chart, reading log
│   ├── login/           sign-in screen
│   ├── patients/        overview and patient page
│   ├── shell/           sidebar, top bar
│   ├── thresholds/      threshold dialog and sliders
│   ├── ui/              button, tile, status badge, text field, tilt
│   └── vitals/          vital tiles, sparkline, feed indicator
├── hooks/               shared React hooks
├── lib/
│   ├── auth/            mock sign-in
│   ├── data/            the only module that hands out patient data
│   └── vitals/          simulator, rule, validation, feed, alerts (pure functions, unit tested)
└── stores/              session, feed, alerts, thresholds (Zustand)
```

The logic that decides anything clinical (scoring, validation, alert episodes, threshold edits) lives in `lib/vitals/` as pure functions with no React in them, so it is tested directly.

## Libraries

| Library | Used for |
|---|---|
| Next.js 16, React 19, TypeScript | Application framework |
| Tailwind CSS 4 | Styling, with colour tokens for light and dark themes |
| Base UI | Accessible dialog, sliders, menu and popover |
| Motion | Layout animation, card tilt, list transitions |
| Sonner | Alert toasts |
| NumberFlow | Animated vital-sign numbers |
| Recharts | History charts |
| Liveline | Live streaming chart |
| three.js, React Three Fiber | 3D heartbeat scene on the landing page |
| Zustand | State |
| Vitest | Unit tests |

## Accessibility

- Status is always given by an icon and a word as well as colour.
- Text contrast is at least 4.5:1, and status markers and input borders at least 3:1, in both themes. This is checked at the worst point of the gradient background, through the frosted glass.
- With "reduce transparency" switched on, or in a browser without backdrop blur, glass surfaces become solid.
- Everything works by keyboard: a skip link, arrow keys on sliders and selectors, focus kept inside the dialog and returned on close.
- With "reduce motion" switched on in the operating system, movement is removed and only fades remain.
- Animated headings on the landing page also exist as plain text for screen readers.

## Performance

- The 3D scene is about 240 KB (compressed). It downloads only on the landing page, after the page has appeared, and stops rendering whenever it is off screen.
- Its resolution is capped at 1.5x the screen density, and it falls back to a flat drawing when WebGL is not available.
- Page transitions use the browser's View Transitions API: moving forward (landing, sign-in, dashboard) rises upward, going back moves down, and pages inside the dashboard crossfade.

## Limitations

- **Sign-in is a mock.** The passcode is in the source and the patient filter runs in the browser. It shows the intended behaviour; real access control must be enforced by the API (`app/`).
- **The points rule stands in for the trained model.** The dashboard scores readings itself. `lib/data/patients.ts` and `stores/feed.ts` are the places to connect the API once it classifies readings.
- **Nothing is stored on a server.** History covers the last 30 minutes and resets on reload. Thresholds are kept in the browser's local storage.
- **The feed is faster than real life.** One reading every 3 seconds stands in for one a minute, and deteriorations are more frequent than in practice so that a short demonstration contains some.
- **The live feed is calmer than the notebook's data.** The notebook makes each reading independently unwell 16 to 36% of the time, which suits training data but would raise an alert every few seconds on a dashboard. The live feed uses lower noise, steady personal baselines and rare, sustained deteriorations instead. The vital signs and the points rule are unchanged.
- **The rule has gaps.** For example, a heart rate of 24 scores only 2 points, so it is a Warning unless another vital also scores.

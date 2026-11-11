# dashboard/ (R5, R8, R10)

The clinician-facing dashboard: log in, see only your own patients, view each patient's vital-sign trends and alerts, and set alert thresholds for a patient.

Built with Next.js, TypeScript and Tailwind CSS.

## Run it

```bash
cd dashboard
npm install
npm run dev
```

Then open http://localhost:3000. Sign in with one of the demo accounts listed on the login screen.

## Test it

```bash
npm test
```

Unit tests cover the points rule, the simulator, sign-in, and the rule that a clinician sees only their own patients.

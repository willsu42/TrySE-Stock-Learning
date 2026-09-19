# Deploy the web demo to Vercel

The repository includes `vercel.json` for the Expo web export. These instructions publish the browser version; they do not build or publish iOS/Android apps.

The current demo needs no environment variables, price API keys, Python runtime, or cloud database. Synthetic prices and precomputed forecasts are bundled. Each visitor's progress stays in their own browser storage.

## 1. Check the production build locally

From the repository root, with Node.js 22.13+:

```sh
npm ci
npm run check
npx expo export --platform web
```

The export produces `dist/index.html`, JavaScript, the SQLite worker, and WebAssembly assets. Keep `dist/` ignored by Git; Vercel builds it from source. A successful export checks bundling, not the deployed site's runtime behavior.

## 2. Commit and push your changes

Commit the app and deployment configuration to the GitHub repository you want Vercel to build. Include `vercel.json`, `package.json`, and `package-lock.json`. Push the intended deployment branch.

## 3. Import the repository into Vercel

1. Sign in to [Vercel](https://vercel.com/new) using your GitHub account.
2. Import the `TrySE-Stock-Learning` repository. If it is missing, grant the Vercel GitHub integration access to that repository.
3. Use the repository root as **Root Directory**; do not select `src/` or `dist/`.
4. Confirm the settings below. The checked-in configuration supplies the install/build commands and output directory.
5. Click **Deploy** and wait for the build to finish.

| Setting               | Value                              |
| --------------------- | ---------------------------------- |
| Framework Preset      | Other (`framework: null`)          |
| Install Command       | `npm ci`                           |
| Build Command         | `npx expo export --platform web`   |
| Output Directory      | `dist`                             |
| Environment Variables | None required for the current demo |

Use a Node.js version compatible with the `engines` requirement in `package.json`. Check the actual selected version in the build log if dependency installation fails.

## 4. Verify the public URL

Open the deployment's HTTPS URL directly in a new browser tab. Before adding the link to your resume or README:

- Open it in a signed-out/private window to confirm interviewers can access it. If it requires a Vercel login, review the project's Deployment Protection settings and use the intended public production URL.
- Buy a practice share, reload, and confirm the holding remains.
- Answer a quiz, switch language, and check that progress persists.
- Lock and reveal a forecast.
- Check the layout on a phone-sized screen and open an external resource.

In the browser console, `window.crossOriginIsolated` should be `true`. In the Network panel, the document response should contain:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers enable the shared-memory functionality needed by SQLite on the web. `metro.config.js` sets them for the development server; `vercel.json` sets them for the deployed site. Confirm that the worker and `.wasm` requests also succeed.

## Updates and saved progress

Commits pushed to the configured production branch trigger production deployments. Other branches and pull requests can receive preview deployments. Use the stable production domain for interviews and confirm the Production Branch in Vercel's project settings.

Browser storage is tied to the site's origin. Localhost, a preview URL, the production URL, and a custom domain have separate saved progress. Changing domains or clearing website data does not migrate the old browser database. There is no cross-device account synchronization yet.

## Troubleshooting

| Symptom                                      | Check                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Vercel tries to build Next.js                | Use Framework Preset **Other** and the repository's `vercel.json`.                                            |
| No output directory                          | Confirm the web export command ran successfully and Output Directory is `dist`.                               |
| SQLite does not initialize                   | Open the HTTPS URL directly; verify both isolation headers, `crossOriginIsolated`, and worker/WASM responses. |
| Worker or WASM request returns HTML          | Check for conflicting custom rewrites; generated assets must be served as files.                              |
| Preview progress seems missing on production | Different origins have separate local databases; this is expected.                                            |
| Visitors see a Vercel login                  | Check Deployment Protection and the URL you are sharing.                                                      |

## References

- [Expo web publishing and Vercel configuration](https://docs.expo.dev/guides/publishing-websites/)
- [Expo SQLite web requirements](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel Git deployments](https://vercel.com/docs/git)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)

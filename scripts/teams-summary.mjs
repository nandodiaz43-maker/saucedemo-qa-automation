// Resumen gerencial de la ejecución para Microsoft Teams.
//
//   node scripts/teams-summary.mjs            envía la tarjeta al webhook
//   node scripts/teams-summary.mjs --dry-run  imprime la tarjeta, no envía nada
//
// Lee reports/results.json (reporter json de Playwright). Configuración por variables de entorno:
//   TEAMS_WEBHOOK_URL  webhook de Teams (app Workflows: "Post to a channel when a webhook request is received").
//                      Es un secreto: nunca se imprime, solo su host.
//   REPORT_URL, RUN_URL, TRIGGER (schedule | push | workflow_dispatch), BRANCH, COMMIT_SHA, COMMIT_MESSAGE
import { existsSync, readFileSync } from 'node:fs';

const RESULTS_FILE = 'reports/results.json';
const MAX_FAILURES_LISTED = 5;
const dryRun = process.argv.includes('--dry-run');

const TRIGGERS = {
  schedule: 'Ejecución diaria (6:00 a. m. Colombia)',
  push: 'Merge a master',
  workflow_dispatch: 'Ejecución manual',
};
const BROWSERS = { chrome: 'Chrome', edge: 'Edge' };

const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, '');

function collectTests(suites, out = []) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) out.push({ title: spec.title, test });
    }
    collectTests(suite.suites, out);
  }
  return out;
}

export function summarize(report) {
  const perProject = {};
  const failures = [];
  for (const { title, test } of collectTests(report.suites)) {
    const p = (perProject[test.projectName] ??= { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 });
    p.total += 1;
    if (test.status === 'expected') p.passed += 1;
    else if (test.status === 'flaky') p.flaky += 1;
    else if (test.status === 'skipped') p.skipped += 1;
    else {
      p.failed += 1;
      const error = test.results?.at(-1)?.error?.message ?? 'sin detalle';
      failures.push({ title, project: test.projectName, error: stripAnsi(error).split('\n')[0].slice(0, 160) });
    }
  }
  const totals = Object.values(perProject).reduce(
    (acc, p) => {
      for (const key of Object.keys(acc)) acc[key] += p[key];
      return acc;
    },
    { total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0 },
  );
  return { perProject, totals, failures, durationMs: report.stats?.duration ?? 0 };
}

function overallStatus(summary) {
  if (!summary) return { label: 'SIN RESULTADOS', icon: '🔴', color: 'Attention' };
  if (summary.totals.failed > 0) return { label: 'FALLIDA', icon: '🔴', color: 'Attention' };
  if (summary.totals.total === 0) return { label: 'SIN RESULTADOS', icon: '🔴', color: 'Attention' };
  if (summary.totals.flaky > 0) return { label: 'INESTABLE (pasó con reintentos)', icon: '🟡', color: 'Warning' };
  return { label: 'EXITOSA', icon: '🟢', color: 'Good' };
}

const formatDuration = (ms) => (ms >= 60_000 ? `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s` : `${(ms / 1000).toFixed(1)} s`);

export function buildCard(summary, env = process.env) {
  const status = overallStatus(summary);
  const trigger = TRIGGERS[env.TRIGGER] ?? env.TRIGGER ?? 'Ejecución local';
  const when = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
  const commit = env.COMMIT_SHA
    ? `${env.COMMIT_SHA.slice(0, 7)}${env.COMMIT_MESSAGE ? ` · ${env.COMMIT_MESSAGE.split('\n')[0].slice(0, 80)}` : ''}`
    : 'n/d';

  const body = [
    { type: 'TextBlock', text: `${status.icon} SauceDemo QA · Ejecución ${status.label}`, weight: 'Bolder', size: 'Large', wrap: true, color: status.color },
  ];

  if (!summary) {
    body.push({
      type: 'TextBlock',
      wrap: true,
      text: 'No se generó reports/results.json: la ejecución terminó antes de correr las pruebas (instalación, typecheck o lint). Revisar el log de la ejecución.',
    });
  } else {
    const { totals, perProject, failures, durationMs } = summary;
    const passRate = totals.total ? Math.round((totals.passed / totals.total) * 100) : 0;
    body.push({
      type: 'FactSet',
      facts: [
        { title: 'Resultado', value: `${totals.passed} de ${totals.total} pruebas correctas (${passRate} %)` },
        ...Object.entries(perProject).map(([name, p]) => ({
          title: BROWSERS[name] ?? name,
          value: `${p.passed}/${p.total} correctas${p.failed ? ` · ${p.failed} fallidas` : ''}${p.flaky ? ` · ${p.flaky} inestables` : ''}${p.skipped ? ` · ${p.skipped} omitidas` : ''}`,
        })),
        { title: 'Duración', value: formatDuration(durationMs) },
      ],
    });
    if (failures.length > 0) {
      body.push({ type: 'TextBlock', text: 'Pruebas fallidas', weight: 'Bolder', spacing: 'Medium' });
      for (const f of failures.slice(0, MAX_FAILURES_LISTED)) {
        body.push({ type: 'TextBlock', wrap: true, spacing: 'Small', text: `• **${BROWSERS[f.project] ?? f.project}** · ${f.title}\n${f.error}` });
      }
      if (failures.length > MAX_FAILURES_LISTED) {
        body.push({ type: 'TextBlock', spacing: 'Small', text: `… y ${failures.length - MAX_FAILURES_LISTED} más en el reporte.` });
      }
    }
  }

  body.push({
    type: 'FactSet',
    separator: true,
    spacing: 'Medium',
    facts: [
      { title: 'Disparador', value: trigger },
      { title: 'Rama', value: env.BRANCH || 'n/d' },
      { title: 'Commit', value: commit },
      { title: 'Fecha', value: `${when} (hora Colombia)` },
    ],
  });

  const actions = [];
  if (env.REPORT_URL) actions.push({ type: 'Action.OpenUrl', title: 'Ver reporte (imágenes y video)', url: env.REPORT_URL });
  if (env.RUN_URL) actions.push({ type: 'Action.OpenUrl', title: 'Ver ejecución', url: env.RUN_URL });

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: { $schema: 'http://adaptivecards.io/schemas/adaptive-card.json', type: 'AdaptiveCard', version: '1.4', body, actions },
      },
    ],
  };
}

async function main() {
  const summary = existsSync(RESULTS_FILE) ? summarize(JSON.parse(readFileSync(RESULTS_FILE, 'utf8'))) : null;
  const payload = buildCard(summary);

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) {
    console.log('teams-summary: TEAMS_WEBHOOK_URL no está definida; se omite el envío.');
    return;
  }

  let host;
  try {
    host = new URL(url).host;
  } catch {
    throw new Error('TEAMS_WEBHOOK_URL no es una URL válida.');
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  }).catch((error) => {
    // El mensaje de fetch es solo "fetch failed": la causa real (DNS, timeout, TLS) está en error.cause.
    throw new Error(`No se pudo contactar a ${host} (${error.cause?.code ?? error.name}).`);
  });
  if (!response.ok) throw new Error(`Teams (${host}) respondió HTTP ${response.status}.`);
  console.log(`teams-summary: resumen enviado a ${host} (HTTP ${response.status}).`);
}

// Solo se ejecuta al lanzarlo como script, no al importarlo.
if (import.meta.url === new URL(process.argv[1], 'file:///').href || process.argv[1]?.endsWith('teams-summary.mjs')) {
  main().catch((error) => {
    console.error(`teams-summary: ${error.message}`);
    process.exit(1);
  });
}

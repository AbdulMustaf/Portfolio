#!/usr/bin/env python3
"""
Generate the system-architecture infographics used as project artwork.

One standalone SVG per project in projectsData.ts, written to public/images/.
Everything is laid out on a 1600x900 canvas so the files drop straight into the
16/9 card slot, and the palette is the same Netflix-dark set the site uses.

Re-run after editing SPECS:

    python3 scripts/gen_project_diagrams.py
"""

from html import escape
from pathlib import Path

# ── Canvas + palette ─────────────────────────────────────────────────────────
W, H = 1600, 900

BG      = '#0f0f12'
SURFACE = '#1b1b21'
STROKE  = '#2f2f3a'
ACCENT  = '#e50914'
TEXT    = '#ececf2'
MUTED   = '#8b8b96'
FAINT   = '#5a5a66'

MARGIN  = 60
COL_GAP = 54

BODY_TOP = 234
RULE_Y   = 784          # hairline above the metrics strip
BAND_Y   = 700
BAND_H   = 58

FS_TITLE, FS_SUB     = 50, 25
FS_COL               = 22
FS_METRIC, FS_MLABEL = 46, 20

CHAR_W = 0.54           # rough advance width for the Helvetica-ish stack

# Card metrics, densest last. render() picks the first tuple whose tallest
# column still clears the body region, so a five-deep column compresses
# instead of colliding with the callout band.
#      pad  gap  line_title  line_sub  fs_title  fs_sub
DENSITIES = [
    (18, 16, 30, 24, 24, 19),
    (16, 14, 29, 23, 23, 18),
    (14, 12, 28, 22, 23, 18),
    (12, 10, 27, 21, 22, 17),
    (10,  9, 26, 20, 21, 16),
    ( 9,  8, 25, 19, 20, 15),
]


def fit(text: str, fs: int, usable: float, floor: int) -> int:
    """Shrink a font size until the string fits the available width."""
    while fs > floor and len(text) * CHAR_W * fs > usable:
        fs -= 1
    return fs


def txt(x, y, s, fs, fill, weight='normal', anchor='start', spacing=None):
    extra = f' letter-spacing="{spacing}"' if spacing else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{fs}" fill="{fill}" '
            f'font-weight="{weight}" text-anchor="{anchor}"{extra}>{escape(s)}</text>')


def card_height(node, pad, lh_t, lh_s) -> float:
    subs = node.get('s', [])
    h = pad * 2 + lh_t
    if subs:
        h += 6 + len(subs) * lh_s
    return h


def stack_height(nodes, pad, gap, lh_t, lh_s) -> float:
    return (sum(card_height(nd, pad, lh_t, lh_s) for nd in nodes)
            + gap * (len(nodes) - 1))


def render(spec) -> str:
    cols = spec['columns']
    n = len(cols)
    col_w = (W - 2 * MARGIN - (n - 1) * COL_GAP) / n
    usable = col_w - 36
    has_band = bool(spec.get('band'))
    body_bot = (BAND_Y - 18) if has_band else 744
    avail = body_bot - BODY_TOP

    # Pick the loosest card metrics that still fit the deepest column.
    pad, gap, lh_t, lh_s, fs_t, fs_s = DENSITIES[-1]
    for cand in DENSITIES:
        tallest = max(stack_height(c['nodes'], cand[0], cand[1], cand[2], cand[3]) for c in cols)
        if tallest <= avail:
            pad, gap, lh_t, lh_s, fs_t, fs_s = cand
            break

    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" '
        f'role="img" aria-label="{escape(spec["alt"])}">',
        f'<title>{escape(spec["alt"])}</title>',
        '<defs>',
        '<radialGradient id="glow" cx="12%" cy="6%" r="70%">',
        '<stop offset="0%" stop-color="#e50914" stop-opacity="0.10"/>',
        '<stop offset="100%" stop-color="#e50914" stop-opacity="0"/>',
        '</radialGradient>',
        '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
        'markerHeight="7" orient="auto-start-reverse">',
        f'<path d="M0 0 L10 5 L0 10 z" fill="{FAINT}"/>',
        '</marker>',
        '</defs>',
        f'<rect width="{W}" height="{H}" fill="{BG}"/>',
        f'<rect width="{W}" height="{H}" fill="url(#glow)"/>',
    ]

    # ── Header ───────────────────────────────────────────────────────────────
    out.append(f'<rect x="{MARGIN}" y="62" width="8" height="70" rx="4" fill="{ACCENT}"/>')
    tx = MARGIN + 28
    out.append(txt(tx, 106, spec['title'], fit(spec['title'], FS_TITLE, 1000, 34), TEXT, 'bold'))
    out.append(txt(tx, 146, spec['subtitle'], fit(spec['subtitle'], FS_SUB, 1060, 18), MUTED))
    out.append(txt(W - MARGIN, 88, 'SYSTEM ARCHITECTURE', 19, FAINT, 'bold', 'end', '3.5'))
    out.append(txt(W - MARGIN, 128, spec['year'], 34, ACCENT, 'bold', 'end'))
    out.append(f'<line x1="{MARGIN}" y1="192" x2="{W - MARGIN}" y2="192" '
               f'stroke="{STROKE}" stroke-width="2"/>')

    # ── Columns ──────────────────────────────────────────────────────────────
    for i, col in enumerate(cols):
        x = MARGIN + i * (col_w + COL_GAP)

        out.append(f'<circle cx="{x + 5:.1f}" cy="{BODY_TOP - 40}" r="5" fill="{ACCENT}"/>')
        out.append(txt(x + 20, BODY_TOP - 33, col['label'],
                       fit(col['label'], FS_COL, usable - 20, 15), TEXT, 'bold', spacing='2.5'))

        stack = stack_height(col['nodes'], pad, gap, lh_t, lh_s)
        y = BODY_TOP + max(0, (avail - stack) / 2)

        for nd in col['nodes']:
            h = card_height(nd, pad, lh_t, lh_s)
            hot = nd.get('accent')
            bump = 6 if hot else 0
            out.append(
                f'<rect x="{x:.1f}" y="{y:.1f}" width="{col_w:.1f}" height="{h:.1f}" rx="10" '
                f'fill="{SURFACE}" stroke="{ACCENT if hot else STROKE}" stroke-width="2"/>')
            if hot:
                out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="4" height="{h:.1f}" '
                           f'rx="2" fill="{ACCENT}"/>')

            ty = y + pad + fs_t
            out.append(txt(x + 18 + bump, ty, nd['t'],
                           fit(nd['t'], fs_t, usable - bump, 14),
                           '#ffffff' if hot else TEXT, 'bold'))
            for k, line in enumerate(nd.get('s', [])):
                out.append(txt(x + 18 + bump, ty + 6 + (k + 1) * lh_s, line,
                               fit(line, fs_s, usable - bump, 12), MUTED))
            y += h + gap

        if i < n - 1:
            ax = x + col_w + 10
            ay = BODY_TOP + avail / 2
            out.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{ax + COL_GAP - 20:.1f}" y2="{ay:.1f}" '
                       f'stroke="{FAINT}" stroke-width="3" marker-end="url(#arrow)"/>')

    # ── Callout band ─────────────────────────────────────────────────────────
    if has_band:
        out.append(f'<rect x="{MARGIN}" y="{BAND_Y}" width="{W - 2 * MARGIN}" height="{BAND_H}" '
                   f'rx="10" fill="none" stroke="{ACCENT}" stroke-width="2" '
                   f'stroke-dasharray="10 8" opacity="0.75"/>')
        out.append(txt(W / 2, BAND_Y + 37, spec['band'],
                       fit(spec['band'], 21, W - 2 * MARGIN - 40, 12), MUTED, anchor='middle'))

    # ── Metrics strip ────────────────────────────────────────────────────────
    out.append(f'<line x1="{MARGIN}" y1="{RULE_Y}" x2="{W - MARGIN}" y2="{RULE_Y}" '
               f'stroke="{STROKE}" stroke-width="2"/>')
    mets = spec['metrics']
    slot = (W - 2 * MARGIN) / len(mets)
    for i, (value, label) in enumerate(mets):
        cx = MARGIN + slot * i + slot / 2
        out.append(txt(cx, 840, value, fit(value, FS_METRIC, slot - 16, 24), ACCENT, 'bold', 'middle'))
        out.append(txt(cx, 872, label, fit(label, FS_MLABEL, slot - 10, 12), MUTED, anchor='middle'))

    out.append('</svg>')
    return '\n'.join(out)


# ── Specs ────────────────────────────────────────────────────────────────────
# Node labels track the real module names in each repo wherever one exists, so
# the diagram stays checkable against the source rather than being decorative.

SPECS = {
    'sts-phase-detector': {
        'title': 'A Phase Detector Is Not a Clock',
        'subtitle': 'Sit-to-stand phase detection, then the proof those labels cannot measure time',
        'year': '2026',
        'alt': 'Two-part research pipeline: wearable kinematics feed a four-class phase '
               'detector, whose labels are then re-segmented on velocity gates to build a '
               'prespecified movement-control index.',
        'columns': [
            {'label': 'SIGNAL INPUT', 'nodes': [
                {'t': 'CeTI-Age-Kinematics', 's': ['32 adults · 64 recordings', '100 Hz fused kinematics']},
                {'t': '7 IMU → 1 pelvis', 's': ['Δ 0.002 tolerant macro-F1']},
                {'t': 'GaitPD / WearGait-PD', 's': ['99 PD · 85 control', 'replication only, never pooled']},
            ]},
            {'label': 'PART I — DETECTOR', 'nodes': [
                {'t': 'segment_sts.py', 's': ['repetitions from pelvis-y']},
                {'t': 'static_anchor_labels', 's': ['±175 ms anchor convention']},
                {'t': '170 ms windows / 8', 's': ['engineered + velocity feats']},
                {'t': 'Random Forest ×300', 's': ['5-fold participant-grouped']},
                {'t': 'audit_4class_pipeline', 's': ['leakage · shuffle nulls'], 'accent': True},
            ]},
            {'label': 'PART II — INDEX', 'nodes': [
                {'t': 'velocity-gated re-seg', 's': ['320/320 reps recovered']},
                {'t': 'extract_natural.py', 's': ['per-rep kinematic features']},
                {'t': 'phase_score.py', 's': ['FROZEN component registry']},
                {'t': 'validate_real_labels', 's': ['known-groups + permutation']},
                {'t': 'circularity_ablation', 's': ['the computed retraction'], 'accent': True},
            ]},
            {'label': 'OUTPUT', 'nodes': [
                {'t': 'RisingControlIndex', 's': ['prespecified · unfitted'], 'accent': True},
                {'t': 'Reliability report', 's': ['ICC · SEM · MDC']},
                {'t': 'paper/main.pdf', 's': ['5 pp + 16-slide talk']},
                {'t': 'PROVENANCE.md', 's': ['every figure → source CSV']},
            ]},
        ],
        'band': 'Reproducibility spine — deterministic SEED 20260722 · YAML-driven runner across 30+ pipeline '
                'variants · Part II regenerates with no raw data',
        'metrics': [
            ('0.735', 'macro-F1, strict'),
            ('0.852', 'at ±100 ms tolerance'),
            ('0.771', 'index AUC, p = 0.0033'),
            ('0.726', 'ICC, up from 0.334'),
            ('0.867→0.100', 'retracted by ablation'),
        ],
    },

    'medsafe-ai': {
        'title': 'MedSafe AI',
        'subtitle': 'Real-time hospital violence detection from video and audio, with automated alerting',
        'year': '2025',
        'alt': 'Ward cameras and microphones feed a YOLO and TensorFlow perception layer; a '
               'fusion classifier scores aggression and a .NET service pushes alerts to an '
               'Angular monitoring dashboard.',
        'columns': [
            {'label': 'CAPTURE', 'nodes': [
                {'t': 'Ward IP cameras', 's': ['RTSP video frames']},
                {'t': 'Ambient microphones', 's': ['streaming audio buffers']},
                {'t': 'Training corpus', 's': ['5,000+ video + audio samples']},
            ]},
            {'label': 'PERCEPTION', 'nodes': [
                {'t': 'OpenCV frame pipe', 's': ['decode · resize · sample']},
                {'t': 'YOLO detection', 's': ['people · poses · objects']},
                {'t': 'TensorFlow audio', 's': ['distress / shout classes']},
            ]},
            {'label': 'DECISION', 'nodes': [
                {'t': 'Aggression classifier', 's': ['fuses vision + audio'], 'accent': True},
                {'t': 'Temporal smoothing', 's': ['kills single-frame spikes']},
                {'t': 'Threshold + severity', 's': ['confidence → alert tier']},
            ]},
            {'label': 'RESPONSE', 'nodes': [
                {'t': '.NET (C#) service', 's': ['incident API + dispatch']},
                {'t': 'Angular dashboard', 's': ['live feed · alert queue'], 'accent': True},
                {'t': 'PostgreSQL store', 's': ['incidents, not identities']},
                {'t': 'Security staff alert', 's': ['pushed in real time']},
            ]},
        ],
        'band': 'Privacy by design — classifies actions, never identifies individuals · no personal identifiers '
                'stored · encrypted in transit · bias and explainability treated as requirements',
        'metrics': [
            ('~20%', 'accuracy over baseline'),
            ('5,000+', 'training samples'),
            ('1 in 5', 'health workers affected'),
            ('$2,000', 'Catalyst Challenge win'),
        ],
    },

    'ai-compliance-guard': {
        'title': 'AI Compliance Guard',
        'subtitle': 'Intercepts prompts before they leave the device and validates them against org policy',
        'year': '2024',
        'alt': 'A browser extension intercepts prompts on ChatGPT and Copilot, sends them to a '
               'Flask validation API bound to localhost, and returns violations plus an '
               'autocorrected prompt — nothing leaves the device.',
        'columns': [
            {'label': 'BROWSER (MV3)', 'nodes': [
                {'t': 'submit-interceptor', 's': ['blocks send before egress'], 'accent': True},
                {'t': 'prompt-extractor', 's': ['text + PDF attachments']},
                {'t': 'adapters/', 's': ['ChatGPT · Microsoft Copilot']},
                {'t': 'service-worker.js', 's': ['background messaging']},
            ]},
            {'label': 'LOCAL API :5000', 'nodes': [
                {'t': 'POST /validate', 's': ['Flask, bound to 127.0.0.1']},
                {'t': 'rule_based.py', 's': ['policy ruleset matching']},
                {'t': 'llm_validator.py', 's': ['local LLM · Ollama phi4-mini']},
                {'t': 'CORS allowlist', 's': ['extension origin only']},
            ]},
            {'label': 'VERDICT', 'nodes': [
                {'t': 'Violations + spans', 's': ['what was flagged, and where']},
                {'t': 'Autocorrected prompt', 's': ['a safer version, offered'], 'accent': True},
                {'t': 'ui-component.js', 's': ['inline warning overlay']},
                {'t': 'audit_logger', 's': ['prompt_audit_log.xlsx']},
            ]},
            {'label': 'OUTCOME', 'nodes': [
                {'t': 'Safe → forwarded', 's': ['reaches the AI tool intact']},
                {'t': 'Flagged → blocked', 's': ['until the user edits'], 'accent': True},
                {'t': 'IT audit trail', 's': ['platform · type · accepted']},
            ]},
        ],
        'band': 'Trust boundary — validation, inference and logging all run on the employee’s device; no prompt, '
                'attachment or log ever reaches external infrastructure',
        'metrics': [
            ('0', 'bytes sent externally'),
            ('2', 'validator backends'),
            ('2', 'platform adapters'),
            ('FIPPA', 'Bill 194 + AI Directive'),
        ],
    },

    'pixel-zero': {
        'title': 'Pixel Zero',
        'subtitle': 'Detects AI-generated imagery inside a live social feed, at scroll speed',
        'year': '2024',
        'alt': 'A Chrome content script watches the feed DOM, queues images through a Flask API '
               'to Gemini and AI-or-Not, and maps normalized confidence scores back onto the '
               'live DOM nodes as risk badges and blur layers.',
        'columns': [
            {'label': 'FEED (in page)', 'nodes': [
                {'t': 'riskRail.js', 's': ['core content script, MV3'], 'accent': True},
                {'t': 'MutationObserver', 's': ['watches the feed DOM']},
                {'t': 'Image harvester', 's': ['srcset → candidate list']},
            ]},
            {'label': 'PIPELINE', 'nodes': [
                {'t': 'Async fingerprint queue', 's': ['dedupe · throttle · retry']},
                {'t': 'Flask API', 's': ['/analyze endpoint']},
                {'t': 'Response normalizer', 's': ['providers → one score']},
            ]},
            {'label': 'DETECTORS', 'nodes': [
                {'t': 'Gemini API', 's': ['vision-model reasoning']},
                {'t': 'AI-or-Not API', 's': ['synthetic-media classifier']},
                {'t': 'Confidence mapping', 's': ['score → risk tier'], 'accent': True},
            ]},
            {'label': 'OVERLAY', 'nodes': [
                {'t': 'Risk badge', 's': ['bound to the live DOM node'], 'accent': True},
                {'t': 'NSFW blur layer', 's': ['opt-in reveal']},
                {'t': 'Lasso tool', 's': ['verify a region on demand']},
            ]},
        ],
        'band': 'The digital trust gap — verification has to happen where the image is seen, at feed scroll speed, '
                'without asking the user to leave the page',
        'metrics': [
            ('QHacks', 'hackathon build'),
            ('2', 'detection providers'),
            ('MV3', 'Chrome extension'),
            ('Real time', 'per-image verdicts'),
        ],
    },

    'ops-case-competition': {
        'title': 'OPS Case Competition',
        'subtitle': 'Service blueprint for a citizen-facing government digital service — 1st place',
        'year': '2023',
        'alt': 'A service blueprint: research findings drive a frontstage citizen intake layer, '
               'backed by backstage eligibility, routing and ministry systems of record, then '
               'validated with usability testing and a stakeholder pitch.',
        'columns': [
            {'label': 'DISCOVERY', 'nodes': [
                {'t': 'Stakeholder interviews', 's': ['frontline and policy staff']},
                {'t': 'Journey mapping', 's': ['where citizens drop off']},
                {'t': 'Constraint scan', 's': ['policy · access · legacy']},
            ]},
            {'label': 'FRONTSTAGE', 'nodes': [
                {'t': 'Responsive intake', 's': ['one guided flow'], 'accent': True},
                {'t': 'Plain-language forms', 's': ['progressive disclosure']},
                {'t': 'AODA accessibility', 's': ['WCAG as acceptance criteria']},
                {'t': 'Status + notifications', 's': ['no phone call needed']},
            ]},
            {'label': 'BACKSTAGE', 'nodes': [
                {'t': 'Eligibility rules', 's': ['policy encoded once']},
                {'t': 'Case routing', 's': ['to the owning program']},
                {'t': 'Records of authority', 's': ['ministry systems of record']},
                {'t': 'Audit + reporting', 's': ['service metrics by default']},
            ]},
            {'label': 'VALIDATION', 'nodes': [
                {'t': 'Usability testing', 's': ['iterate on real tasks']},
                {'t': 'Prototype walkthrough', 's': ['clickable, end to end']},
                {'t': 'Stakeholder pitch', 's': ['senior OPS leadership'], 'accent': True},
            ]},
        ],
        'band': 'Human-centred design loop — every backstage decision traces to a frontstage failure observed in '
                'research, then gets re-tested with citizens',
        'metrics': [
            ('1st', 'place, OPS competition'),
            ('4', 'research-to-pitch stages'),
            ('AODA', 'accessibility baseline'),
        ],
    },

    'lee-language-lab': {
        'title': 'Lee Language Lab — NLP Research',
        'subtitle': 'Research platform and product roadmap for low-resource language AI',
        'year': '2023',
        'alt': 'Multilingual corpora and typology data feed fine-tuning and evaluation pipelines, '
               'which ship as research products and peer-reviewed publications, coordinated by a '
               'product-management layer.',
        'columns': [
            {'label': 'DATA & CORPORA', 'nodes': [
                {'t': 'Multilingual corpora', 's': ['low-resource language sets']},
                {'t': 'URIEL typology', 's': ['language feature vectors']},
                {'t': 'Benchmarks', 's': ['IrokoBench · BBQ · WorldCuisine']},
            ]},
            {'label': 'RESEARCH PIPELINE', 'nodes': [
                {'t': 'Data pipelines', 's': ['ingest · clean · align']},
                {'t': 'Fine-tuning runs', 's': ['transfer to new languages']},
                {'t': 'AlignFreeze', 's': ['selective layer freezing']},
                {'t': 'Bias + eval harness', 's': ['reproducible scoring']},
            ]},
            {'label': 'PRODUCTS', 'nodes': [
                {'t': 'TranslationCorrect', 's': ['human-in-the-loop review'], 'accent': True},
                {'t': 'Flipcard', 's': ['NAACL 2025 demo']},
                {'t': 'Lab website', 's': ['public research presence']},
            ]},
            {'label': 'OUTPUTS', 'nodes': [
                {'t': '3 peer-reviewed papers', 's': ['NAACL 2025, on deadline'], 'accent': True},
                {'t': 'NSERC funding', 's': ['Discovery + Supplementary']},
                {'t': 'Roadmap + user stories', 's': ['2 products, end to end']},
            ]},
        ],
        'band': 'Product-management layer — roadmap, scope and sprint cadence across 2 NLP products, plus '
                'translating the research into grant narratives for non-technical reviewers',
        'metrics': [
            ('+20%', 'research output'),
            ('2', 'NLP products owned'),
            ('3', 'publications shipped'),
            ('NSERC', 'Discovery + Supplementary'),
        ],
    },
}


def main() -> None:
    out_dir = Path(__file__).resolve().parent.parent / 'public' / 'images'
    out_dir.mkdir(parents=True, exist_ok=True)
    for pid, spec in SPECS.items():
        path = out_dir / f'arch-{pid}.svg'
        path.write_text(render(spec), encoding='utf-8')
        print(f'{path.relative_to(out_dir.parent.parent)}  ({path.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()

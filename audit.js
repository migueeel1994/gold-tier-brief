/* ─────────────────────────────────────────────────────────────
   Traffic-Manager audit — rules-based brief readiness check
   Mirrors the traffic-manager skill's checklist.
   Shared by both the form (/index.html) and chatbot (/chatbot/index.html).
   ───────────────────────────────────────────────────────────── */

(function (global) {
  'use strict';

  const FANBOYS = [' and ', ' but ', ' or ', ' so ', ' yet ', ' nor '];
  const OBSERVATION_STARTERS = ['people ', 'australians ', 'consumers ', 'customers ', 'most people ', 'many people ', 'research shows', 'studies show', 'data shows'];
  const VAGUE_ADJECTIVES = ['trusted', 'leading', 'innovative', 'best-in-class', 'world-class', 'premium', 'top', 'cutting-edge'];
  const AESTHETIC_WORDS = ['modern', 'premium', 'sleek', 'minimal', 'bold', 'clean'];
  const GENERIC_NEVER = ['boring', 'cliché', 'cliche', 'generic'];

  function isEmpty(v) { return !v || !String(v).trim(); }
  function isRealDate(v) {
    if (isEmpty(v)) return false;
    if (/tbc|asap|tba/i.test(v)) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
    if (/q[1-4]\b/i.test(v) && !/\d{4}-\d{2}-\d{2}/.test(v)) return false;
    return v.length >= 6;
  }
  function wordCount(v) { return (v || '').trim().split(/\s+/).filter(Boolean).length; }
  function containsAny(v, list) {
    const low = ' ' + (v || '').toLowerCase() + ' ';
    return list.find(w => low.includes(w));
  }
  function startsWithAny(v, list) {
    const low = (v || '').toLowerCase().trim();
    return list.find(s => low.startsWith(s));
  }

  /* ── Audit ───────────────────────────────────────────── */
  function auditBrief(a) {
    const findings = [];
    const add = (section, status, gap, question) => findings.push({ section, status, gap, question });

    /* HEADER */
    if (isEmpty(a.project_name)) add('Header', 'red', 'Project name missing', 'What is the project name?');
    if (isEmpty(a.segment))      add('Header', 'red', 'Segment not chosen', 'Which Betashares segment is this for?');
    if (isEmpty(a.creative_lead))add('Header', 'amber', 'Creative lead not named', 'Who is the creative lead?');
    if (isEmpty(a.approver))     add('Header', 'red', 'Brief approver missing', 'Who is the named brief approver?');
    else if (/tbc|tba/i.test(a.approver)) add('Header', 'red', 'Approver is "TBC"', 'Who is the named brief approver — not "TBC"?');
    if (!isRealDate(a.launch))   add('Header', 'red', 'Launch date missing or vague', 'What is the launch date — a real date, not "Q3" or "ASAP"?');
    if (isEmpty(a.budget_media)) add('Header', 'amber', 'Media budget not specified', 'What is the media budget?');

    /* SECTION 1 — CONTEXT */
    if (isEmpty(a.reason)) add('Section 1 — Context', 'red', 'Commercial trigger missing', 'What commercial trigger led to this brief?');
    else if (a.reason.length < 40) add('Section 1 — Context', 'amber', 'Commercial trigger is very brief', 'Can you expand on the market / business / regulatory trigger?');

    if (isEmpty(a.prob_opp)) add('Section 1 — Context', 'red', 'Problem-vs-opportunity choice not made', 'Is this a problem or an opportunity?');

    if (isEmpty(a.focus)) {
      add('Section 1 — Context', 'red', 'Key focus missing', 'What is the single most important thing marketing needs to fix or unlock?');
    } else {
      const lowFocus = a.focus.toLowerCase();
      if ((lowFocus.includes(' and ') || lowFocus.includes(' & ')) && a.focus.length > 40) {
        add('Section 1 — Context', 'amber', 'Focus may contain more than one thing', 'Can the focus be cut to one single issue?');
      }
    }

    /* SECTION 2 — OBJECTIVES */
    const smartMissing = [];
    if (isEmpty(a.obj_metric))   smartMissing.push('metric');
    if (isEmpty(a.obj_baseline)) smartMissing.push('baseline');
    if (isEmpty(a.obj_target))   smartMissing.push('target');
    if (isEmpty(a.obj_deadline)) smartMissing.push('deadline');
    if (smartMissing.length) {
      add('Section 2 — Objectives', 'red',
        `Commercial objective missing: ${smartMissing.join(', ')}`,
        `Fill all four S.M.A.R.T. parts: metric, baseline, target, deadline. Missing: ${smartMissing.join(', ')}.`);
    }

    if (isEmpty(a.obj_beh)) {
      add('Section 2 — Objectives', 'red', 'Behavioural objective missing', 'What specifically do we need the audience to DO that they are not doing today?');
    } else if (a.obj_beh.length < 20) {
      add('Section 2 — Objectives', 'amber', 'Behavioural objective is very short', 'Can the behaviour be more verb-specific (open, switch, add, refer)?');
    }

    if (isEmpty(a.obj_att_from) || isEmpty(a.obj_att_to)) {
      add('Section 2 — Objectives', 'red', 'Attitudinal shift not complete (FROM / TO missing)', 'What is the FROM belief and the TO belief?');
    }

    if (a.cascade && a.cascade.startsWith('Let me revise')) {
      add('Section 2 — Objectives', 'amber', 'Cascade was flagged for revision', 'Walk the chain again: if FEEL → DO → COMMERCIAL holds. Resolve any broken link.');
    } else if (!a.cascade && !smartMissing.length && !isEmpty(a.obj_beh)) {
      add('Section 2 — Objectives', 'amber', 'Cascade check not confirmed', 'Confirm the cascade walks cleanly from attitudinal to behavioural to commercial.');
    }

    /* SECTION 3 — AUDIENCE */
    const audMissing = [];
    if (isEmpty(a.aud_demo))   audMissing.push('demographics');
    if (isEmpty(a.aud_belief)) audMissing.push('beliefs');
    if (isEmpty(a.aud_usage))  audMissing.push('usage');
    if (isEmpty(a.aud_rel))    audMissing.push('relationship to brand');
    if (audMissing.length) {
      add('Section 3 — Audience', 'red',
        `Audience dimensions missing: ${audMissing.join(', ')}`,
        `Fill all four Gold Tier audience dimensions. Missing: ${audMissing.join(', ')}.`);
    } else {
      // Check for over-broad audience
      const lowDemo = a.aud_demo.toLowerCase();
      const broadPattern = /australians? \d+|aged \d+[\-–]\d+|all (investors|australians|adults)/i;
      if (broadPattern.test(a.aud_demo) && a.aud_demo.length < 120) {
        add('Section 3 — Audience', 'amber', 'Audience reads like a target market, not a target person',
          'Can the audience be sharpened to one person with specific life-stage context?');
      }
    }

    /* SECTION 4 — INSIGHT + MESSAGE */
    if (isEmpty(a.insight)) {
      add('Section 4 — Insight + Message', 'red', 'Insight missing', 'What is the human tension behind the audience\'s behaviour?');
    } else {
      const obs = startsWithAny(a.insight, OBSERVATION_STARTERS);
      if (obs) {
        add('Section 4 — Insight + Message', 'amber',
          `Insight starts with "${obs.trim()}" — reads like an observation, not a tension`,
          'What does that belief make them do or avoid that they secretly wish was different?');
      }
    }

    if (isEmpty(a.barrier)) add('Section 4 — Insight + Message', 'amber', 'Barrier not stated', 'What is the specific barrier blocking the behaviour today?');
    if (isEmpty(a.lever))   add('Section 4 — Insight + Message', 'amber', 'Lever not stated', 'What specifically removes the barrier?');
    if (isEmpty(a.nudge))   add('Section 4 — Insight + Message', 'amber', 'Behavioural principle not chosen', 'Which behavioural principle maps to this barrier?');

    if (isEmpty(a.message)) {
      add('Section 4 — Insight + Message', 'red', 'Single-minded message missing', 'What is the single-minded message?');
    } else {
      const fanboy = containsAny(a.message, FANBOYS);
      const wc = wordCount(a.message);
      if (fanboy) {
        add('Section 4 — Insight + Message', 'red',
          `Message contains "${fanboy.trim()}" — may be trying to say two things`,
          'Can the message be cut to a single direction?');
      }
      if (wc > 25) {
        add('Section 4 — Insight + Message', 'amber',
          `Message is ${wc} words (over 25)`,
          'Can the message be compressed to ≤25 words without losing the point?');
      }
    }

    if (isEmpty(a.rtb1)) {
      add('Section 4 — Insight + Message', 'red', 'No reasons to believe', 'What is the strongest hard-fact proofpoint for this brief?');
    } else {
      const adj = containsAny(a.rtb1, VAGUE_ADJECTIVES.map(w => ' ' + w + ' ').concat(VAGUE_ADJECTIVES.map(w => ' ' + w)));
      const hasNumber = /[0-9$%]/.test(a.rtb1);
      if (adj && !hasNumber) {
        add('Section 4 — Insight + Message', 'amber',
          `RTB #1 reads as adjective claim ("${adj.trim()}"), no specific fact`,
          'Replace with a specific number, comparison, or customer-stated reason.');
      }
    }

    /* SECTION 5 — CREATIVE GUIDANCE */
    if (isEmpty(a.feel)) {
      add('Section 5 — Creative Guidance', 'amber', 'Emotional state to produce not defined', 'What emotional response should the work produce?');
    } else {
      const aest = containsAny(a.feel, AESTHETIC_WORDS.map(w => ' ' + w));
      if (aest && a.feel.length < 60) {
        add('Section 5 — Creative Guidance', 'amber',
          `"${aest.trim()}" reads as aesthetic, not emotional`,
          'What feeling — not what look — should the work produce?');
      }
    }
    if (isEmpty(a.never)) {
      add('Section 5 — Creative Guidance', 'amber', '"Must never do" not specified', 'What tones, claims, or territories must creative avoid?');
    } else {
      const generic = containsAny(a.never, GENERIC_NEVER.map(w => ' ' + w));
      if (generic && a.never.length < 40) {
        add('Section 5 — Creative Guidance', 'amber',
          `"${generic.trim()}" is too generic`,
          'Be specific about what tone, claim, or territory is off-limits.');
      }
    }

    /* SECTION 6 — DELIVERABLES */
    if (isEmpty(a.deliverables)) {
      add('Section 6 — Deliverables', 'red', 'Deliverables not listed', 'What is being made, channel by channel?');
    } else {
      const hasLead = /lead/i.test(a.deliverables);
      if (!hasLead) {
        add('Section 6 — Deliverables', 'amber', 'Lead asset not identified',
          'Which deliverable is the lead / master asset?');
      }
    }

    /* SECTION 8 — KEY TIMINGS */
    if (isEmpty(a.timings)) {
      add('Section 8 — Key Timings', 'red', 'Timings missing', 'Brief sign-off, concepts, review, artwork, live — give real dates for each.');
    } else if (/tbc|asap|tba/i.test(a.timings)) {
      add('Section 8 — Key Timings', 'red', 'Timings contain "TBC" or "ASAP"', 'Replace TBC/ASAP entries with real dates.');
    }

    return findings;
  }

  /* ── Summary helpers ─────────────────────────────────── */
  function summary(findings) {
    const reds = findings.filter(f => f.status === 'red').length;
    const ambers = findings.filter(f => f.status === 'amber').length;
    let verdict, verdictDetail;
    if (reds === 0 && ambers === 0) {
      verdict = 'Ready to brief creative';
      verdictDetail = 'No blockers, no should-fixes. Brief is ready.';
    } else if (reds === 0) {
      verdict = 'Ready with conditions';
      verdictDetail = `${ambers} should-fix${ambers === 1 ? '' : 's'} — creative will work around but the result will be weaker.`;
    } else {
      verdict = `Not ready — ${reds} blocker${reds === 1 ? '' : 's'}`;
      verdictDetail = `${reds} blocker${reds === 1 ? '' : 's'}${ambers ? `, ${ambers} should-fix${ambers === 1 ? '' : 's'}` : ''}. Resolve blockers before briefing creative.`;
    }
    return { verdict, verdictDetail, reds, ambers };
  }

  function sectionStatus(findings, section) {
    const own = findings.filter(f => f.section === section);
    if (own.some(f => f.status === 'red')) return 'red';
    if (own.some(f => f.status === 'amber')) return 'amber';
    return 'green';
  }

  /* ── HTML renderer ───────────────────────────────────── */
  function renderAuditHTML(findings) {
    const s = summary(findings);
    const sections = ['Header', 'Section 1 — Context', 'Section 2 — Objectives', 'Section 3 — Audience',
                      'Section 4 — Insight + Message', 'Section 5 — Creative Guidance',
                      'Section 6 — Deliverables', 'Section 8 — Key Timings'];

    const headerColor = s.reds ? '#FA4D16' : (s.ambers ? '#FB825C' : '#076442');
    const headerLabel = s.reds ? 'NOT READY' : (s.ambers ? 'READY WITH CONDITIONS' : 'READY');

    let html = `
      <div class="audit-headline" style="background:${headerColor};color:#fff;padding:18px 24px;border-radius:6px;margin-bottom:24px;">
        <div style="font-family:'Rund Text',system-ui,Arial,sans-serif;font-size:10px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;opacity:.85;margin-bottom:4px;">Audit verdict</div>
        <div style="font-family:'Rund Display',system-ui,Arial,sans-serif;font-size:22px;font-weight:500;letter-spacing:-.01em;">${headerLabel}</div>
        <div style="font-size:13px;margin-top:6px;opacity:.92;">${s.verdictDetail}</div>
      </div>
      <div class="audit-sections" style="margin-bottom:24px;">
        <div style="font-family:'Rund Text',system-ui,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#FA4D16;border-left:3px solid #FA4D16;padding-left:10px;margin-bottom:12px;">Section-by-section</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
    `;
    sections.forEach(sec => {
      const st = sectionStatus(findings, sec);
      const dot = st === 'red' ? '🔴' : (st === 'amber' ? '🟠' : '🟢');
      const label = st === 'red' ? 'Blocker' : (st === 'amber' ? 'Needs work' : 'Ready');
      html += `<tr style="border-bottom:1px solid #D4D4D4;"><td style="padding:8px 0;">${dot}&nbsp;&nbsp;${sec}</td><td style="padding:8px 0;text-align:right;color:#545454;">${label}</td></tr>`;
    });
    html += `</table></div>`;

    const reds = findings.filter(f => f.status === 'red');
    const ambers = findings.filter(f => f.status === 'amber');

    if (reds.length) {
      html += `<div style="margin-bottom:24px;"><div style="font-family:'Rund Text',system-ui,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#FA4D16;border-left:3px solid #FA4D16;padding-left:10px;margin-bottom:12px;">🔴 Blockers (${reds.length})</div>`;
      reds.forEach((f, i) => {
        html += `<div style="background:#FFF1EC;border-left:3px solid #FA4D16;padding:12px 16px;border-radius:0 4px 4px 0;margin-bottom:8px;">
          <div style="font-weight:500;font-size:12px;color:#FA4D16;margin-bottom:4px;">${i+1}. ${esc(f.section)}</div>
          <div style="font-size:13px;color:#202021;margin-bottom:6px;">${esc(f.gap)}</div>
          <div style="font-size:12px;color:#545454;font-style:italic;">Question: ${esc(f.question)}</div>
        </div>`;
      });
      html += `</div>`;
    }

    if (ambers.length) {
      html += `<div style="margin-bottom:24px;"><div style="font-family:'Rund Text',system-ui,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#FB825C;border-left:3px solid #FB825C;padding-left:10px;margin-bottom:12px;">🟠 Should fix (${ambers.length})</div>`;
      ambers.forEach((f, i) => {
        html += `<div style="background:#FCE5D5;border-left:3px solid #FB825C;padding:12px 16px;border-radius:0 4px 4px 0;margin-bottom:8px;">
          <div style="font-weight:500;font-size:12px;color:#E04210;margin-bottom:4px;">${i+1}. ${esc(f.section)}</div>
          <div style="font-size:13px;color:#202021;margin-bottom:6px;">${esc(f.gap)}</div>
          <div style="font-size:12px;color:#545454;font-style:italic;">Question: ${esc(f.question)}</div>
        </div>`;
      });
      html += `</div>`;
    }

    if (!reds.length && !ambers.length) {
      html += `<div style="background:#076442;color:#fff;padding:20px;border-radius:6px;text-align:center;">
        <div style="font-family:'Rund Display',system-ui,Arial,sans-serif;font-size:18px;font-weight:500;margin-bottom:4px;">All checks pass.</div>
        <div style="font-size:13px;opacity:.9;">Brief is ready to hand to creative.</div>
      </div>`;
    }

    html += `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #D4D4D4;font-size:12px;color:#7F7F7F;font-style:italic;">
      This is a rules-based audit. For a full contextual review, copy the brief and paste it into Claude with the <strong style="color:#FA4D16;font-style:normal;font-weight:500;">traffic-manager</strong> skill for AI judgement on the parts rules cannot catch.
    </div>`;

    return html;
  }

  function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── Export ──────────────────────────────────────────── */
  global.BriefAudit = { auditBrief, summary, sectionStatus, renderAuditHTML };
})(window);

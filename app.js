// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI assistant representing Jonathan Lane (goes by Jon) as an interactive resume. Speak in third person. Be conversational, specific, and professional.

SUPPLY.COM (Oct 2015 – Sep 2017) — Data Developer
- SQL stored procedures, data migrations, HMWallace wholesale division
- C# Web Forms and MVC in .NET — modified internal Catalog Manager for Business Analysts
- Minor SSIS use, FTP server monitoring

AVANADE (Sep 2017 – Present) — Software Engineer
Avanade is a consulting firm (Accenture + Microsoft JV) embedding engineers with clients.

Hilton Hotels (Hospitality): Digital concierge UX — jQuery, C#/.NET, Kendo UI. HTML5 email confirmation template.
An Oil & Gas Company (Energy, confidential): Google Maps API in Angular/React SPA for gas station locations.
An Energy Company (brief): Angular/React front-end work.
IHG Hospitality: Oracle databases, Red Hat Certified, Angular/React app management, Linux server migration.
TVA (Federal Gov, Level 2 clearance): Supported 12+ apps via ServiceNow. XScript/Objective-C mobile apps to Apple App Store. Angular/React SPAs, Java/Eclipse bugs, .NET enhancements. Excel/FTP upload template with front-end error handling. Migrated Angular/React to native Android/iOS.
State of Michigan (State Gov): Angular 18 SPA from scratch with Angular Material. SSO/OAuth, role-based routing (judges/lawyers/public), AI court case search, JEST + Cypress, linting, Azure/ADO DevOps, Figma design spec, Agile/Scrum.

EDUCATION: DeVry University — Bachelor of Science in Computer Information Systems, Minor in Web Gaming. Graduated 2015, GPA 3.6.
CERTIFICATIONS: Accenture Agentic AI, Red Hat Certified, Level 2 Gov Clearance, GitHub Copilot prompt engineering, Microsoft GH-300.
LINKS: github.com/jclane85 | linkedin.com/in/jondivgame

Keep answers concise. For salary/availability direct to LinkedIn.`;

// ─── STATE ────────────────────────────────────────────────────────────────────
let conversationHistory = [];
let isLoading = false;

// ─── THEME TOGGLE ─────────────────────────────────────────────────────────────
function jcTheme() {
  const jc = document.getElementById('jc');
  const dark = !jc.classList.contains('dark');
  jc.classList.toggle('dark', dark);
  document.getElementById('jc-toggle').textContent = dark ? 'Light' : 'Dark';
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function jcNav(view) {
  document.getElementById('chat-view').classList.toggle('visible', view === 'chat');
  document.getElementById('resume-view').classList.toggle('visible', view === 'resume');
  document.getElementById('nav-chat').classList.toggle('active', view === 'chat');
  document.getElementById('nav-resume').classList.toggle('active', view === 'resume');
}

// ─── INPUT HELPERS ────────────────────────────────────────────────────────────
function jcResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function jcKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    jcSend();
  }
}

function jcSug(btn) {
  document.getElementById('jc-input').value = btn.textContent;
  document.getElementById('jc-sugs-wrap').style.display = 'none';
  jcSend();
}

// ─── CHAT RENDERING ───────────────────────────────────────────────────────────
function jcClearEmpty() {
  document.getElementById('jc-empty')?.remove();
}

function jcAddResponse(question, answer) {
  jcClearEmpty();
  const wrap = document.getElementById('jc-responses');
  const item = document.createElement('div');
  item.className = 'jc-response-item';
  item.innerHTML = `
    <div class="jc-response-q">${escapeHtml(question)}</div>
    <div class="jc-response-a">${escapeHtml(answer)}</div>
  `;
  wrap.appendChild(item);
  wrap.scrollTop = wrap.scrollHeight;
}

function jcShowTyping(question) {
  jcClearEmpty();
  const wrap = document.getElementById('jc-responses');
  const item = document.createElement('div');
  item.className = 'jc-response-item';
  item.id = 'jc-typing';
  item.innerHTML = `
    <div class="jc-response-q">${escapeHtml(question)}</div>
    <div class="jc-typing-row">
      <div class="jc-dot"></div>
      <div class="jc-dot"></div>
      <div class="jc-dot"></div>
    </div>
  `;
  wrap.appendChild(item);
  wrap.scrollTop = wrap.scrollHeight;
}

function jcRemoveTyping() {
  const t = document.getElementById('jc-typing');
  if (t) t.remove();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
async function jcSend() {
  const input = document.getElementById('jc-input');
  const text = input.value.trim();
  if (!text || isLoading) return;

  isLoading = true;
  document.getElementById('jc-send').disabled = true;

  input.value = '';
  input.style.height = 'auto';

  conversationHistory.push({ role: 'user', content: text });
  jcShowTyping(text);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: conversationHistory
      })
    });

    const data = await response.json();
    const reply = data.content?.map(b => b.text || '').join('') || 'Sorry, something went wrong.';

    jcRemoveTyping();
    jcAddResponse(text, reply);
    conversationHistory.push({ role: 'assistant', content: reply });

  } catch (error) {
    jcRemoveTyping();
    jcAddResponse(text, 'Something went wrong. Please try again.');
    console.error('API error:', error);
  }

  isLoading = false;
  document.getElementById('jc-send').disabled = false;
  input.focus();
}

// ─── PRINT ────────────────────────────────────────────────────────────────────
function jcPrint() {
  jcNav('resume');
  setTimeout(() => window.print(), 150);
}

// ─── EXPORT PDF ───────────────────────────────────────────────────────────────
async function jcExport() {
  const btn = document.querySelector('.jc-r-btn[onclick="jcExport()"]');
  btn.textContent = 'Generating\u2026';
  btn.disabled = true;

  try {
    // Match the print popup: 8.5in page, 0.4in margins → 7.7in content width
    const MARGIN_IN = 0.4;
    const CONTENT_W_IN = 7.7;
    const printWidth = Math.round(CONTENT_W_IN * 96); // 739px at 96dpi

    // Clone .jc-rp and apply print-equivalent styles
    const rp = document.querySelector('.jc-rp');
    const clonedRp = rp.cloneNode(true);
    clonedRp.style.maxWidth = 'none';
    clonedRp.style.margin = '0';
    const actionsEl = clonedRp.querySelector('.jc-resume-actions');
    if (actionsEl) actionsEl.style.display = 'none';
    const breakElClone = clonedRp.querySelector('.jc-print-break');
    if (breakElClone) breakElClone.style.paddingTop = '0.4in';

    // Render clone off-screen at print width
    const offscreen = document.createElement('div');
    offscreen.style.cssText = `position:absolute;left:-9999px;top:0;width:${printWidth}px;background:#fff;`;
    offscreen.appendChild(clonedRp);
    document.body.appendChild(offscreen);

    // Compute break Y from the clone's live layout
    const rpRect = clonedRp.getBoundingClientRect();
    const breakY_css = breakElClone
      ? breakElClone.getBoundingClientRect().top - rpRect.top
      : clonedRp.scrollHeight / 2;

    const scale = 2;
    const canvas = await html2canvas(clonedRp, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: printWidth,
      windowWidth: printWidth
    });

    document.body.removeChild(offscreen);

    const breakY_px = Math.max(0, Math.floor(breakY_css * scale));

    // Crop into two page slices
    const slice1 = document.createElement('canvas');
    slice1.width = canvas.width;
    slice1.height = breakY_px;
    slice1.getContext('2d').drawImage(canvas, 0, 0, canvas.width, breakY_px, 0, 0, canvas.width, breakY_px);

    const slice2 = document.createElement('canvas');
    slice2.width = canvas.width;
    slice2.height = canvas.height - breakY_px;
    slice2.getContext('2d').drawImage(canvas, 0, breakY_px, canvas.width, canvas.height - breakY_px, 0, 0, canvas.width, canvas.height - breakY_px);

    const margin_mm = MARGIN_IN * 25.4;          // 10.16mm
    const contentW_mm = CONTENT_W_IN * 25.4;     // 195.58mm
    const pxPerMm = canvas.width / contentW_mm;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

    // Page 1: top margin matches print body padding
    pdf.addImage(slice1.toDataURL('image/jpeg', 0.95), 'JPEG', margin_mm, margin_mm, contentW_mm, slice1.height / pxPerMm);

    // Page 2: slice2 starts with .jc-print-break's padding-top baked in, so y=0
    pdf.addPage();
    pdf.addImage(slice2.toDataURL('image/jpeg', 0.95), 'JPEG', margin_mm, 0, contentW_mm, slice2.height / pxPerMm);

    pdf.save('Jonathan_Lane_Resume.pdf');
  } finally {
    btn.textContent = 'Export PDF';
    btn.disabled = false;
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('jc-input');
  input.addEventListener('keydown', jcKey);
  input.addEventListener('input', () => jcResize(input));
});

// ===== Site-Config =====
window.SITE = {
  siteName: "Physiotherapie ",
  email: { method: "none", to: "Dennis.Clemens92@gmail.com" },
  pages: {
    startHeroLight: "./Assets/BackgroundHell.jpg",
    startHeroDark: "./Assets/BackgroundDark.jpg",
    kontaktHero: "./Assets/BackgroundAnmeldung.jpg",
    logo: "./Assets/Logo.png"
  },
  auth: { demoUser: "Dennis", demoPass: "1" },
  calendar: { startHour: 8, endHour: 20, stepMinutes: 60 }
};

// ===== Theme =====
function setThemeFromPreference() {
  const root = document.documentElement;
  const stored = localStorage.getItem("theme");
  const isDarkPref = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || "auto";
  root.setAttribute("data-theme", theme);
  if (theme === "auto" && isDarkPref) root.classList.add("prefers-dark"); else root.classList.remove("prefers-dark");
}
function cycleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "auto";
  const next = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
  localStorage.setItem("theme", next);
  setThemeFromPreference(); applyHeroAndLogo(); updateThemeButtonLabel();
}
function updateThemeButtonLabel() {
  const btn = document.querySelector("#theme-toggle");
  if (btn) btn.textContent = `Theme: ${document.documentElement.getAttribute("data-theme") || "auto"}`;
}
function applyHeroAndLogo() {
  const root = document.documentElement;
  const isDark = root.getAttribute("data-theme") === "dark" || (root.getAttribute("data-theme") === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const logo = document.querySelector("img.logo"); if (logo) logo.src = window.SITE.pages.logo;
  document.querySelectorAll(".brand strong").forEach(el => el.textContent = window.SITE.siteName);
  const heroStart = document.querySelector("#hero-start"); if (heroStart) heroStart.style.backgroundImage = `url('${isDark ? window.SITE.pages.startHeroDark : window.SITE.pages.startHeroLight}')`;
  const heroKontakt = document.querySelector("#hero-kontakt"); if (heroKontakt) heroKontakt.style.backgroundImage = `url('${window.SITE.pages.kontaktHero}')`;
}
function markActiveNav() {
  const path = location.pathname.replace(/\/+$/, "");
  document.querySelectorAll(".nav-links a[data-href]").forEach(a => {
    const href = (a.getAttribute("data-href")||"").replace(/\/+$/, "");
    if (!href) return;
    if (href === path || (href.endsWith("index.html") && (path === "" || path.endsWith("/")))) a.classList.add("active");
  });
}
function setupThemeToggle(){ const btn=document.querySelector("#theme-toggle"); if(btn) btn.addEventListener("click",cycleTheme); }

// ===== Storage =====
const store = {
  get(k, f){ try{ return JSON.parse(localStorage.getItem(k)) ?? f; } catch{ return f; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};

// ===== Kontakt-Form speichert Einträge =====
function setupKontaktForm(){
  const form = document.querySelector("#kontakt-form"); if(!form) return;
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const patient=form.patient?.value||"", vorname=form.vorname?.value?.trim()||"", nachname=form.nachname?.value?.trim()||"", email=form.email?.value?.trim()||"", tel=form.tel?.value?.trim()||"", sympt=form.symptome?.value?.trim()||"";
    if(!vorname || !nachname || !email || !tel || !patient){ alert("Bitte fülle alle Pflichtfelder aus."); return; }
    const submissions=store.get("submissions",[]); const id=crypto?.randomUUID?crypto.randomUUID():String(Date.now());
    submissions.push({ id, ts:new Date().toISOString(), patient, vorname, nachname, email, tel, sympt, status:"Termin nicht vergeben" });
    store.set("submissions",submissions);
    alert("Danke! Deine Anfrage wurde gespeichert. Wir melden uns zeitnah."); form.reset();
  });
}

// ===== Auth (Demo) =====
function isAuthed(){ return store.get("auth",{ok:false}).ok===true; }
function tryLogin(user, pass){ const ok=(user===window.SITE.auth.demoUser && pass===window.SITE.auth.demoPass); store.set("auth",{ok}); return ok; }
function logout(){ store.set("auth",{ok:false}); location.reload(); }

// ===== Logbuch =====
function renderLogbook(){
  const tbody=document.querySelector("#logbook-body"); if(!tbody) return;
  const submissions=store.get("submissions",[]);
  tbody.innerHTML = submissions.length ? "" : `<tr><td colspan="8" class="muted">Noch keine Einträge.</td></tr>`;
  submissions.sort((a,b)=>new Date(b.ts)-new Date(a.ts)).forEach(s=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${new Date(s.ts).toLocaleString()}</td>
      <td>${s.patient}</td>
      <td>${s.vorname} ${s.nachname}</td>
      <td>${s.email}<br><span class="muted">${s.tel}</span></td>
      <td style="white-space:pre-wrap">${escapeHtml(s.sympt)}</td>
      <td>
        <select data-id="${s.id}" class="select status-select">
          <option ${s.status==="Termin nicht vergeben"?"selected":""}>Termin nicht vergeben</option>
          <option ${s.status==="Termin vergeben"?"selected":""}>Termin vergeben</option>
        </select>
      </td>
      <td><button class="btn secondary btn-assign" data-id="${s.id}" type="button">Kalender</button></td>
      <td><button class="btn danger btn-delete" data-id="${s.id}" type="button" aria-label="Patient löschen">Löschen</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll(".status-select").forEach(sel=>{
    sel.addEventListener("change",(e)=>{
      const id=e.target.getAttribute("data-id"); const subs=store.get("submissions",[]); const s=subs.find(x=>x.id===id); if(s){ s.status=e.target.value; store.set("submissions",subs); }
    });
  });
  tbody.querySelectorAll(".btn-assign").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.getAttribute("data-id"); const select=document.querySelector("#calendar-submission"); if(!select) return;
      select.value=id; document.querySelector("#calendar-anchor")?.scrollIntoView({behavior:"smooth",block:"start"});
    });
  });
  tbody.querySelectorAll(".btn-delete").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.getAttribute("data-id");
      if(!confirm("Eintrag wirklich löschen? Zugehörige Termine werden ebenfalls entfernt.")) return;
      deleteSubmission(id);
      renderLogbook(); renderSubmissionOptions(); renderCalendar(); // UI aktualisieren
    });
  });
}
function deleteSubmission(id){
  // Submission entfernen
  const subs=store.get("submissions",[]).filter(s=>s.id!==id);
  store.set("submissions", subs);
  // Verknüpfte Termine entfernen
  const appts=store.get("appointments",[]).filter(a=>a.id!==id);
  store.set("appointments", appts);
}
function escapeHtml(str){ return String(str).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }
function renderSubmissionOptions(){
  const select=document.querySelector("#calendar-submission"); if(!select) return;
  const subs=store.get("submissions",[]);
  select.innerHTML = `<option value="">— Patient wählen —</option>` + subs.map(s=>`<option value="${s.id}">${s.vorname} ${s.nachname} (${s.patient})</option>`).join("");
}

// ===== CSV-Export (Anfragen) =====
function exportSubmissionsCSV(){
  const subs=store.get("submissions",[]); if(!subs.length){ alert("Keine Anfragen zum Exportieren."); return; }
  const header=["id","timestamp","patient","vorname","nachname","email","telefon","status","symptome"];
  const rows=subs.map(s=>[s.id,s.ts,s.patient,s.vorname,s.nachname,s.email,s.tel,s.status,s.sympt.replace(/\r?\n/g," / ")]);
  const csv=[header,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="anfragen_logbuch.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ===== Kalender Helpers =====
function hourSlots(){
  const slots=[]; const {startHour,endHour}=window.SITE.calendar;
  for(let h=startHour; h<=endHour; h++){ slots.push(`${String(h).padStart(2,"0")}:00`); }
  return slots;
}
function startOfISOWeek(d){
  const date=new Date(d); const day=(date.getDay()+6)%7; // Mo=0
  date.setHours(0,0,0,0); date.setDate(date.getDate()-day); return date;
}
function addDays(d, n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function fmtDateISO(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function getISOWeek(d){
  const date=new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// ===== Kalender State & Rendering (WOCHE/MONAT) =====
const CalState = { mode: "week", anchor: new Date() };

// Modal (Pop-up)
function openModal(html){
  const overlay=document.querySelector("#modal"); const box=document.querySelector("#modal-box");
  if(!overlay || !box) return;
  box.innerHTML = html;
  overlay.style.display="grid";
  document.body.style.overflow="hidden";
}
function closeModal(){
  const overlay=document.querySelector("#modal");
  if(!overlay) return;
  overlay.style.display="none";
  document.body.style.overflow="";
}

function setupCalendarAssign(){
  const form=document.querySelector("#calendar-form"); if(!form) return;
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const date=form.date.value, time=form.time.value, id=form.submission.value;
    if(!date || !time || !id){ alert("Bitte Datum, Uhrzeit und Patient wählen."); return; }
    const appts=store.get("appointments",[]);
    if(appts.find(a=>a.date===date && a.time===time)){ alert("Dieser Slot ist bereits belegt."); return; }
    appts.push({id, date, time}); store.set("appointments",appts);
    alert("Termin eingetragen.");
    renderCalendar();
  });
}

function renderCalendarHeaderWeek(start){
  const header=document.querySelector("#calendar-header"); if(!header) return;
  const end=addDays(start,6);
  const kw=getISOWeek(start);
  const fmt=(d)=>d.toLocaleDateString(undefined,{day:"2-digit",month:"2-digit"});
  header.textContent = `KW ${kw} · ${fmt(start)} – ${fmt(end)}`;
}
function renderCalendarWeek(){
  const cal=document.querySelector("#calendar"); if(!cal) return;
  cal.innerHTML="";
  const slots=hourSlots();
  const subs=store.get("submissions",[]); const appts=store.get("appointments",[]);
  const weekStart=startOfISOWeek(CalState.anchor);
  renderCalendarHeaderWeek(weekStart);

  for(let i=0;i<7;i++){
    const dayDate=addDays(weekStart,i);
    const dateISO=fmtDateISO(dayDate);
    const cell=document.createElement("div"); cell.className="day";
    const h=document.createElement("h4"); h.textContent = `${dayDate.toLocaleDateString(undefined,{weekday:"short"})} ${dayDate.getDate()}.`; cell.appendChild(h);
    const list=document.createElement("div");
    slots.forEach(t=>{
      const row=document.createElement("div"); row.className="slot-row";
      const timeSpan=document.createElement("span"); timeSpan.className="slot-time"; timeSpan.textContent=t;
      const match=appts.find(a=>a.date===dateISO && a.time===t);
      const content=document.createElement("button"); // klickbar
      content.type="button";
      if(match){
        const s=subs.find(x=>x.id===match.id);
        content.className="badge appt-badge";
        content.dataset.id = match.id;
        content.dataset.date = match.date;
        content.dataset.time = match.time;
        content.textContent = s ? `${s.vorname} ${s.nachname}` : "Belegt";
      } else {
        content.className="slot-free muted";
        content.textContent="frei";
        content.disabled = true;
      }
      row.appendChild(timeSpan); row.appendChild(content); list.appendChild(row);
    });
    cell.appendChild(list); cal.appendChild(cell);
  }

  // Badge-Klicks -> Modal
  cal.querySelectorAll(".appt-badge").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.dataset.id, date=btn.dataset.date, time=btn.dataset.time;
      const s = store.get("submissions",[]).find(x=>x.id===id);
      if(!s) return;
      const html = renderSubmissionModalHTML(s, {date, time});
      openModal(html);
      wireModalButtons(id);
    });
  });
}

function renderCalendarMonth(){
  const cal=document.querySelector("#calendar"); const header=document.querySelector("#calendar-header"); if(!cal||!header) return;
  const anchor=new Date(CalState.anchor);
  const year=anchor.getFullYear(), month=anchor.getMonth();
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const startDay=(first.getDay()+6)%7, days=last.getDate();
  header.textContent = first.toLocaleString(undefined,{month:"long",year:"numeric"});
  cal.innerHTML="";
  const subs=store.get("submissions",[]), appts=store.get("appointments",[]), slots=hourSlots();
  for(let i=0;i<startDay;i++) cal.appendChild(document.createElement("div"));
  for(let d=1; d<=days; d++){
    const cell=document.createElement("div"); cell.className="day";
    const dateISO=fmtDateISO(new Date(year,month,d));
    const h=document.createElement("h4"); h.textContent=`${d}.`; cell.appendChild(h);
    const list=document.createElement("div");
    slots.forEach(t=>{
      const row=document.createElement("div"); row.className="slot-row";
      const timeSpan=document.createElement("span"); timeSpan.className="slot-time"; timeSpan.textContent=t;
      const match=appts.find(a=>a.date===dateISO && a.time===t);
      const content=document.createElement("button");
      content.type="button";
      if(match){
        const s=subs.find(x=>x.id===match.id);
        content.className="badge appt-badge";
        content.dataset.id=match.id; content.dataset.date=match.date; content.dataset.time=match.time;
        content.textContent = s ? `${s.vorname} ${s.nachname}` : "Belegt";
      } else { content.className="slot-free muted"; content.textContent="frei"; content.disabled=true; }
      row.appendChild(timeSpan); row.appendChild(content); list.appendChild(row);
    });
    cell.appendChild(list); cal.appendChild(cell);
  }
  cal.querySelectorAll(".appt-badge").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id=btn.dataset.id, date=btn.dataset.date, time=btn.dataset.time;
      const s = store.get("submissions",[]).find(x=>x.id===id);
      if(!s) return;
      const html = renderSubmissionModalHTML(s, {date, time});
      openModal(html);
      wireModalButtons(id);
    });
  });
}

function renderSubmissionModalHTML(s, appt){
  return `
    <div class="modal-head">
      <h3>Termin – ${s.vorname} ${s.nachname}</h3>
      <button class="btn secondary modal-close" type="button">Schließen</button>
    </div>
    <div class="modal-grid">
      <div>
        <p><strong>Patientenstatus:</strong> ${s.patient}</p>
        <p><strong>E-Mail:</strong> <a href="mailto:${s.email}">${s.email}</a></p>
        <p><strong>Telefon:</strong> ${s.tel}</p>
        <p><strong>Status:</strong> <span class="badge">${s.status}</span></p>
        <p><strong>Anfrage:</strong> ${new Date(s.ts).toLocaleString()}</p>
      </div>
      <div>
        <p><strong>Termin:</strong> ${appt.date} · ${appt.time} Uhr</p>
        <p><strong>Symptome:</strong></p>
        <p class="modal-sympt">${escapeHtml(s.sympt)}</p>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn danger modal-delete" data-id="${s.id}" type="button">Patient löschen</button>
    </div>
  `;
}
function wireModalButtons(id){
  const closeBtns=document.querySelectorAll(".modal-close, #modal");
  closeBtns.forEach(el=>{
    el.addEventListener("click",(e)=>{ if(e.target.id==="modal" || el.classList.contains("modal-close")) closeModal(); });
  });
  const delBtn=document.querySelector(".modal-delete");
  if(delBtn){
    delBtn.addEventListener("click",()=>{
      if(!confirm("Eintrag wirklich löschen? Zugehörige Termine werden ebenfalls entfernt.")) return;
      deleteSubmission(id);
      closeModal();
      renderLogbook(); renderSubmissionOptions(); renderCalendar();
    });
  }
}

function renderCalendar(){
  if(CalState.mode==="week") renderCalendarWeek(); else renderCalendarMonth();
  const prev=document.querySelector("#cal-prev"), next=document.querySelector("#cal-next");
  if(prev && next){
    prev.onclick = ()=>{
      CalState.anchor = CalState.mode==="week" ? addDays(CalState.anchor,-7) : new Date(CalState.anchor.getFullYear(), CalState.anchor.getMonth()-1, 1);
      renderCalendar();
    };
    next.onclick = ()=>{
      CalState.anchor = CalState.mode==="week" ? addDays(CalState.anchor, +7) : new Date(CalState.anchor.getFullYear(), CalState.anchor.getMonth()+1, 1);
      renderCalendar();
    };
  }
}

function initMitarbeiterbereich(){
  const loginForm=document.querySelector("#login-form");
  const app=document.querySelector("#staff-app");
  const logoutBtn=document.querySelector("#logout-btn");
  const exportBtn=document.querySelector("#export-csv");
  const modeMonth=document.querySelector("#cal-mode-month");
  const modeWeek=document.querySelector("#cal-mode-week");

  if(!loginForm && !app) return;

  if(!isAuthed()){
    if(loginForm){
      loginForm.addEventListener("submit",(e)=>{
        e.preventDefault();
        const user=loginForm.user.value.trim(), pass=loginForm.pass.value;
        if(tryLogin(user,pass)) location.reload(); else alert("Login fehlgeschlagen.");
      });
    }
    if(app) app.style.display="none";
    return;
  }

  const loginCard=document.querySelector("#login-card"); if(loginCard) loginCard.style.display="none";
  if(app) app.style.display="";

  if(logoutBtn) logoutBtn.addEventListener("click",logout);
  if(exportBtn) exportBtn.addEventListener("click",exportSubmissionsCSV);
  if(modeMonth) modeMonth.addEventListener("click",()=>{ CalState.mode="month"; renderCalendar(); });
  if(modeWeek) modeWeek.addEventListener("click",()=>{ CalState.mode="week"; renderCalendar(); });

  renderLogbook(); renderSubmissionOptions(); setupCalendarAssign();

  CalState.mode="week"; CalState.anchor=new Date(); renderCalendar();
}

document.addEventListener("DOMContentLoaded",()=>{
  setThemeFromPreference(); applyHeroAndLogo(); markActiveNav(); setupThemeToggle();
  setupKontaktForm(); initMitarbeiterbereich();
  if(window.matchMedia){
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ setThemeFromPreference(); applyHeroAndLogo(); });
  }
});

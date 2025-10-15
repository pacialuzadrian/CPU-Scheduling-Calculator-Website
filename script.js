let processes = [];

function addProcess() {
  const pid = pidEl.value.trim();
  const arrival = Number(arrivalEl.value);
  const burst = Number(burstEl.value);
  if (!pid || isNaN(arrival) || isNaN(burst)) return;
  processes.push({ pid, arrival, burst });
  pidEl.value = arrivalEl.value = burstEl.value = "";
  renderProcesses();
}
function clearProcesses() {
  processes = [];
  renderProcesses();
  document.getElementById('results').innerHTML = "";
}
function renderProcesses() {
  const tbody = document.querySelector("#procTable tbody");
  tbody.innerHTML = processes.map(p => `<tr><td>${p.pid}</td><td>${p.arrival}</td><td>${p.burst}</td></tr>`).join("");
}
function toggleQuantum() {
  const algo = document.getElementById('algo').value;
  document.getElementById('quantumBox').style.display = algo === "RR" ? "inline-block" : "none";
}

function compute() {
  const algo = document.getElementById('algo').value;
  if (processes.length === 0) return;
  let results;
  if (algo === "FCFS") results = doFCFS();
  else if (algo === "SJF") results = doSJF();
  else if (algo === "RR") results = doRR(Number(document.getElementById('quantum').value));
  displayResults(results);
}

function doFCFS() {
  const procs = [...processes].sort((a,b)=>a.arrival-b.arrival);
  let time = 0, results = [];
  for (const p of procs) {
    const start = Math.max(time, p.arrival);
    const end = start + p.burst;
    results.push({ ...p, start, completion:end, tat:end-p.arrival, wt:start-p.arrival });
    time = end;
  }
  return results;
}
function doSJF() {
  const procs = processes.map(p => ({...p, remaining:p.burst, done:false}));
  let time = 0, completed = 0, results = [];
  while (completed < procs.length) {
    const available = procs.filter(p=>!p.done && p.arrival<=time);
    if (available.length===0) { time++; continue; }
    const p = available.reduce((a,b)=>a.burst<b.burst?a:b);
    const start = Math.max(time,p.arrival);
    const end = start + p.burst;
    results.push({ ...p, start, completion:end, tat:end-p.arrival, wt:start-p.arrival });
    p.done = true; completed++; time = end;
  }
  return results;
}
function doRR(q) {
  const procs = processes.map(p => ({...p, remaining:p.burst})).sort((a,b)=>a.arrival-b.arrival);
  let time = 0, queue = [], idx = 0, results = [], doneCount = 0;
  const resMap = {};
  while (doneCount < procs.length) {
    while (idx<procs.length && procs[idx].arrival<=time) queue.push(procs[idx++]);
    if (queue.length===0){time++;continue;}
    const cur = queue.shift();
    const exec = Math.min(q, cur.remaining);
    const start = time;
    const end = time + exec;
    if (!resMap[cur.pid]) resMap[cur.pid] = { ...cur, start };
    cur.remaining -= exec; time = end;
    while (idx<procs.length && procs[idx].arrival<=time) queue.push(procs[idx++]);
    if (cur.remaining>0) queue.push(cur);
    else {
      resMap[cur.pid].completion = time;
      resMap[cur.pid].tat = time - cur.arrival;
      resMap[cur.pid].wt = resMap[cur.pid].tat - cur.burst;
      results.push(resMap[cur.pid]);
      doneCount++;
    }
  }
  return results;
}

function displayResults(res) {
  const avgTAT = (res.reduce((s,r)=>s+r.tat,0)/res.length).toFixed(2);
  const avgWT = (res.reduce((s,r)=>s+r.wt,0)/res.length).toFixed(2);
  const table = `
  <table>
    <thead><tr><th>PID</th><th>Arrival</th><th>Burst</th><th>Start</th><th>Completion</th><th>TAT</th><th>WT</th></tr></thead>
    <tbody>${res.map(r=>`<tr><td>${r.pid}</td><td>${r.arrival}</td><td>${r.burst}</td><td>${r.start}</td><td>${r.completion}</td><td>${r.tat}</td><td>${r.wt}</td></tr>`).join("")}</tbody>
    <tfoot><tr><th colspan="5">Average</th><th>${avgTAT}</th><th>${avgWT}</th></tr></tfoot>
  </table>`;
  document.getElementById('results').innerHTML = table;
}

const pidEl = document.getElementById('pid');
const arrivalEl = document.getElementById('arrival');
const burstEl = document.getElementById('burst');

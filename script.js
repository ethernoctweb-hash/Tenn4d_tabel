'use strict';

const STORAGE_KEY = 'tenn4dCashdropData';
const DEFAULT_DATA = [
  {account:'CASHDROP', type:'VVIP', number:'_', claim:250000, status:'Success'},
  {account:'CASHDROP', type:'VVIP', number:'0813-xxxx-7754', claim:150000, status:'Success'},
  {account:'REGULER', type:'VIP', number:'0822-xxxx-4511', claim:100000, status:'Success'},
  {account:'CASHDROP', type:'VVIP', number:'0812-xxxx-1820', claim:50000, status:'Success'},
  {account:'REGULER', type:'VIP', number:'0822-xxxx-7890', claim:75000, status:'Success'},
  {account:'REGULER', type:'VIP', number:'0853-xxxx-1719', claim:200000, status:'Menunggu'},
  {account:'CASHDROP', type:'VVIP', number:'0813-xxxx-0021', claim:50000, status:'Success'}
];
let rows = [];
let selectedIndex = 0;

const $ = id => document.getElementById(id);
const tbody = $('tableBody');
const form = $('editForm');
const editorPanel = $('editorPanel');

function cloneDefaults(){ return DEFAULT_DATA.map(row => ({...row})); }
function formatRupiah(value){
  const amount = Number(value) || 0;
  return 'Rp ' + new Intl.NumberFormat('id-ID', {maximumFractionDigits:0}).format(amount);
}
function crownIcon(){
  return '<svg class="account-icon vip" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h20l-1.5 3h-17ZM2 7l5 4 5-8 5 8 5-4-2 10H4Z"/><circle cx="2" cy="5" r="2"/><circle cx="12" cy="2" r="2"/><circle cx="22" cy="5" r="2"/></svg>';
}
function memberIcon(){
  return '<svg class="account-icon member" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-9 10v-3a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8v3Z"/></svg>';
}
function statusMarkup(status){
  if(status === 'Menunggu') return '<span class="status-pill waiting"><span class="status-icon">◷</span><span>Menunggu</span></span>';
  return '<span class="status-pill success"><span class="status-icon">✓</span><span>Success</span></span>';
}
function renderTable(){
  tbody.replaceChildren();
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    const account = document.createElement('td');
    account.innerHTML = '<div class="account-cell">' + (row.account === 'VIP' ? crownIcon() : memberIcon()) + '<span></span></div>';
    account.querySelector('.account-cell span').textContent = row.account;
    const type = document.createElement('td'); type.textContent = row.type;
    const number = document.createElement('td'); number.textContent = row.number;
    const claim = document.createElement('td'); claim.className = 'claim'; claim.textContent = formatRupiah(row.claim);
    const status = document.createElement('td'); status.innerHTML = statusMarkup(row.status);
    [account,type,number,claim,status].forEach(td => tr.appendChild(td));
    tr.title = 'Pilih baris ' + (index + 1) + ' untuk diedit';
    tr.addEventListener('click', () => { selectedIndex = index; syncEditor(); highlightSelected(); });
    tbody.appendChild(tr);
  });
  $('rowCount').textContent = rows.length + ' baris';
  updateRowSelect();
  highlightSelected();
}
function highlightSelected(){
  [...tbody.rows].forEach((tr,i) => {
    tr.style.outline = i === selectedIndex && editorPanel.hidden === false ? '1px solid #f5c52d' : '';
    tr.style.outlineOffset = '-2px';
  });
}
function updateRowSelect(){
  const select = $('rowSelect');
  select.replaceChildren();
  rows.forEach((row,i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `Baris ${i+1} — ${row.account} / ${row.number}`;
    select.appendChild(option);
  });
  if(rows.length){ selectedIndex = Math.max(0,Math.min(selectedIndex,rows.length-1)); select.value = String(selectedIndex); }
}
function syncEditor(){
  if(!rows.length){
    form.reset(); $('accountInput').value='Member'; $('statusInput').value='Success';
    $('rowSelect').value=''; $('saveBtn').textContent='Simpan'; highlightSelected(); return;
  }
  const row = rows[selectedIndex];
  $('rowSelect').value = String(selectedIndex);
  $('accountInput').value = row.account;
  $('typeInput').value = row.type;
  $('numberInput').value = row.number;
  $('claimInput').value = row.claim;
  $('statusInput').value = row.status;
  $('saveBtn').textContent = 'Simpan Perubahan';
  highlightSelected();
}
function saveData(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); showNotice('Data tersimpan otomatis di perangkat ini.'); }
  catch(error){ showNotice('Gagal menyimpan localStorage. Periksa izin penyimpanan browser.', true); }
}
function loadData(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    if(saved !== null){
      const parsed = JSON.parse(saved);
      if(Array.isArray(parsed)) rows = parsed.filter(isValidRow).map(normalizeRow);
      else rows = cloneDefaults();
    } else rows = cloneDefaults();
  }catch(error){ rows = cloneDefaults(); showNotice('Data lokal tidak dapat dibaca; data contoh dimuat.', true); }
}
function isValidRow(row){
  return row && ['VIP','Member'].includes(row.account) && typeof row.type === 'string' &&
    typeof row.number === 'string' && Number.isFinite(Number(row.claim)) &&
    ['Success','Menunggu'].includes(row.status);
}
function normalizeRow(row){
  return {account:row.account,type:String(row.type),number:String(row.number),claim:Math.max(0,Number(row.claim)||0),status:row.status};
}
function formatIndonesianPhone(value, force=false){
  const original = String(value || '').trim();
  const digitsOnly = original.replace(/\D/g, '');
  const hasCountryCode = /^\s*\+?62/.test(original) || digitsOnly.startsWith('62');
  const looksLikePhone = hasCountryCode || /^0?8/.test(digitsOnly);
  if (!looksLikePhone) return original; // Keep selected numbers such as 8247, 317, or 6391 unchanged.

  let digits = digitsOnly;
  if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  else if (digits.startsWith('8')) digits = '0' + digits;

  // Format only a complete mobile number, avoiding disruption while a number is still being typed.
  if (!force && digits.length < 10) return original;
  if (digits.length < 10 || digits.length > 13 || !digits.startsWith('08')) return original;
  return digits.slice(0, 4) + '-' + digits.slice(4, 8) + (digits.length > 8 ? '-' + digits.slice(8) : '');
}
function readForm(){
  return {account:$('accountInput').value,type:$('typeInput').value.trim(),number:formatIndonesianPhone($('numberInput').value, true),
    claim:Math.max(0,Number($('claimInput').value)||0),status:$('statusInput').value};
}
function addRow(){
  rows.push({account:'Member',type:'4D',number:'0000',claim:0,status:'Menunggu'});
  selectedIndex = rows.length - 1;
  renderTable(); syncEditor(); saveData();
  $('typeInput').focus();
}
function editRow(){
  if(!rows.length){ showNotice('Belum ada baris. Tekan Tambah Baris terlebih dahulu.', true); return; }
  rows[selectedIndex] = readForm();
  renderTable(); syncEditor(); saveData();
}
function deleteRow(){
  if(!rows.length){ showNotice('Tidak ada baris untuk dihapus.', true); return; }
  rows.splice(selectedIndex,1);
  selectedIndex = Math.max(0,selectedIndex-1);
  renderTable(); syncEditor(); saveData();
  showNotice('Baris berhasil dihapus.');
}
function resetData(){
  rows = cloneDefaults(); selectedIndex = 0;
  renderTable(); syncEditor(); saveData();
  showNotice('Data contoh berhasil dipulihkan.');
}
function showNotice(message, isError=false){
  const notice = $('notice'); notice.textContent = message;
  notice.classList.toggle('error', isError);
}
async function downloadTable(){
  const btn = $('downloadBtn');
  if(typeof window.html2canvas !== 'function'){
    showNotice('Fitur PNG belum tersedia. Periksa koneksi internet lalu muat ulang halaman agar html2canvas dapat dimuat.', true);
    return;
  }
  const banner = document.querySelector('.banner');
  if(!banner.complete || banner.naturalWidth === 0){
    try { await new Promise((resolve,reject) => { banner.onload=resolve; banner.onerror=reject; if(banner.complete && banner.naturalWidth) resolve(); }); }
    catch(error){ showNotice('Gambar header gagal dimuat. Periksa file assets/img/cashdrop-header.png.', true); return; }
  }
  btn.disabled = true; btn.textContent = 'MENYIAPKAN PNG…';
  try{
    const canvas = await window.html2canvas($('captureArea'),{
      backgroundColor:'#070c11',scale:3,useCORS:true,allowTaint:false,
      logging:false, imageTimeout:10000, scrollX:0,scrollY:0
    });
    const blob = await new Promise((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG kosong')), 'image/png'));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'TENN4D-CASHDROP-TERPILIH.png';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showNotice('PNG header dan seluruh tabel berhasil dibuat.');
  }catch(error){
    console.error(error); showNotice('Gagal membuat PNG. Coba muat ulang halaman dan pastikan gambar header tersedia.', true);
  }finally{ btn.disabled=false; btn.textContent='⬇ DOWNLOAD TABEL'; }
}

form.addEventListener('submit', event => { event.preventDefault(); if(!form.reportValidity()) return; editRow(); });
$('toggleEditor').addEventListener('click', () => {
  editorPanel.hidden = !editorPanel.hidden;
  $('toggleEditor').textContent = editorPanel.hidden ? '⚙ EDIT / CUSTOM DATA' : '✕ TUTUP EDITOR';
  if(!editorPanel.hidden) syncEditor();
  highlightSelected();
});
$('rowSelect').addEventListener('change', event => { selectedIndex = Number(event.target.value)||0; syncEditor(); });
// Auto-normalize pasted or typed Indonesian mobile numbers in the Nomor Terpilih field.
$('numberInput').addEventListener('input', event => {
  const input = event.target;
  const formatted = formatIndonesianPhone(input.value, false);
  if (formatted !== input.value) {
    const cursorAtEnd = input.selectionStart === input.value.length;
    input.value = formatted;
    if (cursorAtEnd) input.setSelectionRange(input.value.length, input.value.length);
  }
});
$('numberInput').addEventListener('blur', event => {
  event.target.value = formatIndonesianPhone(event.target.value, true);
});
$('addBtn').addEventListener('click', addRow);
$('deleteBtn').addEventListener('click', deleteRow);
$('cancelBtn').addEventListener('click', syncEditor);
$('resetBtn').addEventListener('click', () => {
  if(window.confirm('Kembalikan seluruh data ke data contoh awal?')) resetData();
});
$('downloadBtn').addEventListener('click', downloadTable);

loadData();
renderTable();
syncEditor();

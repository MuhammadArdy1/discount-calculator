/**
 * ================================================================
 * KALKULATOR FINANSIAL v2.0 — script.js
 * Fitur: Kalkulator Diskon + Compound Interest + Multi Mata Uang
 * ================================================================
 */

/* ----------------------------------------------------------------
   1. STATE — mata uang aktif
   ---------------------------------------------------------------- */
let currency = { code: 'IDR', symbol: 'Rp', locale: 'id-ID' };

/* ----------------------------------------------------------------
   2. FORMAT ANGKA sesuai mata uang aktif
   ---------------------------------------------------------------- */
function formatMoney(angka) {
  if (currency.code === 'JPY') {
    return currency.symbol + ' ' + Math.round(angka).toLocaleString(currency.locale);
  }
  return currency.symbol + ' ' + angka.toLocaleString(currency.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

/* ----------------------------------------------------------------
   3. PARSE INPUT — hapus semua non-digit/titik/koma
   ---------------------------------------------------------------- */
function parseInput(str) {
  // Hapus semua karakter selain digit, titik, koma
  const bersih = str.replace(/[^\d.,]/g, '').replace(/[.,]/g, '');
  return parseInt(bersih, 10);
}

/* ----------------------------------------------------------------
   4. AUTO FORMAT HARGA SAAT MENGETIK
   ---------------------------------------------------------------- */
function autoFormatPrice(e) {
  const raw = e.target.value.replace(/\D/g, '');
  if (!raw) { e.target.value = ''; return; }
  e.target.value = parseInt(raw, 10).toLocaleString(currency.locale);
}

/* ----------------------------------------------------------------
   5. ERROR HELPERS
   ---------------------------------------------------------------- */
function showError(wrap, errEl, pesan) {
  wrap.classList.add('has-error');
  errEl.textContent = pesan;
  errEl.classList.add('visible');
}
function clearError(wrap, errEl) {
  wrap.classList.remove('has-error');
  errEl.textContent = '';
  errEl.classList.remove('visible');
}

/* ----------------------------------------------------------------
   6. DOM REFERENCES
   ---------------------------------------------------------------- */
// Tab
const tabDiskon   = document.getElementById('tabDiskon');
const tabCompound = document.getElementById('tabCompound');
const panelDiskon   = document.getElementById('panelDiskon');
const panelCompound = document.getElementById('panelCompound');
const resultCard    = document.getElementById('resultCard');
const resultCompound = document.getElementById('resultCompound');

// Currency
const currencyPills = document.getElementById('currencyPills');
const prefixDiskon   = document.getElementById('prefixDiskon');
const prefixCompound = document.getElementById('prefixCompound');

// Diskon inputs
const inputPrice    = document.getElementById('originalPrice');
const inputDiscount = document.getElementById('discountPercent');
const slider        = document.getElementById('discountSlider');
const btnCalculate  = document.getElementById('btnCalculate');
const btnReset      = document.getElementById('btnReset');
const wrapPrice     = document.querySelector('#field-price .input-wrap');
const wrapDiscount  = document.querySelector('#field-discount .input-wrap');
const errPrice      = document.getElementById('err-price');
const errDiscount   = document.getElementById('err-discount');

// Diskon hasil
const elFinalPrice   = document.getElementById('finalPrice');
const elSavings      = document.getElementById('savings');
const elOrigRef      = document.getElementById('origRef');
const elRingPct      = document.getElementById('ringPct');
const elRingProgress = document.getElementById('ringProgress');
const elBadge        = document.getElementById('savingsBadge');

// Compound inputs
const inputPrincipal  = document.getElementById('principal');
const inputRate       = document.getElementById('interestRate');
const inputYears      = document.getElementById('years');
const selectFreq      = document.getElementById('compoundFreq');
const yearsSlider     = document.getElementById('yearsSlider');
const btnCompound     = document.getElementById('btnCompound');
const btnResetCompound= document.getElementById('btnResetCompound');
const wrapPrincipal   = document.querySelector('#panelCompound .input-wrap');

// Compound hasil
const elCompFinal     = document.getElementById('compFinalValue');
const elCompPrincipal = document.getElementById('compPrincipal');
const elCompInterest  = document.getElementById('compInterest');
const elCompGain      = document.getElementById('compGain');
const elGrowthTable   = document.getElementById('growthTable');
const elCompBadge     = document.getElementById('compBadge');

const RING_CIRCUMFERENCE = 2 * Math.PI * 50;

/* ----------------------------------------------------------------
   7. TAB SWITCHING
   ---------------------------------------------------------------- */
function switchTab(tab) {
  if (tab === 'diskon') {
    tabDiskon.classList.add('tab-btn--active');
    tabCompound.classList.remove('tab-btn--active');
    tabDiskon.setAttribute('aria-selected', 'true');
    tabCompound.setAttribute('aria-selected', 'false');
    panelDiskon.style.display = '';
    panelCompound.style.display = 'none';
    // Sembunyikan hasil compound
    resultCompound.classList.remove('visible');
    setTimeout(() => { if (!resultCompound.classList.contains('visible')) resultCompound.style.display = 'none'; }, 400);
  } else {
    tabCompound.classList.add('tab-btn--active');
    tabDiskon.classList.remove('tab-btn--active');
    tabCompound.setAttribute('aria-selected', 'true');
    tabDiskon.setAttribute('aria-selected', 'false');
    panelCompound.style.display = '';
    panelDiskon.style.display = 'none';
    // Sembunyikan hasil diskon
    resultCard.classList.remove('visible');
    setTimeout(() => { if (!resultCard.classList.contains('visible')) resultCard.style.display = 'none'; }, 400);
  }
}

tabDiskon.addEventListener('click', () => switchTab('diskon'));
tabCompound.addEventListener('click', () => switchTab('compound'));

/* ----------------------------------------------------------------
   8. PILIH MATA UANG
   ---------------------------------------------------------------- */
currencyPills.addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;

  // Update state
  currency = {
    code:   pill.dataset.currency,
    symbol: pill.dataset.symbol,
    locale: pill.dataset.locale
  };

  // Update UI pills
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('pill--active'));
  pill.classList.add('pill--active');

  // Update prefix label
  prefixDiskon.textContent   = currency.symbol;
  prefixCompound.textContent = currency.symbol;

  // Reset format harga yang sudah diketik
  if (inputPrice.value) {
    const raw = parseInput(inputPrice.value);
    if (!isNaN(raw)) inputPrice.value = raw.toLocaleString(currency.locale);
  }
  if (inputPrincipal.value) {
    const raw = parseInput(inputPrincipal.value);
    if (!isNaN(raw)) inputPrincipal.value = raw.toLocaleString(currency.locale);
  }
});

/* ----------------------------------------------------------------
   9. SLIDER DISKON ↔ INPUT
   ---------------------------------------------------------------- */
function syncSlider(val) {
  const pct = Math.min(100, Math.max(0, val || 0));
  slider.value = pct;
  slider.style.setProperty('--slider-pct', pct + '%');
}

slider.addEventListener('input', () => {
  inputDiscount.value = slider.value;
  syncSlider(Number(slider.value));
  clearError(wrapDiscount, errDiscount);
});

inputDiscount.addEventListener('input', () => {
  syncSlider(parseInt(inputDiscount.value, 10));
  clearError(wrapDiscount, errDiscount);
});

/* ----------------------------------------------------------------
   10. SLIDER TAHUN ↔ INPUT
   ---------------------------------------------------------------- */
function syncYearsSlider(val) {
  const yr = Math.min(50, Math.max(1, val || 1));
  yearsSlider.value = yr;
  yearsSlider.style.setProperty('--slider-pct', ((yr - 1) / 49 * 100) + '%');
}

yearsSlider.addEventListener('input', () => {
  inputYears.value = yearsSlider.value;
  syncYearsSlider(Number(yearsSlider.value));
});

inputYears.addEventListener('input', () => {
  syncYearsSlider(parseInt(inputYears.value, 10));
});

/* ----------------------------------------------------------------
   11. AUTO FORMAT HARGA
   ---------------------------------------------------------------- */
inputPrice.addEventListener('input', (e) => { autoFormatPrice(e); clearError(wrapPrice, errPrice); });
inputPrincipal.addEventListener('input', (e) => { autoFormatPrice(e); });

/* ----------------------------------------------------------------
   12. HITUNG DISKON
   ---------------------------------------------------------------- */
function hitungDiskon() {
  const harga  = parseInput(inputPrice.value);
  const diskon = parseFloat(inputDiscount.value);
  let valid = true;

  if (!inputPrice.value.trim() || isNaN(harga) || harga <= 0) {
    showError(wrapPrice, errPrice, 'Masukkan harga awal yang valid (> 0)'); valid = false;
  } else { clearError(wrapPrice, errPrice); }

  if (!inputDiscount.value.trim() || isNaN(diskon) || diskon < 0 || diskon > 100) {
    showError(wrapDiscount, errDiscount, 'Diskon harus antara 0% dan 100%'); valid = false;
  } else { clearError(wrapDiscount, errDiscount); }

  if (!valid) return;

  const penghematan = (harga * diskon) / 100;
  const hargaAkhir  = harga - penghematan;

  elFinalPrice.textContent = formatMoney(Math.round(hargaAkhir));
  elSavings.textContent    = formatMoney(Math.round(penghematan));
  elOrigRef.textContent    = formatMoney(harga);
  elRingPct.textContent    = diskon + '%';

  const offset = RING_CIRCUMFERENCE * (1 - diskon / 100);
  elRingProgress.style.strokeDashoffset = offset;
  if (diskon >= 40) {
    elRingProgress.classList.add('high');
    elRingPct.style.color = 'var(--emerald)';
  } else {
    elRingProgress.classList.remove('high');
    elRingPct.style.color = 'var(--amber)';
  }

  elBadge.textContent = badgeDiskon(diskon);
  tampilkanHasil(resultCard);
}

function badgeDiskon(d) {
  if (d === 0)   return '😐 Tidak ada diskon — harga tetap.';
  if (d < 10)    return '🤏 Diskon kecil — lumayan buat penghematan harian!';
  if (d < 25)    return '👍 Diskon yang cukup baik!';
  if (d < 50)    return '🔥 Diskon besar — jangan sampai dilewatkan!';
  if (d < 75)    return '🤑 Diskon gila! Ini kesempatan emas.';
  if (d < 100)   return '🚀 Hampir gratis! Borong semua!';
  return                '🎁 Gratis! 100% diskon.';
}

/* ----------------------------------------------------------------
   13. RESET DISKON
   ---------------------------------------------------------------- */
function resetDiskon() {
  inputPrice.value = ''; inputDiscount.value = '';
  syncSlider(0);
  clearError(wrapPrice, errPrice);
  clearError(wrapDiscount, errDiscount);
  sembunyikanHasil(resultCard);
  elRingProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
  elRingProgress.classList.remove('high');
  elRingPct.textContent = '0%';
  elRingPct.style.color = 'var(--amber)';
  inputPrice.focus();
}

/* ----------------------------------------------------------------
   14. HITUNG COMPOUND INTEREST
   Rumus: A = P × (1 + r/n)^(n×t)
   P = modal, r = bunga/tahun (desimal), n = frekuensi, t = tahun
   ---------------------------------------------------------------- */
function hitungCompound() {
  const P = parseInput(inputPrincipal.value);
  const r = parseFloat(inputRate.value) / 100;
  const n = parseInt(selectFreq.value, 10);
  const t = parseInt(inputYears.value, 10);

  let valid = true;
  const wrapPrin = inputPrincipal.closest('.input-wrap');
  const errPrin  = document.getElementById('err-principal');
  const wrapRate = inputRate.closest('.input-wrap');
  const errRate  = document.getElementById('err-rate');
  const wrapYrs  = inputYears.closest('.input-wrap');
  const errYrs   = document.getElementById('err-years');

  if (!inputPrincipal.value.trim() || isNaN(P) || P <= 0) {
    showError(wrapPrin, errPrin, 'Masukkan modal awal yang valid'); valid = false;
  } else { clearError(wrapPrin, errPrin); }

  if (!inputRate.value.trim() || isNaN(r) || r <= 0 || r > 5) {
    showError(wrapRate, errRate, 'Bunga harus antara 0.1% dan 500%'); valid = false;
  } else { clearError(wrapRate, errRate); }

  if (!inputYears.value.trim() || isNaN(t) || t < 1 || t > 50) {
    showError(wrapYrs, errYrs, 'Lama investasi antara 1–50 tahun'); valid = false;
  } else { clearError(wrapYrs, errYrs); }

  if (!valid) return;

  const A = P * Math.pow(1 + r / n, n * t);
  const bunga = A - P;
  const gainPct = ((A - P) / P * 100).toFixed(1);

  elCompFinal.textContent     = formatMoney(Math.round(A));
  elCompPrincipal.textContent = formatMoney(P);
  elCompInterest.textContent  = formatMoney(Math.round(bunga));
  elCompGain.textContent      = '+' + gainPct + '%';

  // Tabel pertumbuhan per tahun
  buatTabelPertumbuhan(P, r, n, t);

  elCompBadge.textContent = badgeCompound(gainPct);
  tampilkanHasil(resultCompound);
}

function buatTabelPertumbuhan(P, r, n, t) {
  elGrowthTable.innerHTML = '';
  // Header
  const header = document.createElement('div');
  header.className = 'growth-row';
  header.style.cssText = 'font-weight:700;color:var(--text-muted);font-size:0.68rem;';
  header.innerHTML = '<span>Thn</span><span style="text-align:right">Nilai</span><span style="text-align:right">Gain</span>';
  elGrowthTable.appendChild(header);

  for (let i = 1; i <= t; i++) {
    const val = P * Math.pow(1 + r / n, n * i);
    const gain = ((val - P) / P * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'growth-row';
    row.innerHTML = `
      <span class="growth-year">${i}</span>
      <span class="growth-val">${formatMoney(Math.round(val))}</span>
      <span class="growth-gain">+${gain}%</span>
    `;
    elGrowthTable.appendChild(row);
  }
}

function badgeCompound(gain) {
  if (gain < 20)   return '🌱 Investasi kecil — tapi konsisten itu kunci!';
  if (gain < 50)   return '📈 Pertumbuhan solid — terus pertahankan!';
  if (gain < 100)  return '🚀 Hampir 2x lipat — kekuatan compounding!';
  if (gain < 500)  return '💰 Lebih dari 2x lipat — luar biasa!';
  return                  '🤯 Uang kamu tumbuh pesat! Compounding bekerja!';
}

/* ----------------------------------------------------------------
   15. RESET COMPOUND
   ---------------------------------------------------------------- */
function resetCompound() {
  inputPrincipal.value = ''; inputRate.value = ''; inputYears.value = '';
  selectFreq.value = '12';
  syncYearsSlider(10);
  sembunyikanHasil(resultCompound);
  inputPrincipal.focus();
}

/* ----------------------------------------------------------------
   16. TAMPILKAN / SEMBUNYIKAN HASIL
   ---------------------------------------------------------------- */
function tampilkanHasil(card) {
  if (!card.classList.contains('visible')) {
    card.style.display = 'flex';
    void card.offsetWidth;
    card.classList.add('visible');
  }
  card.querySelectorAll('.result-value').forEach(el => {
    el.classList.remove('animate-in');
    void el.offsetWidth;
    el.classList.add('animate-in');
  });
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function sembunyikanHasil(card) {
  card.classList.remove('visible');
  setTimeout(() => { card.style.display = 'none'; }, 400);
}

/* ----------------------------------------------------------------
   17. EVENT LISTENERS
   ---------------------------------------------------------------- */
btnCalculate.addEventListener('click', hitungDiskon);
btnReset.addEventListener('click', resetDiskon);
btnCompound.addEventListener('click', hitungCompound);
btnResetCompound.addEventListener('click', resetCompound);

// Enter key
[inputPrice, inputDiscount].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') hitungDiskon(); }));
[inputPrincipal, inputRate, inputYears].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') hitungCompound(); }));

/* ----------------------------------------------------------------
   18. INIT
   ---------------------------------------------------------------- */
(function init() {
  syncSlider(0);
  syncYearsSlider(10);
  resultCard.style.display = 'none';
  resultCompound.style.display = 'none';
})();

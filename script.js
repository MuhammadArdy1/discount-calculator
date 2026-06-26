/**
 * ================================================================
 * KALKULATOR DISKON — script.js
 * Logika: validasi input, kalkulasi, animasi UI, format rupiah
 * ================================================================
 */

/* ----------------------------------------------------------------
   1. SELEKSI ELEMEN DOM
   ---------------------------------------------------------------- */
const inputPrice    = document.getElementById('originalPrice');
const inputDiscount = document.getElementById('discountPercent');
const slider        = document.getElementById('discountSlider');

const btnCalculate  = document.getElementById('btnCalculate');
const btnReset      = document.getElementById('btnReset');

const resultCard    = document.getElementById('resultCard');
const elFinalPrice  = document.getElementById('finalPrice');
const elSavings     = document.getElementById('savings');
const elOrigRef     = document.getElementById('origRef');
const elRingPct     = document.getElementById('ringPct');
const elRingProgress= document.getElementById('ringProgress');
const elBadge       = document.getElementById('savingsBadge');

const wrapPrice     = document.querySelector('#field-price .input-wrap');
const wrapDiscount  = document.querySelector('#field-discount .input-wrap');
const errPrice      = document.getElementById('err-price');
const errDiscount   = document.getElementById('err-discount');

/* Panjang keliling lingkaran SVG (2π × r = 2π × 50 ≈ 314) */
const RING_CIRCUMFERENCE = 2 * Math.PI * 50;

/* ----------------------------------------------------------------
   2. FORMAT ANGKA KE RUPIAH
   Contoh: 150000 → "Rp 150.000"
   ---------------------------------------------------------------- */
function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

/* ----------------------------------------------------------------
   3. PARSE INPUT — hilangkan titik pemisah ribuan sebelum parseInt
   ---------------------------------------------------------------- */
function parseInput(str) {
  // Hapus semua karakter non-digit
  const bersih = str.replace(/\D/g, '');
  return parseInt(bersih, 10);
}

/* ----------------------------------------------------------------
   4. FORMAT HARGA SAAT MENGETIK
   Otomatis sisipkan titik pemisah ribuan (1000 → 1.000)
   ---------------------------------------------------------------- */
function autoFormatPrice(e) {
  const raw = e.target.value.replace(/\D/g, ''); // ambil digit saja
  if (!raw) {
    e.target.value = '';
    return;
  }
  // Format dengan titik
  e.target.value = parseInt(raw, 10).toLocaleString('id-ID');
}

/* ----------------------------------------------------------------
   5. SINKRONISASI SLIDER ↔ INPUT DISKON
   ---------------------------------------------------------------- */
function syncSliderToInput(value) {
  const pct = Math.min(100, Math.max(0, value || 0));
  slider.value = pct;
  // Update CSS custom property untuk fill warna slider
  slider.style.setProperty('--slider-pct', pct + '%');
}

/* Slider digeser → isi input diskon */
slider.addEventListener('input', () => {
  inputDiscount.value = slider.value;
  syncSliderToInput(Number(slider.value));
  clearError(wrapDiscount, errDiscount);
});

/* Input diskon diketik → update slider */
inputDiscount.addEventListener('input', () => {
  const val = parseInt(inputDiscount.value, 10);
  syncSliderToInput(val);
  clearError(wrapDiscount, errDiscount);
});

/* ----------------------------------------------------------------
   6. EVENT LISTENER — AUTO FORMAT HARGA
   ---------------------------------------------------------------- */
inputPrice.addEventListener('input', (e) => {
  autoFormatPrice(e);
  clearError(wrapPrice, errPrice);
});

/* Kursor konsisten di akhir saat fokus */
inputPrice.addEventListener('focus', () => {
  setTimeout(() => {
    inputPrice.setSelectionRange(inputPrice.value.length, inputPrice.value.length);
  }, 0);
});

/* ----------------------------------------------------------------
   7. VALIDASI INPUT
   Mengembalikan true jika valid, false jika tidak
   ---------------------------------------------------------------- */
function validate(harga, diskon) {
  let valid = true;

  // --- Validasi Harga ---
  if (!inputPrice.value.trim() || isNaN(harga) || harga <= 0) {
    showError(wrapPrice, errPrice, 'Masukkan harga awal yang valid (> 0)');
    valid = false;
  } else if (harga > 1_000_000_000_000) {
    showError(wrapPrice, errPrice, 'Harga terlalu besar (maks 1 Triliun)');
    valid = false;
  } else {
    clearError(wrapPrice, errPrice);
  }

  // --- Validasi Diskon ---
  if (!inputDiscount.value.trim() || isNaN(diskon)) {
    showError(wrapDiscount, errDiscount, 'Masukkan persentase diskon (0–100)');
    valid = false;
  } else if (diskon < 0 || diskon > 100) {
    showError(wrapDiscount, errDiscount, 'Diskon harus antara 0% dan 100%');
    valid = false;
  } else {
    clearError(wrapDiscount, errDiscount);
  }

  return valid;
}

/* Tampilkan pesan error */
function showError(wrap, errEl, pesan) {
  wrap.classList.add('has-error');
  errEl.textContent = pesan;
  errEl.classList.add('visible');
}

/* Hapus pesan error */
function clearError(wrap, errEl) {
  wrap.classList.remove('has-error');
  errEl.textContent = '';
  errEl.classList.remove('visible');
}

/* ----------------------------------------------------------------
   8. HITUNG DISKON — logika utama
   ---------------------------------------------------------------- */
function hitungDiskon() {
  const harga  = parseInput(inputPrice.value);
  const diskon = parseFloat(inputDiscount.value);

  // Hentikan jika tidak valid
  if (!validate(harga, diskon)) return;

  /* --- Kalkulasi --- */
  const penghematan = (harga * diskon) / 100;
  const hargaAkhir  = harga - penghematan;

  /* --- Update teks hasil --- */
  elFinalPrice.textContent = formatRupiah(Math.round(hargaAkhir));
  elSavings.textContent    = formatRupiah(Math.round(penghematan));
  elOrigRef.textContent    = formatRupiah(harga);
  elRingPct.textContent    = diskon + '%';

  /* --- Update Ring SVG ---
       stroke-dashoffset bergerak dari 314 (kosong) ke 0 (penuh)
       Rumus: offset = circumference × (1 - diskon/100)
  ---------------------------------------------------------------- */
  const offset = RING_CIRCUMFERENCE * (1 - diskon / 100);
  elRingProgress.style.strokeDashoffset = offset;

  // Warna ring: emerald jika diskon ≥ 40%, kuning amber jika lebih kecil
  if (diskon >= 40) {
    elRingProgress.classList.add('high');
    elRingPct.style.color = 'var(--emerald)';
  } else {
    elRingProgress.classList.remove('high');
    elRingPct.style.color = 'var(--amber)';
  }

  /* --- Badge pesan kontekstual --- */
  elBadge.textContent = generateBadge(diskon);

  /* --- Tampilkan result card dengan animasi --- */
  tampilkanHasil();
}

/* ----------------------------------------------------------------
   9. PESAN BADGE BERDASARKAN BESAR DISKON
   ---------------------------------------------------------------- */
function generateBadge(diskon) {
  if (diskon === 0)        return '😐 Tidak ada diskon — harga tetap.';
  if (diskon < 10)         return '🤏 Diskon kecil — lumayan buat penghematan harian!';
  if (diskon < 25)         return '👍 Diskon yang cukup baik!';
  if (diskon < 50)         return '🔥 Diskon besar — jangan sampai dilewatkan!';
  if (diskon < 75)         return '🤑 Diskon gila! Ini kesempatan emas.';
  if (diskon < 100)        return '🚀 Hampir gratis! Borong semua!';
  return                          '🎁 Gratis! 100% diskon.';
}

/* ----------------------------------------------------------------
   10. TAMPILKAN HASIL DENGAN ANIMASI
   ---------------------------------------------------------------- */
function tampilkanHasil() {
  // Jika belum muncul, set display dulu
  if (!resultCard.classList.contains('visible')) {
    resultCard.style.display = 'flex';
    // Trigger reflow agar transisi berjalan
    void resultCard.offsetWidth;
    resultCard.classList.add('visible');
  }

  // Tambah animasi count-up ke nilai-nilai hasil
  [elFinalPrice, elSavings, elOrigRef].forEach((el) => {
    el.classList.remove('animate-in');
    void el.offsetWidth; // reflow
    el.classList.add('animate-in');
  });

  // Scroll halus ke hasil (berguna di HP)
  setTimeout(() => {
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/* ----------------------------------------------------------------
   11. RESET SEMUA KE AWAL
   ---------------------------------------------------------------- */
function resetSemua() {
  /* Kosongkan input */
  inputPrice.value    = '';
  inputDiscount.value = '';

  /* Reset slider */
  slider.value = 0;
  syncSliderToInput(0);

  /* Hapus error */
  clearError(wrapPrice, errPrice);
  clearError(wrapDiscount, errDiscount);

  /* Sembunyikan result card */
  resultCard.classList.remove('visible');
  setTimeout(() => {
    resultCard.style.display = 'none';
  }, 400); // tunggu transisi selesai

  /* Reset ring */
  elRingProgress.style.strokeDashoffset = RING_CIRCUMFERENCE;
  elRingProgress.classList.remove('high');
  elRingPct.textContent  = '0%';
  elRingPct.style.color  = 'var(--amber)';

  /* Fokus kembali ke input pertama */
  inputPrice.focus();
}

/* ----------------------------------------------------------------
   12. KEYBOARD SHORTCUT — Enter untuk hitung
   ---------------------------------------------------------------- */
function handleEnterKey(e) {
  if (e.key === 'Enter') hitungDiskon();
}

inputPrice.addEventListener('keydown',    handleEnterKey);
inputDiscount.addEventListener('keydown', handleEnterKey);

/* ----------------------------------------------------------------
   13. EVENT LISTENER TOMBOL
   ---------------------------------------------------------------- */
btnCalculate.addEventListener('click', hitungDiskon);
btnReset.addEventListener('click',     resetSemua);

/* ----------------------------------------------------------------
   14. INISIALISASI — pastikan slider dalam posisi 0 saat load
   ---------------------------------------------------------------- */
(function init() {
  syncSliderToInput(0);
  // Pastikan result card tersembunyi
  resultCard.style.display = 'none';
})();

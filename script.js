(function () {
  "use strict";

  /* ===================== CONFIG (from hiring poster) ===================== */
  var SALARY_FULL_MIN = 30000;
  var SALARY_FULL_MAX = 35000;

  function fmt(n) { return n.toLocaleString('en-US'); }

  /* ===================== VIEW NAVIGATION ===================== */
  var views = {
    home: document.getElementById('view-home'),
    details: document.getElementById('view-details'),
    apply: document.getElementById('view-apply')
  };

  function showView(name) {
    Object.keys(views).forEach(function (k) {
      views[k].classList.toggle('hidden', k !== name);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    closeMobileNav();
  }

  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;
    var action = target.getAttribute('data-action');
    if (action === 'view-details') showView('details');
    if (action === 'open-apply') { showView('apply'); initStepper(); goToStep(1); }
    if (action === 'back-home') showView('home');
  });

  /* ===================== MOBILE NAV ===================== */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var mobileNav = document.getElementById('mobileNav');

  function closeMobileNav() {
    mobileNav.classList.remove('open');
    hamburgerBtn.classList.remove('open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  hamburgerBtn.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('open');
    hamburgerBtn.classList.toggle('open', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  });

  mobileNav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMobileNav);
  });

  /* ===================== APPLICATION FORM ===================== */
  var form = document.getElementById('applyForm');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step-panel'));
  var totalSteps = steps.length;
  var currentStep = 1;

  var stepperLabels = [
    'Personal', 'Professional', 'Work Type', 'Schedule', 'CV Upload', 'Additional', 'Review'
  ];

  var stepperEl = document.getElementById('stepper');
  function initStepper() {
    stepperEl.innerHTML = '';
    for (var i = 1; i <= totalSteps; i++) {
      var pill = document.createElement('div');
      pill.className = 'step-pill';
      pill.dataset.step = i;
      pill.innerHTML = '<div class="circle">' + i + '</div><div class="label">' + stepperLabels[i - 1] + '</div>';
      stepperEl.appendChild(pill);
    }
    updateStepperUI();
  }

  function updateStepperUI() {
    var pills = stepperEl.querySelectorAll('.step-pill');
    pills.forEach(function (p) {
      var n = parseInt(p.dataset.step, 10);
      p.classList.toggle('active', n === currentStep);
      p.classList.toggle('done', n < currentStep);
    });
  }

  function goToStep(n) {
    currentStep = n;
    steps.forEach(function (s) {
      s.classList.toggle('hidden', parseInt(s.dataset.step, 10) !== n);
    });
    document.getElementById('prevBtn').disabled = n === 1;
    document.getElementById('nextBtn').classList.toggle('hidden', n === totalSteps);
    document.getElementById('submitBtn').classList.toggle('hidden', n !== totalSteps);
    if (n === totalSteps) populateReview();
    updateStepperUI();
  }

  document.getElementById('prevBtn').addEventListener('click', function () {
    if (currentStep > 1) goToStep(currentStep - 1);
  });

  document.getElementById('nextBtn').addEventListener('click', function () {
    if (validateStep(currentStep)) goToStep(currentStep + 1);
  });

  /* ---------- Field validation ---------- */
  function setInvalid(fieldEl, invalid) {
    if (!fieldEl) return;
    fieldEl.classList.toggle('invalid', invalid);
  }

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isValidPhone(v) { return /^[+0-9()\-\s]{7,}$/.test(v); }

  function validateStep(n) {
    var ok = true;
    var panel = steps[n - 1];

    if (n === 1) {
      ['fullName', 'email', 'phone'].forEach(function (name) {
        var input = panel.querySelector('[name="' + name + '"]');
        var fieldEl = panel.querySelector('[data-field="' + name + '"]');
        var valid = input.value.trim().length > 0;
        if (name === 'email') valid = valid && isValidEmail(input.value.trim());
        if (name === 'phone') valid = valid && isValidPhone(input.value.trim());
        setInvalid(fieldEl, !valid);
        if (!valid) ok = false;
      });
    }

    if (n === 3) {
      var errEl = document.getElementById('worktypeErr');
      var valid = !!selectedWorkType;
      errEl.style.display = valid ? 'none' : 'block';
      if (!valid) ok = false;
    }

    if (n === 5) {
      var fieldEl = panel.querySelector('[data-field="cv"]');
      var valid = !!cvFile;
      setInvalid(fieldEl, !valid);
      if (!valid) ok = false;
    }

    return ok;
  }

  /* ---------- Step 2: currently employed toggle ---------- */
  var employedExtra = document.getElementById('employedExtra');
  document.querySelectorAll('input[name="currentlyEmployed"]').forEach(function (r) {
    r.addEventListener('change', function () {
      employedExtra.classList.toggle('hidden', this.value !== 'Yes');
    });
  });

  /* ---------- Step 3: work type selection ---------- */
  var selectedWorkType = null; // { type, hours, salaryMin, salaryMax }
  var worktypeCards = document.querySelectorAll('.worktype-card');

  worktypeCards.forEach(function (card) {
    card.addEventListener('click', function () {
      worktypeCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');

      var type = card.dataset.worktype;
      var hours = parseInt(card.dataset.hours, 10);
      var divisor = type === 'Part-Time' ? 2 : 1;

      selectedWorkType = {
        type: type,
        hours: hours,
        salaryMin: Math.round(SALARY_FULL_MIN / divisor),
        salaryMax: Math.round(SALARY_FULL_MAX / divisor)
      };

      document.getElementById('worktypeErr').style.display = 'none';
      updateScheduleDisplay();
    });
  });

  /* ---------- Step 4: schedule ---------- */
  var startRange = document.getElementById('startTime');
  var scheduleText = document.getElementById('scheduleText');
  var durationText = document.getElementById('durationText');
  var worktypeEcho = document.getElementById('worktypeEcho');
  var timelineFill = document.getElementById('timelineFill');

  function hoursToLabel(h) {
    var hh = Math.floor(h);
    var mm = (h % 1) >= 0.5 ? 30 : 0;
    var display = ((hh % 24 + 24) % 24);
    return (display < 10 ? '0' : '') + display + ':' + (mm === 0 ? '00' : '30');
  }

  var scheduleState = { start: 9, end: 17 };

  function updateScheduleDisplay() {
    var hours = selectedWorkType ? selectedWorkType.hours : 8;
    var start = parseFloat(startRange.value);
    var end = start + hours;
    var wrapped = end > 24;
    var endLabel = hoursToLabel(end);

    scheduleState.start = start;
    scheduleState.end = end;

    scheduleText.textContent = hoursToLabel(start) + ' – ' + endLabel + (wrapped ? ' (+1 day)' : '');
    durationText.textContent = hours + ' Hours';
    worktypeEcho.textContent = selectedWorkType ? selectedWorkType.type : 'Not selected';

    var leftPct = (start / 24) * 100;
    var widthPct = Math.min(hours / 24, 1) * 100;
    timelineFill.style.left = leftPct + '%';
    timelineFill.style.width = widthPct + '%';
  }

  startRange.addEventListener('input', updateScheduleDisplay);
  updateScheduleDisplay();

  /* ---------- Step 5: CV / documents upload ---------- */
  var MAX_FILE_MB = 5;
  var cvFile = null;
  var extraFiles = [];

  function setupUpload(zoneId, inputId, chipId, opts) {
    var zone = document.getElementById(zoneId);
    var input = document.getElementById(inputId);
    var chipHolder = document.getElementById(chipId);

    zone.addEventListener('click', function () { input.click(); });

    ['dragenter', 'dragover'].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        zone.classList.add('drag');
      });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      zone.addEventListener(evt, function (e) {
        e.preventDefault();
        zone.classList.remove('drag');
      });
    });
    zone.addEventListener('drop', function (e) {
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', function () {
      handleFiles(input.files);
    });

    function handleFiles(fileList) {
      var files = Array.prototype.slice.call(fileList);
      var valid = [];
      files.forEach(function (f) {
        var okExt = !opts.accept || opts.accept.some(function (ext) {
          return f.name.toLowerCase().endsWith(ext);
        });
        var okSize = f.size <= MAX_FILE_MB * 1024 * 1024;
        if (okExt && okSize) valid.push(f);
      });
      if (opts.single) {
        if (valid[0]) opts.onFiles([valid[0]]);
      } else {
        opts.onFiles(valid);
      }
    }

    return {
      renderChip: function (files) {
        chipHolder.innerHTML = '';
        files.forEach(function (f, idx) {
          var chip = document.createElement('div');
          chip.className = 'file-chip';
          chip.innerHTML = '<span>📄 ' + f.name + '</span>';
          var removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.textContent = '✕';
          removeBtn.addEventListener('click', function () { opts.onRemove(idx); });
          chip.appendChild(removeBtn);
          chipHolder.appendChild(chip);
        });
      }
    };
  }

  var cvUpload = setupUpload('cvZone', 'cvInput', 'cvChip', {
    accept: ['.pdf', '.doc', '.docx'],
    single: true,
    onFiles: function (files) {
      cvFile = files[0] || null;
      cvUpload.renderChip(cvFile ? [cvFile] : []);
      setInvalid(document.querySelector('[data-field="cv"]'), false);
    },
    onRemove: function () {
      cvFile = null;
      cvUpload.renderChip([]);
    }
  });

  var extraUpload = setupUpload('extraZone', 'extraInput', 'extraChip', {
    accept: null,
    single: false,
    onFiles: function (files) {
      extraFiles = extraFiles.concat(files);
      extraUpload.renderChip(extraFiles);
    },
    onRemove: function (idx) {
      extraFiles.splice(idx, 1);
      extraUpload.renderChip(extraFiles);
    }
  });

  /* ---------- Step 7: review ---------- */
  function populateReview() {
    var data = new FormData(form);
    var reviewCard = document.getElementById('reviewCard');
    var salaryText = selectedWorkType
      ? fmt(selectedWorkType.salaryMin) + '–' + fmt(selectedWorkType.salaryMax) + ' BDT'
      : '—';

    var rows = [
      ['Applicant Name', data.get('fullName') || '—'],
      ['Email', data.get('email') || '—'],
      ['Phone', data.get('phone') || '—'],
      ['Position', 'Virtual Assistant'],
      ['Work Type', selectedWorkType ? selectedWorkType.type : '—'],
      ['Working Hours', selectedWorkType ? selectedWorkType.hours + ' hours/day' : '—'],
      ['Selected Schedule', hoursToLabel(scheduleState.start) + ' – ' + hoursToLabel(scheduleState.end)],
      ['Salary', salaryText],
      ['CV Filename', cvFile ? cvFile.name : '—']
    ];

    reviewCard.innerHTML = rows.map(function (r) {
      return '<div class="review-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');
  }

  /* ===================== SUBMISSION ===================== */
  var submitBtn = document.getElementById('submitBtn');
  var submitStatus = document.getElementById('submitStatus');
  var confirmCheck = document.getElementById('confirmCheck');

  submitBtn.addEventListener('click', function () {
    // Re-validate everything required across all steps
    var validAll = true;
    for (var i = 1; i <= totalSteps; i++) {
      if (i === 5 || i === 3 || i === 1) {
        if (!validateStep(i)) validAll = false;
      }
    }

    if (!selectedWorkType) validAll = false;
    if (!cvFile) validAll = false;

    // schedule duration must match work type (guaranteed by slider, but re-check)
    if (selectedWorkType && (scheduleState.end - scheduleState.start) !== selectedWorkType.hours) {
      validAll = false;
    }

    if (!confirmCheck.checked) {
      validAll = false;
      confirmCheck.parentElement.style.color = '#C4432A';
    } else {
      confirmCheck.parentElement.style.color = '';
    }

    if (!validAll) {
      // jump back to the first invalid required step for visibility
      if (!validateStep(1)) { goToStep(1); return; }
      if (!selectedWorkType) { goToStep(3); return; }
      if (!cvFile) { goToStep(5); return; }
      return;
    }

    submitBtn.disabled = true;
    submitStatus.style.display = 'flex';

    // Simulate submission processing, then redirect.
    setTimeout(function () {
      window.location.href = 'thankyou.html';
    }, 1200);
  });

  /* ===================== INIT ===================== */
  initStepper();
})();

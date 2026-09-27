document.addEventListener('DOMContentLoaded', function () {

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isFinePointer = window.matchMedia('(pointer: fine)').matches;
  
    /* ---------- Custom cursor ---------- */
    try {
      if (isFinePointer && !prefersReducedMotion) {
        var dot = document.getElementById('cursor-dot');
        var ring = document.getElementById('cursor-ring');
        var glow = document.getElementById('cursor-glow');
        var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, glowX = 0, glowY = 0;
  
        window.addEventListener('mousemove', function (e) {
          mouseX = e.clientX;
          mouseY = e.clientY;
          dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
        });
  
        (function animateRing() {
          ringX += (mouseX - ringX) * 0.18;
          ringY += (mouseY - ringY) * 0.18;
          ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
          if (glow) {
            glowX += (mouseX - glowX) * 0.07;
            glowY += (mouseY - glowY) * 0.07;
            glow.style.transform = 'translate(' + glowX + 'px,' + glowY + 'px) translate(-50%,-50%)';
          }
          requestAnimationFrame(animateRing);
        })();
  
        document.querySelectorAll('[data-cursor="link"]').forEach(function (el) {
          el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
          el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
        });
  
        document.documentElement.addEventListener('mouseleave', function () {
          dot.style.opacity = '0';
          ring.style.opacity = '0';
          if (glow) glow.style.opacity = '0';
        });
        document.documentElement.addEventListener('mouseenter', function () {
          dot.style.opacity = '1';
          ring.style.opacity = '1';
          if (glow) glow.style.opacity = '1';
        });
      }
    } catch (err) { /* cursor is decorative only — page still works without it */ }
  
    /* ---------- Scroll progress bar ---------- */
    try {
      var progressBar = document.getElementById('scroll-progress');
      if (progressBar) {
        window.addEventListener('scroll', function () {
          var doc = document.documentElement;
          var max = doc.scrollHeight - doc.clientHeight;
          var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
          progressBar.style.width = pct + '%';
        });
      }
    } catch (err) { /* decorative */ }
  
  
    /* ---------- Body scroll lock helper (iOS-safe) ---------- */
    var savedScrollY = 0;
    function lockBody() {
      savedScrollY = window.scrollY;
      document.body.style.top = (-savedScrollY) + 'px';
      document.body.classList.add('menu-open');
    }
    function unlockBody() {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      window.scrollTo(0, savedScrollY);
    }
  
    /* ---------- Burger / mobile menu ---------- */
    try {
      var burger = document.getElementById('burger');
      var mobileMenu = document.getElementById('mobile-menu');
      var mobileLinks = document.querySelectorAll('.mobile-link');
  
      function openMenu() {
        mobileMenu.classList.add('is-open');
        burger.classList.add('is-open');
        burger.setAttribute('aria-expanded', 'true');
        lockBody();
      }
      function closeMenu() {
        mobileMenu.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        if (!document.getElementById('consult-modal').classList.contains('is-open')) unlockBody();
      }
  
      burger.addEventListener('click', function () {
        if (mobileMenu.classList.contains('is-open')) closeMenu(); else openMenu();
      });
      mobileLinks.forEach(function (link) { link.addEventListener('click', closeMenu); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
      });
    } catch (err) { /* menu still reachable via anchors even if this fails */ }
  
    /* ---------- Consultation modal ---------- */
    try {
      var backdrop = document.getElementById('modal-backdrop');
      var modal = document.getElementById('consult-modal');
      var modalClose = document.getElementById('modal-close');
      var modalForm = document.getElementById('modal-form');
      var modalPlan = document.getElementById('m-plan');
      var modalEyebrow = document.getElementById('modal-eyebrow');
      var modalMessage = document.getElementById('m-message');
      var lastFocused = null;
  
      function openModal(plan) {
        lastFocused = document.activeElement;
        backdrop.hidden = false;
        modal.hidden = false;
        requestAnimationFrame(function () {
          backdrop.classList.add('is-open');
          modal.classList.add('is-open');
        });
        lockBody();
        if (plan) {
          modalPlan.value = plan;
          modalEyebrow.textContent = plan + ' plan';
          if (!modalMessage.value) modalMessage.value = "I'm interested in the " + plan + ' plan — ';
        } else {
          modalPlan.value = '';
          modalEyebrow.textContent = 'Free consultation';
        }
        setTimeout(function () { document.getElementById('m-name').focus(); }, 350);
      }
      function closeModal() {
        backdrop.classList.remove('is-open');
        modal.classList.remove('is-open');
        setTimeout(function () { backdrop.hidden = true; modal.hidden = true; }, 320);
        if (!document.getElementById('mobile-menu').classList.contains('is-open')) unlockBody();
        if (lastFocused) lastFocused.focus();
      }
  
      document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
        btn.addEventListener('click', function () { openModal(btn.getAttribute('data-plan')); });
      });
      modalClose.addEventListener('click', closeModal);
      backdrop.addEventListener('click', closeModal);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
      });
      modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var focusable = modal.querySelectorAll('input, textarea, button');
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    } catch (err) { /* the plain contact section at the bottom of the page still works */ }
  
    /* ---------- Form submit handling (modal + contact section) ---------- */
    function wireForm(formId, statusId, successText) {
      try {
        var form = document.getElementById(formId);
        if (!form) return;
        var status = document.getElementById(statusId);
        var submitBtn = form.querySelector('button[type="submit"]');
  
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var requiredFields = form.querySelectorAll('[required]');
          var valid = true;
          requiredFields.forEach(function (field) { if (!field.value.trim()) valid = false; });
  
          if (!valid) {
            status.textContent = 'Please fill in every field before sending.';
            status.className = 'form-status is-error';
            return;
          }
  
          if (submitBtn) submitBtn.classList.add('is-loading');
          status.textContent = '';
          status.className = 'form-status';
  
          var data = {};
          new FormData(form).forEach(function (value, key) { data[key] = value; });
  
          var subject = data.subject || (data.plan ? data.plan + ' plan enquiry' : 'New project enquiry');
          var bodyLines = [
            'Name: ' + (data.name || ''),
            'Email: ' + (data.email || ''),
            data.plan ? 'Plan: ' + data.plan : null,
            '',
            data.message || ''
          ].filter(function (l) { return l !== null; });
          var mailto = 'mailto:hello@webdev.studio'
            + '?subject=' + encodeURIComponent(subject)
            + '&body=' + encodeURIComponent(bodyLines.join('\n'));
  
          setTimeout(function () {
            if (submitBtn) submitBtn.classList.remove('is-loading');
            status.innerHTML = '✓ ' + successText;
            status.className = 'form-status is-success';
            try { window.location.href = mailto; } catch (mailErr) { /* clipboard-less fallback: message stays on screen */ }
            form.reset();
            if (formId === 'modal-form') {
              setTimeout(function () {
                var closeBtn = document.getElementById('modal-close');
                if (closeBtn) closeBtn.click();
              }, 1800);
            }
          }, 650);
        });
      } catch (err) { /* form falls back to native (unprevented) submission */ }
    }
  
    wireForm('contact-form', 'contact-status', 'Message ready — check your mail app to send it.');
    wireForm('modal-form', 'modal-status', 'Request ready — check your mail app to send it.');
  
  
    /* ---------- Smooth anchor scroll with navbar offset ---------- */
    try {
      document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
          var targetId = this.getAttribute('href');
          if (targetId.length < 2) return;
          var target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            var offsetTop = target.getBoundingClientRect().top + window.scrollY - 84;
            window.scrollTo({ top: offsetTop, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
          }
        });
      });
    } catch (err) { /* browser default jump-scroll still works */ }
  
    /* ---------- Navbar background on scroll + back-to-top ---------- */
    try {
      var navbar = document.getElementById('navbar');
      var toTop = document.getElementById('to-top');
      window.addEventListener('scroll', function () {
        var scrolled = window.scrollY > 40;
        navbar.classList.toggle('is-scrolled', scrolled);
        if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 600);
      });
      if (toTop) {
        toTop.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
      }
    } catch (err) { /* non-essential chrome */ }
  
    /* ---------- Scroll reveal (safe: elements are visible by default) ---------- */
    try {
      var revealEls = document.querySelectorAll('[data-reveal]');
      if ('IntersectionObserver' in window && !prefersReducedMotion && revealEls.length) {
        revealEls.forEach(function (el) { el.classList.add('reveal-init'); });
  
        var revealObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  
        revealEls.forEach(function (el) { revealObserver.observe(el); });
  
        /* Safety net: never let content stay hidden longer than a few seconds,
           in case an embedding iframe reports odd viewport intersection. */
        setTimeout(function () {
          revealEls.forEach(function (el) { el.classList.add('is-visible'); });
        }, 3000);
      }
    } catch (err) {
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        el.classList.remove('reveal-init');
        el.classList.add('is-visible');
      });
    }
  
    /* ---------- Stat counters ---------- */
    try {
      var statEls = document.querySelectorAll('.stat-number');
      function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '+';
        if (prefersReducedMotion) { el.textContent = target + suffix; return; }
        var duration = 1400, start = null;
        function step(timestamp) {
          if (!start) start = timestamp;
          var progress = Math.min((timestamp - start) / duration, 1);
          el.textContent = Math.floor(progress * target) + suffix;
          if (progress < 1) requestAnimationFrame(step); else el.textContent = target + suffix;
        }
        requestAnimationFrame(step);
      }
      if (statEls.length && 'IntersectionObserver' in window) {
        var statsObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { animateCounter(entry.target); statsObserver.unobserve(entry.target); }
          });
        }, { threshold: 0.4 });
        statEls.forEach(function (el) { statsObserver.observe(el); });
        setTimeout(function () {
          statEls.forEach(function (el) { if (el.textContent === '0') animateCounter(el); });
        }, 3200);
      }
    } catch (err) { /* stats fall back to their static "0" — non-critical */ }
  
    /* ---------- Hero typing effect ---------- */
    try {
      var typingTarget = document.getElementById('typing-target');
      if (typingTarget) {
        if (prefersReducedMotion) {
          typingTarget.textContent = 'ship()';
        } else {
          var words = ['ship()', 'scale()', 'grow()'];
          var wordIndex = 0, charIndex = 0, deleting = false;
          (function typeLoop() {
            var current = words[wordIndex];
            if (!deleting) {
              charIndex++;
              typingTarget.textContent = current.slice(0, charIndex);
              if (charIndex === current.length) { deleting = true; setTimeout(typeLoop, 1300); return; }
            } else {
              charIndex--;
              typingTarget.textContent = current.slice(0, charIndex);
              if (charIndex === 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; }
            }
            setTimeout(typeLoop, deleting ? 45 : 90);
          })();
        }
      }
    } catch (err) { /* purely decorative */ }
  
    /* ---------- FAQ accordion ---------- */
    try {
      document.querySelectorAll('.faq-question').forEach(function (btn) {
        var answer = btn.nextElementSibling;
        btn.addEventListener('click', function () {
          var isOpen = btn.getAttribute('aria-expanded') === 'true';
          document.querySelectorAll('.faq-question').forEach(function (other) {
            other.setAttribute('aria-expanded', 'false');
            other.nextElementSibling.style.maxHeight = null;
          });
          if (!isOpen) {
            btn.setAttribute('aria-expanded', 'true');
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        });
      });
    } catch (err) { /* answers can still be read without the accordion collapsing */ }
  
    /* ---------- Signal graphic drift (about section) ---------- */
    try {
      var signal = document.getElementById('signal-graphic');
      if (signal && !prefersReducedMotion) {
        var pos = 0;
        setInterval(function () {
          pos = (pos + 0.2) % 28;
          signal.style.backgroundPosition = pos + 'px ' + pos + 'px';
        }, 60);
      }
    } catch (err) { /* decorative */ }
  
    /* ---------- Magnetic buttons ---------- */
    try {
      if (isFinePointer && !prefersReducedMotion) {
        document.querySelectorAll('.btn-primary, .btn-secondary, .to-top').forEach(function (btn) {
          btn.addEventListener('mousemove', function (e) {
            var r = btn.getBoundingClientRect();
            var x = e.clientX - r.left - r.width / 2;
            var y = e.clientY - r.top - r.height / 2;
            btn.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.28).toFixed(1) + 'px)';
          });
          btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
        });
      }
    } catch (err) { /* decorative */ }
  
    /* ---------- Hero editor window tilt ---------- */
    try {
      var editorWindow = document.querySelector('.editor-window');
      var heroVisual = document.querySelector('.hero-visual');
      if (editorWindow && heroVisual && isFinePointer && !prefersReducedMotion) {
        heroVisual.addEventListener('mousemove', function (e) {
          var r = heroVisual.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          editorWindow.style.transform = 'rotateY(' + (px * 8).toFixed(2) + 'deg) rotateX(' + (py * -8).toFixed(2) + 'deg)';
        });
        heroVisual.addEventListener('mouseleave', function () {
          editorWindow.style.transform = 'rotateY(0deg) rotateX(0deg)';
        });
      }
    } catch (err) { /* decorative */ }
  
  });
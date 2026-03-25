/**
 * main.js
 * Shared JavaScript for Mind Matters website.
 *
 * Features included:
 *  - Active nav link highlighting based on current page
 *  - Accordion / dropdown expand-collapse behaviour
 *  - Animated progress bar fill on scroll into view
 *  - Sticky wellness tip bar that appears after scrolling 400px
 *  - Smooth scroll for internal anchor links
 */

/* ============================================================
   Highlight the current page's nav link
   ============================================================ */
(function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(function (link) {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
})();


/* ============================================================
   Accordion / Dropdown toggle
   Challenge Feature: "pop-up or drop-down feature"
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(function (header) {
        header.addEventListener('click', function () {
            const body = this.nextElementSibling;
            const isOpen = body.classList.contains('open');

            // Close all other accordions in the same group
            const parentGroup = this.closest('.accordion-group');
            if (parentGroup) {
                parentGroup.querySelectorAll('.accordion-body.open').forEach(function (openBody) {
                    openBody.classList.remove('open');
                    openBody.previousElementSibling.classList.remove('open');
                });
            }

            // Toggle current accordion
            if (!isOpen) {
                body.classList.add('open');
                this.classList.add('open');
            }
        });
    });
});


/* ============================================================
   Animated progress bars — fill on scroll into view
   ============================================================ */
(function animateProgressBars() {
    const bars = document.querySelectorAll('.progress-bar-fill');
    if (bars.length === 0) return;

    // Store target widths then reset to 0
    bars.forEach(function (bar) {
        bar.dataset.target = bar.style.width;
        bar.style.width = '0%';
    });

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const bar = entry.target;
                // Brief delay so animation is visible after scroll
                setTimeout(function () {
                    bar.style.width = bar.dataset.target;
                }, 100);
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.3 });

    bars.forEach(function (bar) { observer.observe(bar); });
})();


/* ============================================================
   Sticky tip bar — appears after scrolling 400px down
   ============================================================ */
(function stickyTipBar() {
    const bar = document.getElementById('tip-bar');
    const closeBtn = document.getElementById('tip-bar-close');
    if (!bar) return;

    let dismissed = false;

    window.addEventListener('scroll', function () {
        if (dismissed) return;
        if (window.scrollY > 400) {
            bar.classList.add('visible');
        } else {
            bar.classList.remove('visible');
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            dismissed = true;
            bar.classList.remove('visible');
        });
    }
})();


/* ============================================================
   Smooth scroll for in-page anchor links
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

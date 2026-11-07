/**
 * ROSHAN RAJ — Portfolio Application Script
 * High-performance, bulletproof interactivity
 */

(function () {
  'use strict';

  // ─── DOM REFERENCES ───
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderVal = document.getElementById('loaderVal');
  const navbarWrapper = document.querySelector('.navbar-wrapper');
  const navLinks = document.querySelectorAll('.nav-item');
  const navToggle = document.getElementById('navToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const heroCanvas = document.getElementById('heroThreeCanvas');
  const magneticBtns = document.querySelectorAll('.magnetic-btn');

  // ─── FAST LOADER ───
  function initLoader() {
    let progress = 0;
    const duration = 900;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const percent = Math.round(eased * 100);

      if (loaderFill) loaderFill.style.width = percent + '%';
      if (loaderVal) loaderVal.textContent = percent + '%';

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          if (loader) loader.classList.add('loaded');
        }, 150);
      }
    }

    requestAnimationFrame(step);

    // Fallback safety timeout: ensure loader dismisses within 1.5s
    setTimeout(() => {
      if (loader && !loader.classList.contains('loaded')) {
        loader.classList.add('loaded');
      }
    }, 1500);
  }

  // ─── THREE.JS SPATIAL AI 3D ENVIRONMENT ───
  function initThreeHero() {
    if (!heroCanvas || typeof THREE === 'undefined') return;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        62,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 7.2);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      heroCanvas.appendChild(renderer.domElement);

      // 1. Spatial Perspective Grid (Ground Coordinate Mapping)
      const gridHelper = new THREE.GridHelper(32, 32, 0x00f2fe, 0x181e30);
      gridHelper.position.y = -3.2;
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.22;
      scene.add(gridHelper);

      // 2. Volumetric Spatial Neural Point Cloud
      const particleCount = 650;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const originalY = new Float32Array(particleCount);

      const colorCyan = new THREE.Color(0x00f2fe);
      const colorViolet = new THREE.Color(0x8b5cf6);
      const colorEmerald = new THREE.Color(0x10b981);

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 2.5 + Math.random() * 6.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = (Math.random() - 0.5) * 12;
        positions[i3 + 2] = radius * Math.cos(phi);

        originalY[i] = positions[i3 + 1];

        // Depth-based color lerp
        const depthRatio = Math.random();
        let pointColor;
        if (depthRatio < 0.5) {
          pointColor = colorCyan.clone().lerp(colorViolet, depthRatio * 2);
        } else {
          pointColor = colorViolet.clone().lerp(colorEmerald, (depthRatio - 0.5) * 2);
        }

        colors[i3] = pointColor.r;
        colors[i3 + 1] = pointColor.g;
        colors[i3 + 2] = pointColor.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });

      const particleSystem = new THREE.Points(geometry, particleMaterial);
      scene.add(particleSystem);

      // 3. Mouse Tracking
      let targetCamX = 0;
      let targetCamY = 0;

      window.addEventListener('mousemove', (e) => {
        const normX = e.clientX / window.innerWidth - 0.5;
        const normY = e.clientY / window.innerHeight - 0.5;
        targetCamX = normX * 1.6;
        targetCamY = -normY * 1.1;
      });

      // 4. Animation Loop
      let clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Smooth camera lerp for authentic 3D spatial parallax
        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // Dynamic LiDAR scan undulation
        const posArray = geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          posArray[i3 + 1] = originalY[i] + Math.sin(elapsed * 1.5 + posArray[i3] * 0.5) * 0.25;
        }
        geometry.attributes.position.needsUpdate = true;

        particleSystem.rotation.y = elapsed * 0.02;
        gridHelper.rotation.y = elapsed * 0.008;

        renderer.render(scene, camera);
      }

      animate();

      // Window Resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

    } catch (err) {
      console.warn('Three.js spatial scene fallback active:', err);
    }
  }

  // ─── SPATIAL 3D CARD PERSPECTIVE TILT ───
  function init3DCardTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const tiltCards = document.querySelectorAll(
      '.card-3d-tilt, .case-study, .secondary-card, .info-card, .metric-tile'
    );

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6; // Max 6 deg
        const rotateY = ((x - centerX) / centerX) * 6;  // Max 6 deg

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          card.style.transition = '';
        }, 400);
      });
    });
  }

  // ─── CUSTOM CURSOR ───
  function initCursor() {
    if (!cursorDot || !cursorRing) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX;
    let dotY = mouseY;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderCursor() {
      // Lerp smoothing
      dotX += (mouseX - dotX) * 0.35;
      dotY += (mouseY - dotY) * 0.35;
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      cursorDot.style.left = dotX + 'px';
      cursorDot.style.top = dotY + 'px';
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';

      requestAnimationFrame(renderCursor);
    }

    requestAnimationFrame(renderCursor);

    // Hover expand
    const interactives = document.querySelectorAll('a, button, .magnetic-btn, .project-showcase, .skill-category-box, .metric-card');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('active-hover'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('active-hover'));
    });
  }

  // ─── MAGNETIC BUTTONS ───
  function initMagneticButtons() {
    if (window.innerWidth <= 1024) return;

    magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          btn.style.transition = '';
        }, 400);
      });
    });
  }

  // ─── NAVIGATION & SCROLL SPY ───
  function initNavigation() {
    // Navbar scroll state
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        navbarWrapper.classList.add('scrolled');
      } else {
        navbarWrapper.classList.remove('scrolled');
      }
    });

    // Active link highlighting via IntersectionObserver
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              link.classList.toggle('active', link.getAttribute('data-section') === id);
            });
          }
        });
      },
      { threshold: 0.25 }
    );

    sections.forEach((sec) => observer.observe(sec));

    // Smooth scroll for nav items
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const navHeight = 80;
          const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });
          closeDrawer();
        }
      });
    });

    // Mobile drawer toggle
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        const isOpen = mobileDrawer.classList.contains('open');
        if (isOpen) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });
    }

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => closeDrawer());
    });
  }

  function openDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.add('open');
    if (navToggle) {
      navToggle.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!mobileDrawer) return;
    mobileDrawer.classList.remove('open');
    if (navToggle) {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  // ─── BOOTSTRAP ───
  function init() {
    initLoader();
    initCursor();
    initNavigation();
    initMagneticButtons();
    init3DCardTilt();

    // Init Three.js with safe wait for library
    if (typeof THREE !== 'undefined') {
      initThreeHero();
    } else {
      window.addEventListener('load', () => {
        setTimeout(initThreeHero, 100);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

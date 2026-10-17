/* ====================================================================
   ROSHAN RAJ — Portfolio Application Script
   Three.js Scene | GSAP Animations | Custom Cursor | Interactions
   ==================================================================== */

(function () {
  'use strict';

  // ─── CONFIG ───
  const CONFIG = {
    loaderDuration: 2200,
    cursorLerp: 0.15,
    cursorRingLerp: 0.08,
    magneticStrength: 0.3,
    magneticDistance: 100,
    orbColor1: 0x7c3aed,
    orbColor2: 0x06b6d4,
    orbColor3: 0xa78bfa,
    particleCount: 800,
  };

  // ─── STATE ───
  const state = {
    mouse: { x: 0, y: 0 },
    cursorPos: { x: 0, y: 0 },
    ringPos: { x: 0, y: 0 },
    isLoaded: false,
    isMobile: window.innerWidth <= 1024,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  // ─── UTILITIES ───
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  // ─── DOM REFERENCES ───
  const dom = {
    loader: document.getElementById('loader'),
    loaderNumber: document.querySelector('.loader__number'),
    loaderProgress: document.querySelector('.loader__progress-line'),
    loaderSkip: document.querySelector('.loader__skip'),
    navbar: document.getElementById('navbar'),
    navLinks: document.querySelectorAll('.nav-link'),
    navToggle: document.getElementById('navToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    mobileLinks: document.querySelectorAll('.mobile-link'),
    cursorDot: document.querySelector('.cursor-dot'),
    cursorRing: document.querySelector('.cursor-ring'),
    heroCanvas: document.getElementById('heroCanvas'),
    chars: document.querySelectorAll('.char'),
    magneticBtns: document.querySelectorAll('.magnetic-btn'),
    statNumbers: document.querySelectorAll('.stat-number[data-count]'),
    sections: document.querySelectorAll('.section, .hero'),
  };

  // ═══════════════════════════════════════════════════════════════════
  // LOADER
  // ═══════════════════════════════════════════════════════════════════
  function initLoader() {
    if (state.reducedMotion) {
      dom.loader.style.display = 'none';
      revealHero();
      return;
    }

    let progress = 0;
    const startTime = Date.now();
    const duration = CONFIG.loaderDuration;

    function updateLoader() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      const displayNumber = Math.round(eased * 100);
      dom.loaderNumber.textContent = displayNumber;
      dom.loaderProgress.style.width = `${eased * 100}%`;

      if (progress < 1) {
        requestAnimationFrame(updateLoader);
      } else {
        completeLoading();
      }
    }

    requestAnimationFrame(updateLoader);

    dom.loaderSkip.addEventListener('click', () => {
      completeLoading();
    });
  }

  function completeLoading() {
    if (state.isLoaded) return;
    state.isLoaded = true;

    dom.loaderNumber.textContent = '100';
    dom.loaderProgress.style.width = '100%';

    setTimeout(() => {
      dom.loader.classList.add('done');
      setTimeout(() => {
        dom.loader.style.display = 'none';
      }, 700);
      revealHero();
    }, 300);
  }

  // ═══════════════════════════════════════════════════════════════════
  // HERO REVEAL ANIMATION
  // ═══════════════════════════════════════════════════════════════════
  function revealHero() {
    // Stagger character reveal
    dom.chars.forEach((char, i) => {
      setTimeout(() => {
        char.style.transform = 'translateY(0)';
      }, 100 + i * 50);
    });

    // Fade in other elements
    const fadeElements = [
      '.hero__availability',
      '.hero__tagline',
      '.hero__description',
      '.hero__roles',
      '.hero__ctas',
      '.hero__scroll-indicator',
    ];

    fadeElements.forEach((sel, i) => {
      const el = document.querySelector(sel);
      if (el) {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        }, 600 + i * 150);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // THREE.JS HERO SCENE
  // ═══════════════════════════════════════════════════════════════════
  function initThreeScene() {
    if (state.reducedMotion || !window.THREE || !dom.heroCanvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    dom.heroCanvas.appendChild(renderer.domElement);

    // ─── Morph Sphere (Orb) ───
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uHover;

      //	Simplex 3D Noise (compact)
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

      float snoise(vec3 v){
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0/7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x2_ = x_ * ns.x + ns.yyyy;
        vec4 y2_ = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x2_) - abs(y2_);
        vec4 b0 = vec4(x2_.xy, y2_.xy);
        vec4 b1 = vec4(x2_.zw, y2_.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }

      void main() {
        vUv = uv;
        vNormal = normal;

        vec3 pos = position;
        float noiseFreq = 1.5 + uHover * 0.5;
        float noiseAmp = 0.15 + uHover * 0.08;
        float n = snoise(pos * noiseFreq + uTime * 0.4) * noiseAmp;
        float n2 = snoise(pos * 3.0 - uTime * 0.2) * 0.05;
        pos += normal * (n + n2);

        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float uTime;
      uniform float uHover;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 3.0);

        vec3 violet = vec3(0.486, 0.228, 0.929);
        vec3 cyan = vec3(0.024, 0.714, 0.831);
        vec3 purple = vec3(0.655, 0.545, 0.98);

        float t = sin(uTime * 0.3) * 0.5 + 0.5;
        vec3 color1 = mix(violet, purple, t);
        vec3 color2 = cyan;

        vec3 color = mix(color1, color2, fresnel);

        float rim = fresnel * 0.7;
        float coreGlow = exp(-2.0 * length(vUv - 0.5)) * 0.15;

        float alpha = clamp(rim + coreGlow + 0.05, 0.0, 0.85);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    const orbGeometry = new THREE.IcosahedronGeometry(1.2, 64);
    const orbMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uHover: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    // Position orb to the right side on desktop
    orb.position.x = state.isMobile ? 0 : 2.5;
    orb.position.y = state.isMobile ? -0.5 : 0;
    scene.add(orb);

    // ─── Ambient Particles ───
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CONFIG.particleCount * 3);
    const sizes = new Float32Array(CONFIG.particleCount);
    const velocities = [];

    for (let i = 0; i < CONFIG.particleCount; i++) {
      const i3 = i * 3;
      const radius = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi) - 2;

      sizes[i] = Math.random() * 1.5 + 0.3;
      velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.001,
      });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.015,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ─── Ambient Light Rings ───
    const ringGeometry = new THREE.RingGeometry(1.8, 1.82, 128);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
    });

    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.position.copy(orb.position);
    ring1.rotation.x = Math.PI * 0.4;
    scene.add(ring1);

    const ringMaterial2 = ringMaterial.clone();
    ringMaterial2.color.set(0x06b6d4);
    ringMaterial2.opacity = 0.04;
    const ring2Geo = new THREE.RingGeometry(2.2, 2.22, 128);
    const ring2 = new THREE.Mesh(ring2Geo, ringMaterial2);
    ring2.position.copy(orb.position);
    ring2.rotation.x = Math.PI * 0.6;
    ring2.rotation.y = Math.PI * 0.3;
    scene.add(ring2);

    // ─── Mouse Tracking ───
    let targetRotX = 0;
    let targetRotY = 0;
    let hoverIntensity = 0;

    document.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotX = normY * 0.3;
      targetRotY = normX * 0.3;
    });

    // Check if mouse is near the orb area
    dom.heroCanvas.addEventListener('mouseenter', () => {
      hoverIntensity = 1;
    });
    dom.heroCanvas.addEventListener('mouseleave', () => {
      hoverIntensity = 0;
    });

    // ─── Animation Loop ───
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Update shader uniforms
      orbMaterial.uniforms.uTime.value = elapsed;
      orbMaterial.uniforms.uHover.value = lerp(
        orbMaterial.uniforms.uHover.value,
        hoverIntensity,
        0.05
      );

      // Smooth orb rotation
      orb.rotation.x = lerp(orb.rotation.x, targetRotX + elapsed * 0.1, 0.02);
      orb.rotation.y = lerp(orb.rotation.y, targetRotY + elapsed * 0.15, 0.02);

      // Animate rings
      ring1.rotation.z = elapsed * 0.1;
      ring2.rotation.z = -elapsed * 0.08;

      // Animate particles
      const posArray = particleGeometry.attributes.position.array;
      for (let i = 0; i < CONFIG.particleCount; i++) {
        const i3 = i * 3;
        posArray[i3] += velocities[i].x;
        posArray[i3 + 1] += velocities[i].y;
        posArray[i3 + 2] += velocities[i].z;

        // Wrap particles
        const dist = Math.sqrt(
          posArray[i3] ** 2 + posArray[i3 + 1] ** 2 + posArray[i3 + 2] ** 2
        );
        if (dist > 12) {
          posArray[i3] *= 0.3;
          posArray[i3 + 1] *= 0.3;
          posArray[i3 + 2] *= 0.3;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Particle pulsing
      particleMaterial.opacity = 0.3 + Math.sin(elapsed * 0.5) * 0.1;

      renderer.render(scene, camera);
    }

    animate();

    // ─── Resize Handler ───
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      state.isMobile = w <= 1024;
      orb.position.x = state.isMobile ? 0 : 2.5;
      orb.position.y = state.isMobile ? -0.5 : 0;
      ring1.position.copy(orb.position);
      ring2.position.copy(orb.position);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // CUSTOM CURSOR
  // ═══════════════════════════════════════════════════════════════════
  function initCursor() {
    if (state.isMobile || !dom.cursorDot || !dom.cursorRing) return;

    const hoverTargets = 'a, button, .magnetic-btn, .project-card, .skill-category, .interest-tag, .skill-tag';

    document.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
    });

    document.addEventListener('mousedown', () => {
      dom.cursorDot.classList.add('clicking');
    });

    document.addEventListener('mouseup', () => {
      dom.cursorDot.classList.remove('clicking');
    });

    // Hover detection
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        dom.cursorDot.classList.add('hovering');
        dom.cursorRing.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        dom.cursorDot.classList.remove('hovering');
        dom.cursorRing.classList.remove('hovering');
      }
    });

    // Hide on leave
    document.addEventListener('mouseleave', () => {
      dom.cursorDot.style.opacity = '0';
      dom.cursorRing.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      dom.cursorDot.style.opacity = '1';
      dom.cursorRing.style.opacity = '1';
    });

    function updateCursor() {
      state.cursorPos.x = lerp(state.cursorPos.x, state.mouse.x, CONFIG.cursorLerp);
      state.cursorPos.y = lerp(state.cursorPos.y, state.mouse.y, CONFIG.cursorLerp);
      state.ringPos.x = lerp(state.ringPos.x, state.mouse.x, CONFIG.cursorRingLerp);
      state.ringPos.y = lerp(state.ringPos.y, state.mouse.y, CONFIG.cursorRingLerp);

      dom.cursorDot.style.left = `${state.cursorPos.x}px`;
      dom.cursorDot.style.top = `${state.cursorPos.y}px`;
      dom.cursorRing.style.left = `${state.ringPos.x}px`;
      dom.cursorRing.style.top = `${state.ringPos.y}px`;

      requestAnimationFrame(updateCursor);
    }

    updateCursor();
  }

  // ═══════════════════════════════════════════════════════════════════
  // MAGNETIC BUTTONS
  // ═══════════════════════════════════════════════════════════════════
  function initMagneticButtons() {
    if (state.isMobile) return;

    dom.magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * CONFIG.magneticStrength}px, ${y * CONFIG.magneticStrength}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          btn.style.transition = '';
        }, 500);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════
  function initNavigation() {
    // Scroll state for navbar
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;

      // Add/remove scrolled class
      if (scrollY > 80) {
        dom.navbar.classList.add('scrolled');
      } else {
        dom.navbar.classList.remove('scrolled');
      }

      lastScrollY = scrollY;
    });

    // Active section detection
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -70% 0px',
      threshold: 0,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          dom.navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('data-section') === id);
          });
        }
      });
    }, observerOptions);

    dom.sections.forEach((section) => {
      if (section.id) sectionObserver.observe(section);
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          const offset = dom.navbar.offsetHeight;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });

          // Close mobile menu if open
          closeMobileMenu();
        }
      });
    });

    // Mobile menu toggle
    dom.navToggle.addEventListener('click', () => {
      const isOpen = dom.mobileMenu.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  function openMobileMenu() {
    dom.mobileMenu.classList.add('open');
    dom.navToggle.classList.add('open');
    dom.navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    dom.mobileMenu.classList.remove('open');
    dom.navToggle.classList.remove('open');
    dom.navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // ═══════════════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════
  function initScrollAnimations() {
    if (state.reducedMotion) {
      // Show everything immediately
      document.querySelectorAll('[data-animate]').forEach((el) => {
        el.classList.add('in-view');
      });
      return;
    }

    const animateObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            animateObserver.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: 0.1,
      }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      animateObserver.observe(el);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // COUNTER ANIMATION (About section stats)
  // ═══════════════════════════════════════════════════════════════════
  function initCounters() {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    dom.statNumbers.forEach((el) => counterObserver.observe(el));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const duration = 2000;
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ═══════════════════════════════════════════════════════════════════
  // GSAP SCROLL-TRIGGERED ANIMATIONS (enhanced, if GSAP available)
  // ═══════════════════════════════════════════════════════════════════
  function initGSAPAnimations() {
    if (!window.gsap || !window.ScrollTrigger || state.reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    // Parallax hero fragments
    gsap.utils.toArray('.code-fragment').forEach((frag) => {
      gsap.to(frag, {
        y: -100,
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    // Section titles reveal
    gsap.utils.toArray('.section__title').forEach((title) => {
      gsap.from(title, {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: title,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Project cards stagger
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      gsap.from(card, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Skill categories stagger
    gsap.utils.toArray('.skill-category').forEach((cat, i) => {
      gsap.from(cat, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cat,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Timeline items
    gsap.utils.toArray('.timeline__item').forEach((item, i) => {
      gsap.from(item, {
        x: -30,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    // Timeline line grow
    gsap.from('.timeline__line', {
      scaleY: 0,
      transformOrigin: 'top',
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline',
        start: 'top 80%',
        end: 'bottom 80%',
        scrub: 1,
      },
    });

    // Contact section
    gsap.from('.contact__title', {
      y: 80,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.contact',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // AMBIENT BACKGROUND GLOW (CSS-powered, attached dynamically)
  // ═══════════════════════════════════════════════════════════════════
  function initAmbientGlow() {
    // Create floating ambient orbs for sections
    const glowSections = ['.about', '.work', '.skills', '.contact'];

    glowSections.forEach((sel, i) => {
      const section = document.querySelector(sel);
      if (!section) return;

      const glow = document.createElement('div');
      glow.style.cssText = `
        position: absolute;
        width: 600px;
        height: 600px;
        border-radius: 50%;
        background: radial-gradient(circle, ${i % 2 === 0 ? 'rgba(124,58,237,0.06)' : 'rgba(6,182,212,0.04)'} 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        top: 20%;
        ${i % 2 === 0 ? 'right: -200px;' : 'left: -200px;'}
        filter: blur(80px);
      `;
      section.style.position = 'relative';
      section.style.overflow = 'hidden';
      section.insertBefore(glow, section.firstChild);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════
  function init() {
    initLoader();
    initThreeScene();
    initCursor();
    initMagneticButtons();
    initNavigation();
    initScrollAnimations();
    initCounters();
    initAmbientGlow();

    // GSAP animations (deferred to allow GSAP to load)
    if (window.gsap && window.ScrollTrigger) {
      initGSAPAnimations();
    } else {
      // Wait for GSAP to potentially load
      window.addEventListener('load', () => {
        setTimeout(initGSAPAnimations, 100);
      });
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

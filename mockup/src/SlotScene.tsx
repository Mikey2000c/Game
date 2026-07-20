import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type ReelSymbol = {
  id: string;
  label: string;
  color: string;
  accent: string;
  kind?: "normal" | "scatter" | "wild" | "bonus";
  icon?: "cherry" | "lemon" | "bell" | "gem" | "pad" | "disc" | "trophy" | "cart" | "headset" | "bolt" | "safe" | "fire" | "coin" | "portal" | "star";
};

type Props = {
  symbols: ReelSymbol[];
  faces: [number, number, number];
  spinning: boolean;
  theme: "orchard" | "vault" | "console" | "raid";
  highlight?: "none" | "win" | "scatter" | "bonus";
};

const THEME_BG: Record<Props["theme"], [string, string, string]> = {
  orchard: ["#2a1020", "#5a1830", "#ff6b4a"],
  vault: ["#062820", "#0d3d32", "#20c997"],
  console: ["#0a1530", "#122a5c", "#4f7cff"],
  raid: ["#2a0c10", "#4a1418", "#ff4d6d"],
};

function drawIcon(g: CanvasRenderingContext2D, icon: ReelSymbol["icon"], cx: number, cy: number, s: number) {
  g.save();
  g.translate(cx, cy);
  g.fillStyle = "#fff";
  g.strokeStyle = "#fff";
  g.lineWidth = s * 0.08;
  g.lineJoin = "round";
  g.lineCap = "round";

  switch (icon) {
    case "cherry": {
      g.beginPath();
      g.arc(-s * 0.22, s * 0.1, s * 0.28, 0, Math.PI * 2);
      g.arc(s * 0.22, s * 0.18, s * 0.26, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(-s * 0.22, -s * 0.1);
      g.quadraticCurveTo(0, -s * 0.55, s * 0.2, -s * 0.15);
      g.stroke();
      break;
    }
    case "lemon": {
      g.beginPath();
      g.ellipse(0, 0, s * 0.42, s * 0.3, 0.2, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "bell": {
      g.beginPath();
      g.moveTo(-s * 0.32, s * 0.1);
      g.quadraticCurveTo(-s * 0.32, -s * 0.4, 0, -s * 0.45);
      g.quadraticCurveTo(s * 0.32, -s * 0.4, s * 0.32, s * 0.1);
      g.closePath();
      g.fill();
      g.fillRect(-s * 0.38, s * 0.1, s * 0.76, s * 0.14);
      g.beginPath();
      g.arc(0, s * 0.34, s * 0.1, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "gem": {
      g.beginPath();
      g.moveTo(0, -s * 0.45);
      g.lineTo(s * 0.4, -s * 0.05);
      g.lineTo(0, s * 0.45);
      g.lineTo(-s * 0.4, -s * 0.05);
      g.closePath();
      g.fill();
      break;
    }
    case "pad": {
      // original dual-grip pad silhouette (not a licensed controller)
      g.beginPath();
      g.moveTo(-s * 0.5, -s * 0.05);
      g.quadraticCurveTo(-s * 0.55, -s * 0.35, -s * 0.25, -s * 0.35);
      g.lineTo(s * 0.25, -s * 0.35);
      g.quadraticCurveTo(s * 0.55, -s * 0.35, s * 0.5, -s * 0.05);
      g.quadraticCurveTo(s * 0.55, s * 0.35, s * 0.28, s * 0.38);
      g.lineTo(-s * 0.28, s * 0.38);
      g.quadraticCurveTo(-s * 0.55, s * 0.35, -s * 0.5, -s * 0.05);
      g.fill();
      g.fillStyle = "rgba(20,40,90,0.35)";
      g.beginPath();
      g.arc(-s * 0.22, 0, s * 0.1, 0, Math.PI * 2);
      g.arc(s * 0.2, -s * 0.05, s * 0.07, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "disc": {
      g.beginPath();
      g.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      g.arc(0, 0, s * 0.12, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = "source-over";
      break;
    }
    case "trophy": {
      g.beginPath();
      g.moveTo(-s * 0.28, -s * 0.35);
      g.lineTo(s * 0.28, -s * 0.35);
      g.quadraticCurveTo(s * 0.38, 0, s * 0.18, s * 0.15);
      g.lineTo(-s * 0.18, s * 0.15);
      g.quadraticCurveTo(-s * 0.38, 0, -s * 0.28, -s * 0.35);
      g.fill();
      g.fillRect(-s * 0.08, s * 0.15, s * 0.16, s * 0.18);
      g.fillRect(-s * 0.22, s * 0.32, s * 0.44, s * 0.1);
      break;
    }
    case "cart": {
      g.fillRect(-s * 0.32, -s * 0.35, s * 0.64, s * 0.7);
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(-s * 0.22, -s * 0.22, s * 0.44, s * 0.18);
      break;
    }
    case "headset": {
      g.beginPath();
      g.arc(0, -s * 0.05, s * 0.38, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      g.fillRect(-s * 0.48, -s * 0.05, s * 0.16, s * 0.35);
      g.fillRect(s * 0.32, -s * 0.05, s * 0.16, s * 0.35);
      break;
    }
    case "bolt": {
      g.beginPath();
      g.moveTo(s * 0.05, -s * 0.45);
      g.lineTo(-s * 0.2, s * 0.05);
      g.lineTo(s * 0.05, s * 0.05);
      g.lineTo(-s * 0.05, s * 0.45);
      g.lineTo(s * 0.2, -s * 0.05);
      g.lineTo(-s * 0.05, -s * 0.05);
      g.closePath();
      g.fill();
      break;
    }
    case "safe": {
      g.fillRect(-s * 0.38, -s * 0.35, s * 0.76, s * 0.7);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.beginPath();
      g.arc(0, 0, s * 0.16, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case "fire": {
      g.beginPath();
      g.moveTo(0, s * 0.4);
      g.quadraticCurveTo(-s * 0.4, s * 0.1, -s * 0.15, -s * 0.2);
      g.quadraticCurveTo(0, 0, s * 0.1, -s * 0.4);
      g.quadraticCurveTo(s * 0.45, 0, 0, s * 0.4);
      g.fill();
      break;
    }
    case "coin": {
      g.beginPath();
      g.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.font = `800 ${s * 0.45}px Syne, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("$", 0, 2);
      break;
    }
    case "portal": {
      g.beginPath();
      g.ellipse(0, 0, s * 0.28, s * 0.42, 0, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      g.ellipse(0, 0, s * 0.12, s * 0.26, 0, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = "source-over";
      break;
    }
    case "star":
    default: {
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const b = a + Math.PI / 5;
        g.lineTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42);
        g.lineTo(Math.cos(b) * s * 0.18, Math.sin(b) * s * 0.18);
      }
      g.closePath();
      g.fill();
    }
  }
  g.restore();
}

function makeSymbolTexture(sym: ReelSymbol, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d")!;

  // gem plate
  const plate = g.createLinearGradient(0, 0, size, size);
  plate.addColorStop(0, "#ffffff");
  plate.addColorStop(0.15, sym.accent);
  plate.addColorStop(0.55, sym.color);
  plate.addColorStop(1, "#0d1020");
  g.fillStyle = plate;
  roundRect(g, size * 0.06, size * 0.06, size * 0.88, size * 0.88, size * 0.14);
  g.fill();

  // chrome rim
  g.lineWidth = size * 0.035;
  const rim = g.createLinearGradient(0, 0, size, size);
  rim.addColorStop(0, "#fff6d0");
  rim.addColorStop(0.4, "#c9a227");
  rim.addColorStop(1, "#7a5a10");
  g.strokeStyle = rim;
  roundRect(g, size * 0.08, size * 0.08, size * 0.84, size * 0.84, size * 0.12);
  g.stroke();

  // gloss
  g.fillStyle = "rgba(255,255,255,0.28)";
  g.beginPath();
  g.ellipse(size * 0.35, size * 0.28, size * 0.28, size * 0.14, -0.5, 0, Math.PI * 2);
  g.fill();

  drawIcon(g, sym.icon ?? "star", size / 2, size * 0.46, size * 0.34);

  g.fillStyle = "rgba(255,255,255,0.95)";
  g.font = `800 ${Math.floor(size * 0.09)}px Syne, system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "rgba(0,0,0,0.45)";
  g.shadowBlur = 8;
  g.fillText(sym.label, size / 2, size * 0.82);

  if (sym.kind && sym.kind !== "normal") {
    g.shadowBlur = 0;
    g.fillStyle = sym.kind === "scatter" ? "#ff4fd8" : sym.kind === "bonus" ? "#6ea8ff" : "#20c997";
    g.font = `800 ${Math.floor(size * 0.07)}px Figtree, sans-serif`;
    g.fillText(sym.kind.toUpperCase(), size / 2, size * 0.92);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function SlotScene({ symbols, faces, spinning, theme, highlight = "none" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    spinning,
    faces,
    highlight,
    speeds: [0, 0, 0] as number[],
    targetY: [0, 0, 0] as number[],
  });

  const textures = useMemo(
    () => symbols.map((s) => makeSymbolTexture(s)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbols.map((s) => s.id).join("|")],
  );

  useEffect(() => {
    stateRef.current.spinning = spinning;
    stateRef.current.faces = faces;
    stateRef.current.highlight = highlight;
    if (spinning) {
      stateRef.current.speeds = [20, 24, 28];
    } else {
      const step = (Math.PI * 2) / symbols.length;
      stateRef.current.targetY = faces.map((f) => -f * step) as [number, number, number];
      stateRef.current.speeds = [0, 0, 0];
    }
  }, [spinning, faces, highlight, symbols.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 260;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const [c1, c2, neon] = THEME_BG[theme];

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.05, 6.4);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xfff2d8, 2.4);
    key.position.set(2.5, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(neon, 1.1);
    fill.position.set(-3, 1, 2);
    scene.add(fill);
    const rim = new THREE.PointLight(neon, 2.2, 12);
    rim.position.set(0, -1.2, 2);
    scene.add(rim);

    // velvet / sky casino backplate
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 3.6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(c1),
        roughness: 0.85,
        metalness: 0.05,
      }),
    );
    back.position.z = -1.55;
    scene.add(back);

    const glowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 2.9),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(c2),
        emissive: new THREE.Color(neon),
        emissiveIntensity: 0.25,
        roughness: 0.4,
        metalness: 0.2,
      }),
    );
    glowPlane.position.z = -1.5;
    scene.add(glowPlane);

    // chrome bezel frame
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0xf0d78c,
      metalness: 0.92,
      roughness: 0.18,
    });
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(5.35, 2.95, 0.18), bezelMat);
    bezel.position.z = -1.2;
    scene.add(bezel);

    const inner = new THREE.Mesh(
      new THREE.BoxGeometry(4.95, 2.55, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0b1020, metalness: 0.4, roughness: 0.5 }),
    );
    inner.position.z = -1.05;
    scene.add(inner);

    // LED bulbs along top
    const ledGroup = new THREE.Group();
    for (let i = 0; i < 11; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffe29a,
          emissive: new THREE.Color(i % 2 === 0 ? neon : 0xffb020),
          emissiveIntensity: 1.4,
        }),
      );
      bulb.position.set(-2.2 + i * 0.44, 1.35, -0.95);
      ledGroup.add(bulb);
    }
    scene.add(ledGroup);

    const reels: THREE.Group[] = [];
    const reelX = [-1.5, 0, 1.5];
    const radius = 0.98;
    const segment = (Math.PI * 2) / symbols.length;

    reelX.forEach((x) => {
      const group = new THREE.Group();
      group.position.set(x, -0.05, 0);

      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.03, radius + 0.03, 1.42, 64, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xe8eef8,
          metalness: 0.85,
          roughness: 0.2,
          side: THREE.DoubleSide,
        }),
      );
      shell.rotation.z = Math.PI / 2;
      group.add(shell);

      // end caps
      const capMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.22 });
      [-0.72, 0.72].forEach((y) => {
        const cap = new THREE.Mesh(new THREE.CircleGeometry(radius + 0.03, 48), capMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.y = y;
        group.add(cap);
      });

      symbols.forEach((_sym, i) => {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.22, 1.18),
          new THREE.MeshStandardMaterial({
            map: textures[i],
            roughness: 0.28,
            metalness: 0.12,
          }),
        );
        const angle = i * segment;
        panel.position.set(0, Math.sin(angle) * radius, Math.cos(angle) * radius);
        panel.rotation.x = -angle;
        group.add(panel);
      });

      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.38, 1.5),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.1,
          roughness: 0.02,
          metalness: 0,
          transmission: 0.7,
        }),
      );
      glass.position.set(0, 0, radius + 0.38);
      group.add(glass);

      scene.add(group);
      reels.push(group);
    });

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xff4d6d });
    const line = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 0.04), lineMat);
    line.position.z = 1.2;
    scene.add(line);

    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.random() * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffd28a, size: 0.07, transparent: true, opacity: 0 });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const st = stateRef.current;
      const t = clock.elapsedTime;

      reels.forEach((reel, i) => {
        if (st.spinning) {
          reel.rotation.x += st.speeds[i] * dt;
        } else {
          const target = st.targetY[i];
          let diff = target - reel.rotation.x;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          reel.rotation.x += diff * Math.min(1, 12 * dt);
        }
      });

      // chasing LEDs
      ledGroup.children.forEach((bulb, i) => {
        const mat = (bulb as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const on = Math.floor(t * 8 + i) % 3 === 0 || st.highlight !== "none";
        mat.emissiveIntensity = on ? 2.2 : 0.35;
      });

      const glow = st.highlight !== "none";
      pMat.opacity = THREE.MathUtils.lerp(pMat.opacity, glow ? 0.9 : 0, 0.08);
      if (glow) {
        const arr = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          arr[i * 3 + 1] += dt * (0.5 + (i % 5) * 0.12);
          if (arr[i * 3 + 1] > 1.7) arr[i * 3 + 1] = -1.7;
        }
        pGeo.attributes.position.needsUpdate = true;
        lineMat.color.setHex(
          st.highlight === "bonus" ? 0x6ea8ff : st.highlight === "scatter" ? 0xff4fd8 : 0xffd28a,
        );
      } else {
        lineMat.color.setHex(0xff4d6d);
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [theme, textures, symbols]);

  return <div className="slot-canvas" ref={mountRef} aria-label="3D slot reels" />;
}

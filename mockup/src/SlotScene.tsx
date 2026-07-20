import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type ReelSymbol = {
  id: string;
  label: string;
  color: string;
  accent: string;
  kind?: "normal" | "scatter" | "wild" | "bonus";
};

type Props = {
  symbols: ReelSymbol[];
  /** Final face index per reel (into symbols) */
  faces: [number, number, number];
  spinning: boolean;
  theme: "orchard" | "vault" | "console" | "raid";
  highlight?: "none" | "win" | "scatter" | "bonus";
};

const THEME_BG: Record<Props["theme"], [string, string]> = {
  orchard: ["#fff4e0", "#ffd0a8"],
  vault: ["#e8fff8", "#b8f0e0"],
  console: ["#e8f0ff", "#c5d8ff"],
  raid: ["#ffe8e0", "#ffc8b8"],
};

function makeSymbolTexture(sym: ReelSymbol, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d")!;

  const grad = g.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, sym.color);
  grad.addColorStop(1, sym.accent);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);

  // soft bevel
  g.fillStyle = "rgba(255,255,255,0.22)";
  g.beginPath();
  g.ellipse(size * 0.35, size * 0.3, size * 0.28, size * 0.18, -0.4, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#1a1520";
  g.font = `800 ${Math.floor(size * 0.42)}px Syne, system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(sym.label, size / 2, size / 2 + 4);

  if (sym.kind && sym.kind !== "normal") {
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = `700 ${Math.floor(size * 0.12)}px Figtree, sans-serif`;
    g.fillText(sym.kind.toUpperCase(), size / 2, size * 0.86);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
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
    // symbols identity is stable per game
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbols.map((s) => s.id).join("|")],
  );

  useEffect(() => {
    stateRef.current.spinning = spinning;
    stateRef.current.faces = faces;
    stateRef.current.highlight = highlight;
    if (spinning) {
      stateRef.current.speeds = [18, 22, 26];
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
    const height = mount.clientHeight || 220;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const [c1, c2] = THEME_BG[theme];
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 6.2);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 4, 5);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const rim = new THREE.DirectionalLight(0xffd08a, 0.7);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    // Cabinet frame glow plane
    const frameGeo = new THREE.PlaneGeometry(5.6, 3.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c1),
      roughness: 0.55,
      metalness: 0.1,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -1.4;
    scene.add(frame);

    const accent = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 2.8),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(c2),
        roughness: 0.4,
        metalness: 0.15,
      }),
    );
    accent.position.z = -1.35;
    scene.add(accent);

    const reels: THREE.Group[] = [];
    const reelX = [-1.55, 0, 1.55];
    const radius = 0.95;
    const segment = (Math.PI * 2) / symbols.length;

    reelX.forEach((x) => {
      const group = new THREE.Group();
      group.position.set(x, 0, 0);

      // chrome cylinder shell
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, 1.35, 48, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xf4f0ea,
          metalness: 0.65,
          roughness: 0.25,
          side: THREE.DoubleSide,
        }),
      );
      shell.rotation.z = Math.PI / 2;
      group.add(shell);

      symbols.forEach((_sym, i) => {
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.2, 1.15),
          new THREE.MeshStandardMaterial({
            map: textures[i],
            roughness: 0.35,
            metalness: 0.05,
          }),
        );
        const angle = i * segment;
        panel.position.set(0, Math.sin(angle) * radius, Math.cos(angle) * radius);
        panel.rotation.x = -angle;
        group.add(panel);
      });

      // glass front
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 1.45),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.12,
          roughness: 0.05,
          metalness: 0,
          transmission: 0.6,
        }),
      );
      glass.position.set(0, 0, radius + 0.35);
      group.add(glass);

      scene.add(group);
      reels.push(group);
    });

    // payline
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xff6b3d });
    const line = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.035), lineMat);
    line.position.z = 1.15;
    scene.add(line);

    // particles
    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.random() * 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffb347,
      size: 0.06,
      transparent: true,
      opacity: 0,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    let raf = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const st = stateRef.current;

      reels.forEach((reel, i) => {
        if (st.spinning) {
          reel.rotation.x += st.speeds[i] * dt;
        } else {
          const target = st.targetY[i];
          let diff = target - reel.rotation.x;
          // wrap shortest
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          reel.rotation.x += diff * Math.min(1, 10 * dt);
        }
      });

      const glow =
        st.highlight === "win" || st.highlight === "scatter" || st.highlight === "bonus";
      pMat.opacity = THREE.MathUtils.lerp(pMat.opacity, glow ? 0.85 : 0, 0.08);
      if (glow) {
        const arr = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          arr[i * 3 + 1] += dt * (0.4 + (i % 5) * 0.1);
          if (arr[i * 3 + 1] > 1.6) arr[i * 3 + 1] = -1.6;
        }
        pGeo.attributes.position.needsUpdate = true;
        lineMat.color.setHex(
          st.highlight === "bonus" ? 0x5b7cff : st.highlight === "scatter" ? 0xff4fd8 : 0xff8a3d,
        );
      } else {
        lineMat.color.setHex(0xff6b3d);
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

import { useEffect, useRef } from "react";
import * as THREE from "three";
import land from "../data/land.json";

export default function Globe() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      host.classList.add("globe-fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.15, 6.4);
    const group = new THREE.Group();
    group.rotation.z = -0.18;
    scene.add(group);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const point = (lon: number, lat: number, r = 1.65) => {
      const p = ((90 - lat) * Math.PI) / 180,
        t = ((lon + 180) * Math.PI) / 180;
      return new THREE.Vector3(
        -r * Math.sin(p) * Math.cos(t),
        r * Math.cos(p),
        r * Math.sin(p) * Math.sin(t),
      );
    };
    const sphere = new THREE.SphereGeometry(1.638, 64, 48),
      sphereMat = new THREE.MeshBasicMaterial({ color: 0x0b160d });
    geometries.push(sphere);
    materials.push(sphereMat);
    group.add(new THREE.Mesh(sphere, sphereMat));
    const vertices = land.flatMap(([lon, lat]) => point(lon, lat).toArray());
    const dots = new THREE.BufferGeometry();
    dots.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    const dotMat = new THREE.PointsMaterial({
      color: 0xc9fbb3,
      size: 0.022,
      transparent: true,
      opacity: 0.82,
    });
    geometries.push(dots);
    materials.push(dotMat);
    group.add(new THREE.Points(dots, dotMat));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x496044,
      transparent: true,
      opacity: 0.25,
    });
    materials.push(gridMat);
    for (let lat = -60; lat <= 60; lat += 20) {
      const pts = [];
      for (let lon = 0; lon <= 360; lon += 3) pts.push(point(lon, lat, 1.655));
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      geometries.push(g);
      group.add(new THREE.Line(g, gridMat));
    }
    for (let lon = 0; lon < 360; lon += 20) {
      const pts = [];
      for (let lat = -90; lat <= 90; lat += 3) pts.push(point(lon, lat, 1.655));
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      geometries.push(g);
      group.add(new THREE.Line(g, gridMat));
    }
    const cities = [
      [-74, 40.7],
      [-0.1, 51.5],
      [13.4, 52.5],
      [103.8, 1.35],
      [139.7, 35.7],
      [-122.4, 37.7],
      [151.2, -33.8],
      [18.4, -33.9],
      [55.3, 25.2],
    ];
    const particles: {
      mesh: THREE.Mesh;
      curve: THREE.CatmullRomCurve3;
      speed: number;
    }[] = [];
    cities.forEach(([lon, lat], i) => {
      const a = point(lon, lat, 1.68),
        b = point(
          ...(cities[(i + 3) % cities.length] as [number, number]),
          1.68,
        );
      const mid = a.clone().add(b).normalize().multiplyScalar(2.15);
      const curve = new THREE.CatmullRomCurve3([
        a,
        a.clone().lerp(mid, 0.55),
        mid,
        b.clone().lerp(mid, 0.55),
        b,
      ]);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(70));
      const mat = new THREE.LineBasicMaterial({
        color: 0xa8ed75,
        transparent: true,
        opacity: i % 2 ? 0.6 : 0.25,
      });
      geometries.push(geo);
      materials.push(mat);
      group.add(new THREE.Line(geo, mat));
      const ball = new THREE.SphereGeometry(0.025, 8, 8),
        bm = new THREE.MeshBasicMaterial({ color: 0xd9ffad });
      geometries.push(ball);
      materials.push(bm);
      const mesh = new THREE.Mesh(ball, bm);
      group.add(mesh);
      particles.push({ mesh, curve, speed: 0.04 + i * 0.006 });
      const city = new THREE.Mesh(ball, bm);
      city.position.copy(a);
      group.add(city);
    });
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xa8ed75,
      transparent: true,
      opacity: 0.22,
    });
    materials.push(orbitMat);
    [0, 1].forEach((i) => {
      const pts = [];
      for (let a = 0; a <= Math.PI * 2; a += 0.025)
        pts.push(new THREE.Vector3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0));
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      geometries.push(g);
      const orbit = new THREE.LineLoop(g, orbitMat);
      orbit.rotation.set(0.9 + i * 0.8, 0.6 + i * 0.4, 0.3);
      scene.add(orbit);
    });
    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    let frame = 0,
      visible = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const intersection = new IntersectionObserver((e) => {
      visible = e[0].isIntersecting;
    });
    intersection.observe(host);
    const pointer = { x: 0, y: 0 };
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width - 0.5;
      pointer.y = (e.clientY - r.top) / r.height - 0.5;
    };
    host.addEventListener("pointermove", move);
    const animate = (t: number) => {
      frame = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      group.rotation.y = reduced ? -0.5 : t * 0.000045 - 0.5;
      group.rotation.x += (pointer.y * 0.16 - group.rotation.x) * 0.025;
      scene.rotation.y += (pointer.x * 0.12 - scene.rotation.y) * 0.025;
      particles.forEach((p, i) =>
        p.mesh.position.copy(
          p.curve.getPoint(
            (reduced ? 0.4 : t * 0.0001 * p.speed + i * 0.14) % 1,
          ),
        ),
      );
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", move);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      ref={mount}
      className="globe-canvas"
      role="img"
      aria-label="Animated globe with SIP signaling paths connecting cities around the world"
    />
  );
}

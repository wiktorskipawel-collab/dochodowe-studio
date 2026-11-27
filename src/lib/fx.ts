// Efekty GSAP wspólne dla aplikacji (tylko w przeglądarce).
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(MotionPathPlugin);

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * XP „leci” do licznika w nagłówku (jak w Duolingo): świecące kulki wylatują z elementu `from`
 * i łukiem (MotionPath) wpadają w [data-xp-target], który podskakuje przy każdym trafieniu.
 */
export function flyXp(from: Element | null, count = 9) {
  const target = document.querySelector<HTMLElement>("[data-xp-target]");
  if (!from || !target || reduced()) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!b.width) return;
  const sx = a.left + a.width * 0.25;
  const sy = a.top + a.height / 2;
  const tx = b.left + 16;
  const ty = b.top + b.height / 2;
  for (let i = 0; i < count; i++) {
    const orb = document.createElement("span");
    orb.setAttribute("aria-hidden", "true");
    orb.className = "pointer-events-none fixed left-0 top-0 z-[96] size-3 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff3d6,#dd9933_55%,#a86a17)] shadow-[0_0_14px_rgba(221,153,51,.95)]";
    document.body.appendChild(orb);
    gsap.set(orb, { x: sx, y: sy, xPercent: -50, yPercent: -50, scale: 0 });
    const delay = 0.2 + i * 0.055;
    gsap
      .timeline({ delay, onComplete: () => orb.remove() })
      .to(orb, { scale: rand(0.8, 1.3), duration: 0.18, ease: "back.out(3)" })
      .to(orb, {
        duration: rand(0.7, 0.9),
        ease: "power2.in",
        motionPath: {
          path: [
            { x: sx + rand(-90, 90), y: sy + rand(-70, 40) },
            { x: (sx + tx) / 2 + rand(-80, 80), y: Math.min(sy, ty) + rand(-10, 60) },
            { x: tx, y: ty },
          ],
          curviness: 1.5,
        },
      })
      .to(orb, { scale: 0.2, opacity: 0, duration: 0.12 }, "-=0.1")
      .add(() => {
        gsap.fromTo(target, { scale: 1.16 }, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.4)", overwrite: true });
      }, "-=0.12");
  }
}

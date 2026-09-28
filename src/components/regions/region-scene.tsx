import type { Region } from "@/lib/regions";

/**
 * A generated destination scene per region — flat layered silhouettes over a CSS
 * sky, in the spirit of `CardArt`. Real destination photography and airline
 * imagery are licensed/trademarked, so the art is drawn here instead.
 *
 * Palettes stay desaturated so emerald keeps its job as the one action colour.
 * Depth comes from three fill layers (far/mid/near) rather than from gradients,
 * which keeps this a Server Component: no <defs>, so no duplicate SVG ids when
 * several scenes share a page.
 *
 * Geometry: the frame is a wide banner, so the SVG scales to the width and
 * crops vertically (`slice`). The viewBox is cropped to the band the art
 * actually occupies, y 24–96, which matches a banner around 4.5:1 — keep every
 * shape inside that band or it gets cut off on wide cards. The horizon is 74.
 */

type Scene = {
  /** Sky gradient, top to bottom. */
  sky: string;
  /** Sun or moon disc. */
  disc: string;
  discAt: { cx: number; cy: number; r: number };
  /** Farthest silhouette layer, palest. */
  far: { d: string; className: string };
  /** Nearest terrain layer, darkest — the ground band and any landforms. */
  near: { d: string; className: string };
  /** The recognisable shape, drawn at a fixed aspect on top of the terrain.
   * Omitted where the scene is pure landscape and stretching costs nothing. */
  motif?: { d: string; className: string };
  /** Optional stroked detail (swell lines, contours) drawn over the near layer. */
  detail?: { d: string; className: string };
};

const HORIZON = 74;
const ground = `M0 ${HORIZON} H320 V96 H0 Z`;

const SCENES: Record<Region, Scene> = {
  ASIA: {
    sky: "from-rose-100 via-orange-50 to-amber-50 dark:from-indigo-950 dark:via-violet-950 dark:to-rose-950",
    disc: "fill-rose-300/80 dark:fill-rose-500/30",
    discAt: { cx: 240, cy: 45, r: 14 },
    far: {
      // A cone peak with shoulders, and a lower ridge behind the gate.
      d: `M0 ${HORIZON} L44 48 L72 31 L100 48 L144 ${HORIZON} Z M166 ${HORIZON} L206 45 L246 ${HORIZON} Z`,
      className: "fill-indigo-400/25 dark:fill-indigo-300/10",
    },
    near: { d: ground, className: "fill-rose-900/70 dark:fill-rose-950" },
    motif: {
      // Torii gate: two posts, a curved lintel and a tie beam.
      d:
        `M56 ${HORIZON} v-28 h7 v28 Z M104 ${HORIZON} v-28 h7 v28 Z ` +
        `M46 44 q33 -7 78 0 v6 q-39 -6 -78 0 Z M54 56 h58 v5 h-58 Z`,
      className: "fill-rose-900/70 dark:fill-rose-950",
    },
  },

  EUROPE: {
    sky: "from-sky-100 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950",
    disc: "fill-amber-200/70 dark:fill-slate-300/20",
    discAt: { cx: 60, cy: 44, r: 11 },
    far: {
      d: `M0 ${HORIZON} L38 58 L68 63 L108 53 L148 ${HORIZON} Z`,
      className: "fill-slate-400/25 dark:fill-slate-300/10",
    },
    near: { d: ground, className: "fill-slate-800/75 dark:fill-slate-950" },
    motif: {
      // A domed basilica between a bell tower and a spire, over a rooftop row.
      d:
        `M154 ${HORIZON} v-20 q21 -22 42 0 v20 Z M173 30 h4 v7 h-4 Z ` +
        `M214 ${HORIZON} V42 l10 -14 l10 14 v32 Z ` +
        `M122 ${HORIZON} V48 l8 -12 l8 12 v26 Z ` +
        `M248 ${HORIZON} v-12 l10 -7 l10 7 v12 Z M272 ${HORIZON} v-9 h26 v9 Z`,
      className: "fill-slate-800/75 dark:fill-slate-950",
    },
  },

  NORTH_AMERICA: {
    sky: "from-orange-100 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-stone-950",
    disc: "fill-amber-300/70 dark:fill-amber-500/25",
    // Sits in the gap between the mesa groups, clear of both silhouettes.
    discAt: { cx: 155, cy: 44, r: 14 },
    far: {
      d: `M0 ${HORIZON} L28 54 L96 54 L120 ${HORIZON} Z M190 ${HORIZON} L214 50 L286 50 L310 ${HORIZON} Z`,
      className: "fill-orange-500/20 dark:fill-orange-300/10",
    },
    near: {
      // Two flat-topped mesas and a lower butte.
      d:
        `${ground} ` +
        `M36 ${HORIZON} l14 -28 h52 l14 28 Z ` +
        `M196 ${HORIZON} l10 -20 h38 l10 20 Z ` +
        `M262 ${HORIZON} l8 -13 h22 l8 13 Z`,
      className: "fill-orange-900/70 dark:fill-stone-950",
    },
  },

  SOUTH_AMERICA: {
    sky: "from-teal-100 via-emerald-50 to-lime-50 dark:from-teal-950 dark:via-emerald-950 dark:to-slate-950",
    disc: "fill-lime-200/80 dark:fill-teal-400/20",
    discAt: { cx: 254, cy: 44, r: 12 },
    far: {
      // A jagged cordillera running the full width.
      d: `M0 ${HORIZON} L36 34 L68 54 L104 28 L140 52 L174 40 L214 ${HORIZON} Z`,
      className: "fill-teal-500/25 dark:fill-teal-300/10",
    },
    near: {
      // Rolling foreland in front of the range.
      d:
        `${ground} ` +
        `M0 ${HORIZON} V64 q40 -11 80 -2 q36 8 70 -6 q38 -16 76 2 q40 17 94 4 v12 Z`,
      className: "fill-emerald-900/70 dark:fill-emerald-950",
    },
  },

  AFRICA: {
    sky: "from-amber-100 via-orange-50 to-rose-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950",
    disc: "fill-orange-300/80 dark:fill-orange-500/30",
    discAt: { cx: 98, cy: 48, r: 16 },
    far: {
      d: `M0 ${HORIZON} L60 60 L130 65 L210 56 L320 ${HORIZON} Z`,
      className: "fill-amber-600/20 dark:fill-amber-300/10",
    },
    near: { d: ground, className: "fill-stone-800/75 dark:fill-stone-950" },
    motif: {
      // Acacia: trunk, forked branches and a flat spreading canopy.
      d:
        `M206 ${HORIZON} l4 -26 l-10 -11 h6 l7 7 l8 -8 h6 l-11 12 l4 26 Z ` +
        `M174 38 q36 -12 74 0 q-37 -5 -74 0 Z ` +
        `M183 45 q29 -8 56 0 q-28 -4 -56 0 Z ` +
        `M54 ${HORIZON} l6 -15 l7 15 Z`,
      className: "fill-stone-800/75 dark:fill-stone-950",
    },
  },

  OCEANIA: {
    sky: "from-cyan-100 via-sky-50 to-blue-50 dark:from-cyan-950 dark:via-sky-950 dark:to-slate-950",
    disc: "fill-sky-300/70 dark:fill-cyan-400/20",
    discAt: { cx: 64, cy: 43, r: 12 },
    far: {
      d: `M0 ${HORIZON} L50 56 L90 61 L138 50 L184 ${HORIZON} Z`,
      className: "fill-cyan-500/25 dark:fill-cyan-300/10",
    },
    near: { d: ground, className: "fill-blue-900/70 dark:fill-slate-950" },
    motif: {
      // A sloop under sail, mainsail and jib.
      d: "M234 70 V38 l20 32 Z M230 70 l-2 -22 l-13 22 Z",
      className: "fill-blue-900/70 dark:fill-slate-950",
    },
    detail: {
      d: "M10 82 q20 -5 40 0 q20 5 40 0 M106 89 q18 -4 36 0 q18 4 36 0",
      className: "stroke-white/30 dark:stroke-white/10",
    },
  },

  MIDDLE_EAST: {
    sky: "from-amber-100 via-yellow-50 to-violet-50 dark:from-violet-950 dark:via-amber-950 dark:to-stone-950",
    disc: "fill-amber-200/80 dark:fill-amber-400/25",
    discAt: { cx: 252, cy: 43, r: 13 },
    far: {
      d: `M0 ${HORIZON} q60 -18 128 -4 q70 15 192 4 Z`,
      className: "fill-amber-600/20 dark:fill-amber-300/10",
    },
    near: {
      // Dune crests along the horizon.
      d: `${ground} M0 ${HORIZON} q48 -13 96 0 Z M186 ${HORIZON} q54 -15 108 0 Z`,
      className: "fill-violet-950/70 dark:fill-stone-950",
    },
    motif: {
      // An onion dome flanked by a minaret.
      d:
        `M76 ${HORIZON} v-14 q0 -18 18 -25 q18 7 18 25 v14 Z M92 31 h4 v6 h-4 Z ` +
        `M132 ${HORIZON} V41 q0 -7 6 -10 q6 3 6 10 v33 Z`,
      className: "fill-violet-950/70 dark:fill-stone-950",
    },
  },

  CARIBBEAN: {
    sky: "from-sky-100 via-cyan-50 to-teal-50 dark:from-sky-950 dark:via-cyan-950 dark:to-teal-950",
    disc: "fill-yellow-200/80 dark:fill-cyan-400/20",
    discAt: { cx: 74, cy: 44, r: 14 },
    far: {
      d: `M0 ${HORIZON} L46 62 L104 67 L166 59 L232 ${HORIZON} Z`,
      className: "fill-teal-500/25 dark:fill-teal-300/10",
    },
    near: { d: ground, className: "fill-teal-900/70 dark:fill-teal-950" },
    motif: {
      // Palm: a leaning trunk with four fronds drooping from one crown.
      d:
        `M222 ${HORIZON} q4 -17 14 -29 l6 4 q-10 12 -14 25 Z ` +
        `M240 44 q-25 -4 -34 9 q16 -11 34 -4 Z ` +
        `M240 44 q25 -4 34 9 q-16 -11 -34 -4 Z ` +
        `M240 44 q-15 -13 -5 -24 q-4 14 1 22 Z ` +
        `M240 44 q17 -12 30 -6 q-16 -1 -28 10 Z`,
      className: "fill-teal-900/70 dark:fill-teal-950",
    },
    detail: {
      d: "M8 84 q24 -5 48 0 q24 5 48 0 M118 90 q20 -4 40 0",
      className: "stroke-white/35 dark:stroke-white/10",
    },
  },
};

/**
 * @param className sizing + rounding for the frame, e.g. "h-20 rounded-t-xl".
 */
export function RegionScene({ region, className = "" }: { region: Region; className?: string }) {
  const scene = SCENES[region];

  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden bg-gradient-to-b ${scene.sky} ${className}`}
    >
      {/* Terrain stretches to any width — these are abstract ridges and bands,
          so horizontal distortion is invisible and the horizon always reaches
          both edges. */}
      <svg
        viewBox="0 24 320 72"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path d={scene.far.d} className={scene.far.className} />
        <path d={scene.near.d} className={scene.near.className} />
        {scene.detail && (
          <path
            d={scene.detail.d}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className={scene.detail.className}
          />
        )}
      </svg>
      {/* The recognisable shapes keep their aspect and sit on the horizon, so a
          torii stays a torii at any banner proportion. */}
      <svg
        viewBox="0 24 320 72"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 h-full w-full"
      >
        <circle {...scene.discAt} className={scene.disc} />
        {scene.motif && <path d={scene.motif.d} className={scene.motif.className} />}
      </svg>
    </span>
  );
}

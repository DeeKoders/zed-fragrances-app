import { BlurMask, Canvas, Circle, Group, Path, RadialGradient, Skia, vec, type SkPath } from "@shopify/react-native-skia";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { lightning, marbleVeins, silk, smoke } from "@/lib/texture";
import { alpha } from "@/theme/palette";
import type { ThemeTokens } from "@/theme/types";
import type { TextureKind } from "@/types/product";

// The procedural textures from the website's texture.ts (same seeded geometry), drawn with Skia in
// a 1000×1000 box scaled to cover. Coloured by the product's own theme tokens.

const BOX = 1000;
const paths = new Map<string, SkPath | null>();

function path(d: string) {
  if (!paths.has(d)) paths.set(d, Skia.Path.MakeFromSVGString(d));
  return paths.get(d) ?? null;
}

type TextureProps = {
  kind: TextureKind;
  seed: string;
  tokens: ThemeTokens;
  width: number;
  height: number;
  /** Shader-style time in seconds; when given, the texture breathes (flicker, drift). */
  time?: SharedValue<number>;
  opacity?: number;
};

/** A product world's texture as Skia elements, for use inside an existing <Canvas>. Decorative. */
export function TextureLayer({ kind, seed, tokens, width, height, time }: Omit<TextureProps, "opacity">) {
  if (kind === "none" || width === 0 || height === 0) return null;
  const scale = Math.max(width, height) / BOX;
  const transform = [{ translateX: (width - BOX * scale) / 2 }, { translateY: (height - BOX * scale) / 2 }, { scale }];
  return (
    <Group transform={transform}>
      {kind === "marble-veins" ? <Marble seed={seed} tokens={tokens} time={time} /> : null}
      {kind === "lightning" ? <Lightning seed={seed} tokens={tokens} time={time} /> : null}
      {kind === "smoke" ? <Smoke seed={seed} tokens={tokens} time={time} /> : null}
      {kind === "silk" ? <Silk seed={seed} tokens={tokens} time={time} /> : null}
    </Group>
  );
}

/** A product world's texture in its own canvas: marble veins, lightning, smoke or silk. Decorative. */
export const Texture = memo(function Texture({ opacity = 1, ...props }: TextureProps) {
  if (props.kind === "none") return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Canvas style={StyleSheet.absoluteFill}>
        <TextureLayer {...props} />
      </Canvas>
    </View>
  );
});

type LayerProps = { seed: string; tokens: ThemeTokens; time?: SharedValue<number> };

function Marble({ seed, tokens, time }: LayerProps) {
  const { veins, branches } = useMemo(() => marbleVeins(seed), [seed]);
  const drift = useDerivedValue(() => [{ translateX: time ? Math.sin(time.value * 0.05) * 12 : 0 }, { translateY: time ? Math.cos(time.value * 0.04) * 10 : 0 }]);
  const pulse = useDerivedValue(() => (time ? 0.75 + Math.sin(time.value * 0.6) * 0.25 : 1));
  return (
    <Group transform={drift}>
      <Group opacity={pulse}>
        {veins.map((d) => {
          const p = path(d);
          return p ? (
            <Group key={d}>
              <Path path={p} style="stroke" strokeWidth={9} color={alpha(tokens.accentGlow, 0.18)}>
                <BlurMask blur={10} style="normal" />
              </Path>
              <Path path={p} style="stroke" strokeWidth={2.4} color={alpha(tokens.accent400, 0.55)} strokeCap="round" />
            </Group>
          ) : null;
        })}
      </Group>
      {branches.map((d) => {
        const p = path(d);
        return p ? <Path key={d} path={p} style="stroke" strokeWidth={1.1} color={alpha(tokens.accent300, 0.3)} strokeCap="round" /> : null;
      })}
    </Group>
  );
}

function Lightning({ seed, tokens, time }: LayerProps) {
  const { bolts } = useMemo(() => lightning(seed), [seed]);
  return (
    <Group>
      {bolts.map((bolt, index) => (
        <Bolt key={bolt.core} core={bolt.core} branches={bolt.branches} index={index} tokens={tokens} time={time} />
      ))}
    </Group>
  );
}

function Bolt({ core, branches, index, tokens, time }: { core: string; branches: string[]; index: number; tokens: ThemeTokens; time?: SharedValue<number> }) {
  const flicker = useDerivedValue(() => {
    if (!time) return 0.8;
    const t = time.value * 0.7 + index * 1.7;
    const strike = Math.max(0, Math.sin(t * 2.3) * Math.sin(t * 5.1));
    return 0.45 + strike * 0.55;
  });
  const p = path(core);
  if (!p) return null;
  return (
    <Group opacity={flicker}>
      <Path path={p} style="stroke" strokeWidth={14} color={alpha(tokens.accentGlow, 0.22)} strokeJoin="round">
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={p} style="stroke" strokeWidth={2.6} color={alpha(tokens.accent200, 0.85)} strokeJoin="round" strokeCap="round" />
      {branches.map((d) => {
        const b = path(d);
        return b ? <Path key={d} path={b} style="stroke" strokeWidth={1.2} color={alpha(tokens.accentGlow, 0.55)} strokeJoin="round" /> : null;
      })}
    </Group>
  );
}

function Smoke({ seed, tokens, time }: LayerProps) {
  const puffs = useMemo(() => smoke(seed), [seed]);
  return (
    <Group>
      {puffs.map((puff, index) => (
        <Puff key={index} puff={puff} index={index} tokens={tokens} time={time} />
      ))}
    </Group>
  );
}

function Puff({
  puff,
  index,
  tokens,
  time,
}: {
  puff: ReturnType<typeof smoke>[number];
  index: number;
  tokens: ThemeTokens;
  time?: SharedValue<number>;
}) {
  const transform = useDerivedValue(() => {
    const t = time ? (time.value - puff.delay) / puff.duration : 0;
    return [{ translateX: Math.sin(t * Math.PI * 2) * 40 }, { translateY: Math.cos(t * Math.PI * 2 + index) * 30 }];
  });
  const color = index % 2 === 0 ? tokens.accentGlow : tokens.accent;
  return (
    <Group transform={transform}>
      <Circle cx={puff.x} cy={puff.y} r={puff.r}>
        <RadialGradient c={vec(puff.x, puff.y)} r={puff.r} colors={[alpha(color, puff.opacity), alpha(color, 0)]} />
      </Circle>
    </Group>
  );
}

function Silk({ seed, tokens, time }: LayerProps) {
  const ribbons = useMemo(() => silk(seed), [seed]);
  const sway = useDerivedValue(() => [{ translateX: time ? Math.sin(time.value * 0.15) * 30 : 0 }]);
  return (
    <Group transform={sway}>
      {ribbons.map((ribbon) => {
        const p = path(ribbon.d);
        return p ? (
          <Path key={ribbon.d} path={p} style="stroke" strokeWidth={ribbon.width} color={alpha(tokens.accentGlow, ribbon.opacity)} strokeCap="round">
            <BlurMask blur={ribbon.width / 3} style="normal" />
          </Path>
        ) : null;
      })}
    </Group>
  );
}

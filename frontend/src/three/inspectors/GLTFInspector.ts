import * as THREE from 'three';
import type { GLTF } from 'three-stdlib';

// Dev-only. Vite strips this whole call when import.meta.env.PROD is true
// because of the early return — no console noise or overhead ships to prod.
//
// This makes NO assumptions about node names. It reports what is actually
// in the file so decisions in later phases (which node is "head", which
// mesh is "eyes") are based on real data, not the reference video.

export interface InspectedNode {
  name: string;
  type: string;
  depth: number;
  isMesh: boolean;
  isBone: boolean;
  isSkinnedMesh: boolean;
  vertexCount?: number;
  triangleCount?: number;
  hasMorphTargets?: boolean;
  morphTargetNames?: string[];
  materials?: MaterialSummary[];
}

export interface MaterialSummary {
  name: string;
  type: string;
  hasMap: boolean;
  hasNormalMap: boolean;
  hasEmissiveMap: boolean;
  hasRoughnessMap: boolean;
  hasMetalnessMap: boolean;
}

export interface InspectionReport {
  nodes: InspectedNode[];
  animationClips: { name: string; duration: number }[];
  totalTriangles: number;
  totalMeshes: number;
  totalNodes: number;
  hasAnySkeleton: boolean;
  hasAnyMorphTargets: boolean;
  uniqueMaterialNames: string[];
  uniqueTextureNames: string[];
  headCandidates: string[];
  eyeCandidates: string[];
}

// Purely a substring search over the REAL node names once loaded — this is
// not asserting the head/eyes ARE separate controllable nodes, only
// surfacing candidates worth checking by eye. "unclear" is the honest
// default; a match doesn't upgrade that to "yes" automatically.
const HEAD_KEYWORDS = ['head', 'skull', 'face'];
const EYE_KEYWORDS = ['eye', 'iris', 'pupil'];

function findCandidates(names: string[], keywords: string[]): string[] {
  return names.filter((name) =>
    keywords.some((kw) => name.toLowerCase().includes(kw)),
  );
}

function describeMaterial(mat: THREE.Material | undefined): MaterialSummary | null {
  if (!mat) return null;
  const m = mat as THREE.MeshStandardMaterial;
  return {
    name: m.name || '(unnamed material)',
    type: m.type,
    hasMap: !!m.map,
    hasNormalMap: !!m.normalMap,
    hasEmissiveMap: !!m.emissiveMap,
    hasRoughnessMap: !!m.roughnessMap,
    hasMetalnessMap: !!m.metalnessMap,
  };
}

function getDepth(obj: THREE.Object3D): number {
  let depth = 0;
  let current = obj.parent;
  while (current) {
    depth++;
    current = current.parent;
  }
  return depth;
}

export function runGLTFInspection(gltf: GLTF): InspectionReport {
  const nodes: InspectedNode[] = [];
  let totalTriangles = 0;
  let totalMeshes = 0;
  let totalNodes = 0;
  let hasAnySkeleton = false;
  let hasAnyMorphTargets = false;
  const materialNameSet = new Set<string>();
  const textureNameSet = new Set<string>();

  gltf.scene.traverse((obj) => {
    totalNodes++;
    const mesh = obj as THREE.Mesh;
    const isMesh = !!(mesh as THREE.Mesh).isMesh;
    const isBone = !!(obj as THREE.Bone).isBone;
    const isSkinnedMesh = !!(mesh as THREE.SkinnedMesh).isSkinnedMesh;

    const entry: InspectedNode = {
      name: obj.name || '(unnamed)',
      type: obj.type,
      depth: getDepth(obj),
      isMesh,
      isBone,
      isSkinnedMesh,
    };

    if (isMesh) {
      totalMeshes++;
      const geo = mesh.geometry;
      const vertexCount = geo.attributes.position?.count ?? 0;
      const triangleCount = geo.index ? geo.index.count / 3 : vertexCount / 3;

      entry.vertexCount = vertexCount;
      entry.triangleCount = Math.round(triangleCount);
      totalTriangles += triangleCount;

      const hasMorph = !!geo.morphAttributes && Object.keys(geo.morphAttributes).length > 0;
      entry.hasMorphTargets = hasMorph;
      if (hasMorph) hasAnyMorphTargets = true;

      const dict = (mesh as THREE.Mesh & { morphTargetDictionary?: Record<string, number> })
        .morphTargetDictionary;
      entry.morphTargetNames = dict ? Object.keys(dict) : [];

      const matSource = mesh.material;
      const mats = Array.isArray(matSource) ? matSource : [matSource];
      entry.materials = mats
        .map((m) => describeMaterial(m))
        .filter((m): m is MaterialSummary => m !== null);

      mats.forEach((m) => {
        if (!m) return;
        materialNameSet.add(m.name || '(unnamed material)');
        const std = m as THREE.MeshStandardMaterial;
        [std.map, std.normalMap, std.emissiveMap, std.roughnessMap, std.metalnessMap].forEach(
          (tex) => {
            if (tex) textureNameSet.add(tex.name || `(unnamed texture, uuid ${tex.uuid.slice(0, 8)})`);
          },
        );
      });
    }

    if (isSkinnedMesh) hasAnySkeleton = true;

    nodes.push(entry);
  });

  const animationClips = (gltf.animations ?? []).map((clip) => ({
    name: clip.name || '(unnamed clip)',
    duration: Math.round(clip.duration * 100) / 100,
  }));

  const allNames = nodes.map((n) => n.name);

  const report: InspectionReport = {
    nodes,
    animationClips,
    totalTriangles: Math.round(totalTriangles),
    totalMeshes,
    totalNodes,
    hasAnySkeleton,
    hasAnyMorphTargets,
    uniqueMaterialNames: Array.from(materialNameSet),
    uniqueTextureNames: Array.from(textureNameSet),
    headCandidates: findCandidates(allNames, HEAD_KEYWORDS),
    eyeCandidates: findCandidates(allNames, EYE_KEYWORDS),
  };

  if (!import.meta.env.PROD) {
    printReport(report);
  }

  return report;
}

function printReport(report: InspectionReport) {
  console.groupCollapsed(
    '%c[GLTF Inspection] Node hierarchy (%d nodes, %d meshes)',
    'color:#5EE7FF;font-weight:bold;',
    report.nodes.length,
    report.totalMeshes,
  );
  console.table(
    report.nodes.map((n) => ({
      name: n.name,
      type: n.type,
      depth: n.depth,
      mesh: n.isMesh,
      bone: n.isBone,
      skinned: n.isSkinnedMesh,
      tris: n.triangleCount ?? '',
      morphs: n.morphTargetNames?.length ? n.morphTargetNames.join(', ') : '',
    })),
  );
  console.groupEnd();

  console.groupCollapsed('%c[GLTF Inspection] Materials', 'color:#8B7CFF;font-weight:bold;');
  report.nodes
    .filter((n) => n.materials?.length)
    .forEach((n) => console.log(n.name, '→', n.materials));
  console.groupEnd();

  console.groupCollapsed('%c[GLTF Inspection] Animation clips', 'color:#FF4F6D;font-weight:bold;');
  if (report.animationClips.length) {
    report.animationClips.forEach((c) => console.log(`${c.name} — ${c.duration}s`));
  } else {
    console.log('No animation clips embedded in this asset.');
  }
  console.groupEnd();

  console.groupCollapsed('%c[GLTF Inspection] Summary', 'color:#FFD52F;font-weight:bold;');
  console.log('Total nodes:', report.totalNodes);
  console.log('Total meshes:', report.totalMeshes);
  console.log('Total triangles:', report.totalTriangles);
  console.log('Any skeleton / SkinnedMesh present:', report.hasAnySkeleton);
  console.log('Any morph targets present:', report.hasAnyMorphTargets);
  console.log('Unique materials:', report.uniqueMaterialNames.length, report.uniqueMaterialNames);
  console.log('Unique textures:', report.uniqueTextureNames.length, report.uniqueTextureNames);
  console.groupEnd();

  // Exact structured block, matching the requested report template.
  // HEAD/EYES are heuristic candidates from real node names — never
  // upgraded to a "yes" here, since a name match doesn't prove the node is
  // independently controllable (still needs a visual check).
  const headLine = report.headCandidates.length
    ? `unclear — candidate node name(s) found: ${report.headCandidates.join(', ')}`
    : 'unclear — no node name obviously suggests "head"; check the full hierarchy above';
  const eyeLine = report.eyeCandidates.length
    ? `unclear — candidate node name(s) found: ${report.eyeCandidates.join(', ')}`
    : 'unclear — no node name obviously suggests "eye"; check the full hierarchy above';

  console.log(
    '%c[GLTF Inspection] Structured findings\n' +
      `HEAD:\nseparate node? ${headLine}\n\n` +
      `EYES:\nseparate nodes? ${eyeLine}\n\n` +
      `MORPH TARGETS:\n${report.hasAnyMorphTargets ? 'yes' : 'no'}\n\n` +
      `SKELETON:\n${report.hasAnySkeleton ? 'yes' : 'no'}\n\n` +
      `ANIMATION CLIPS:\n${report.animationClips.length ? 'yes' : 'no'}\n\n` +
      `MATERIALS:\n${report.uniqueMaterialNames.join(', ') || '(none found)'}\n\n` +
      `TEXTURES:\n${report.uniqueTextureNames.join(', ') || '(none found)'}`,
    'color:#5EE7FF;font-family:monospace;white-space:pre;',
  );
}

// Reads the browser's own resource-timing entry for the model request —
// real transfer size and load duration, not an estimate.
export function reportLoadTiming(url: string) {
  if (import.meta.env.PROD) return;

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const entry = entries.reverse().find((e) => e.name.includes(url));

  if (!entry) {
    console.log('[GLTF Inspection] No resource-timing entry found yet for', url);
    return;
  }

  console.groupCollapsed('%c[GLTF Inspection] Load timing', 'color:#FFD52F;font-weight:bold;');
  console.log('Duration:', `${entry.duration.toFixed(0)}ms`);
  console.log('Transfer size (over the wire):', formatBytes(entry.transferSize));
  console.log('Decoded body size (uncompressed):', formatBytes(entry.decodedBodySize));
  console.groupEnd();
}

function formatBytes(bytes: number): string {
  if (!bytes) return 'unknown (opaque/cached response)';
  const mib = bytes / (1024 * 1024);
  return `${mib.toFixed(1)} MiB`;
}

// Verify, don't assume: compares the real parsed report against the facts
// you supplied from the embedded GLB metadata. Logs a per-fact pass/fail
// rather than silently trusting either source.
export interface AssertedFacts {
  meshCount: number;
  nodeCount: number;
  uniqueMaterialCount: number;
  textureCount: number;
  hasSkeleton: boolean;
  hasMorphTargets: boolean;
  hasAnimationClips: boolean;
}

export function validateAssertedFacts(report: InspectionReport, asserted: AssertedFacts) {
  if (import.meta.env.PROD) return;

  const checks: { label: string; expected: unknown; actual: unknown }[] = [
    { label: 'mesh count', expected: asserted.meshCount, actual: report.totalMeshes },
    { label: 'node count', expected: asserted.nodeCount, actual: report.totalNodes },
    {
      label: 'unique material count',
      expected: asserted.uniqueMaterialCount,
      actual: report.uniqueMaterialNames.length,
    },
    { label: 'texture count', expected: asserted.textureCount, actual: report.uniqueTextureNames.length },
    { label: 'has skeleton', expected: asserted.hasSkeleton, actual: report.hasAnySkeleton },
    { label: 'has morph targets', expected: asserted.hasMorphTargets, actual: report.hasAnyMorphTargets },
    {
      label: 'has animation clips',
      expected: asserted.hasAnimationClips,
      actual: report.animationClips.length > 0,
    },
  ];

  console.groupCollapsed('%c[GLTF Inspection] Asserted facts vs. real data', 'color:#FF4F6D;font-weight:bold;');
  checks.forEach((c) => {
    const pass = c.expected === c.actual;
    console.log(pass ? '✅' : '❌', c.label, '— expected:', c.expected, ' actual:', c.actual);
  });
  console.groupEnd();
}

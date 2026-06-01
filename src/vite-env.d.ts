/// <reference types="vite/client" />

declare module 'poly-decomp' {
  const decomp: {
    decomp: (polygon: number[][]) => number[][][];
    quickDecomp: (polygon: number[][], result?: number[][][], reflexVertices?: number[][], steinerPoints?: number[][], delta?: number, maxlevel?: number, level?: number) => number[][][];
    isSimple: (polygon: number[][]) => boolean;
    removeCollinearPoints: (polygon: number[][], tolerance?: number) => number;
    removeDuplicatePoints: (polygon: number[][], tolerance?: number) => void;
    makeCCW: (polygon: number[][]) => boolean;
  };
  export default decomp;
}

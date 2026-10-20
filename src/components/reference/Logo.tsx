/** The MOSAIC 3×3 tile logo (navy, blue, orange). Self-contained, so it works on any page. */
export default function Logo({ size = 34 }: { size?: number }) {
  const tiles: [number, number, string][] = [
    [0, 0, '#1E3A5F'], [10.5, 0, '#3B8FBF'], [21, 0, '#EBA25E'],
    [0, 10.5, '#3B8FBF'], [10.5, 10.5, '#EBA25E'], [21, 10.5, '#1E3A5F'],
    [0, 21, '#EBA25E'], [10.5, 21, '#1E3A5F'], [21, 21, '#3B8FBF'],
  ];
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 30 30">
      {tiles.map(([x, y, fill]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={9} height={9} rx={1.5} fill={fill} />
      ))}
    </svg>
  );
}

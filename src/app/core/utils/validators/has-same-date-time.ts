export function hasSameDateTime(
  entryDate: string | null | undefined,
  entryTime: string | null | undefined,
  exitDate: string | null | undefined,
  exitTime: string | null | undefined,
): boolean {
  return (
    !!entryDate &&
    !!entryTime &&
    !!exitDate &&
    !!exitTime &&
    entryDate === exitDate &&
    entryTime === exitTime
  );
}

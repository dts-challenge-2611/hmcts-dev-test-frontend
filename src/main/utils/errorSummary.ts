// The error summary links to the first box of the date input
const FIELD_ANCHORS: Record<string, string> = { dueDate: 'dueDay' };

export function toErrorSummary(errors: Record<string, string[]>): { text: string; href: string }[] {
  return Object.entries(errors).map(([field, messages]) => ({
    text: messages[0],
    href: `#${FIELD_ANCHORS[field] ?? field}`,
  }));
}

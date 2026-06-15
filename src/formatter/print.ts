export interface TextChange {
  start: number;
  end: number;
  text: string;
}

export type EndOfLine = '\n' | '\r\n';

export function detectEndOfLine(text: string): EndOfLine {
  const firstCrLf = text.indexOf('\r\n');
  const firstLf = text.indexOf('\n');

  if (firstCrLf === -1) {
    return '\n';
  }

  if (firstLf === -1) {
    return '\r\n';
  }

  return firstCrLf === firstLf - 1 ? '\r\n' : '\n';
}

export function normalizeEndOfLine(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

export function restoreEndOfLine(text: string, endOfLine: EndOfLine): string {
  return endOfLine === '\r\n' ? text.replace(/\n/g, '\r\n') : text;
}

export function applyTextChanges(text: string, changes: TextChange[]): string {
  if (changes.length === 0) {
    return text;
  }

  const ordered = changes
    .filter((change) => change.start >= 0 && change.end >= change.start && change.end <= text.length)
    .sort((left, right) => {
      if (right.start !== left.start) {
        return right.start - left.start;
      }

      return right.end - left.end;
    });

  let result = text;
  let nextAllowedStart = text.length + 1;

  for (const change of ordered) {
    if (change.end > nextAllowedStart) {
      continue;
    }

    if (text.slice(change.start, change.end) === change.text) {
      nextAllowedStart = change.start;
      continue;
    }

    result = result.slice(0, change.start) + change.text + result.slice(change.end);
    nextAllowedStart = change.start;
  }

  return result;
}

export function getLineStarts(text: string): number[] {
  const starts = [0];

  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      starts.push(index + 1);
    }
  }

  return starts;
}

export function getLineBounds(text: string, zeroBasedLine: number, lineStarts = getLineStarts(text)): [number, number] {
  const start = lineStarts[zeroBasedLine] ?? text.length;
  const nextStart = lineStarts[zeroBasedLine + 1] ?? text.length;
  const end = nextStart > start && text.charCodeAt(nextStart - 1) === 10 ? nextStart - 1 : nextStart;

  return [start, end];
}

export function getLineText(text: string, zeroBasedLine: number, lineStarts = getLineStarts(text)): string {
  const [start, end] = getLineBounds(text, zeroBasedLine, lineStarts);

  return text.slice(start, end);
}

export function getIndent(line: string): string {
  return line.match(/^\s*/u)?.[0] ?? '';
}

export function hasCommentMarker(text: string): boolean {
  return text.includes('//') || text.includes('/*') || text.includes('*/');
}

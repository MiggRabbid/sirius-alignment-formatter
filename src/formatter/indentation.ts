const INDENT_SIZE = 4;

export function formatIndentation(text: string): string {
  return text
    .split('\n')
    .map((line) => formatLineIndentation(line))
    .join('\n');
}

function formatLineIndentation(line: string): string {
  const match = line.match(/^[\t ]+/u);

  if (!match) {
    return line;
  }

  const indent = match[0];
  const indentWidth = getIndentWidth(indent);
  const normalizedWidth = Math.ceil(indentWidth / INDENT_SIZE) * INDENT_SIZE;
  const normalizedIndent = ' '.repeat(normalizedWidth);

  return normalizedIndent === indent ? line : normalizedIndent + line.slice(indent.length);
}

function getIndentWidth(indent: string): number {
  let width = 0;

  for (const char of indent) {
    if (char === '\t') {
      const remainder = width % INDENT_SIZE;

      width += remainder === 0 ? INDENT_SIZE : INDENT_SIZE - remainder;
      continue;
    }

    width += 1;
  }

  return width;
}

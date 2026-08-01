export const GENERATED_RESPONSE_EXAMPLES_START =
  '{/* GENERATED RESPONSE EXAMPLES START */}';
export const GENERATED_RESPONSE_EXAMPLES_END =
  '{/* GENERATED RESPONSE EXAMPLES END */}';

export function stripGeneratedResponseExamples(source: string): string {
  const start = source.indexOf(GENERATED_RESPONSE_EXAMPLES_START);
  const end = source.indexOf(GENERATED_RESPONSE_EXAMPLES_END);

  if (start === -1 && end === -1) {
    return source;
  }
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Generated response example markers are incomplete.');
  }

  return `${source.slice(0, start)}${source.slice(
    end + GENERATED_RESPONSE_EXAMPLES_END.length,
  )}`;
}

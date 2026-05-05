// Detects if a string contains a mathematical equation
export function detectEquations(text: string): string[] {
  const patterns = [
    // LaTeX style
    /\$([^$]+)\$/g,
    // Common physics equations
    /[A-Za-z]\s*=\s*[A-Za-z0-9\s\+\-\*\/\^\(\)]+/g,
    // Greek letters spelled out
    /(?:omega|alpha|beta|gamma|delta|sigma|lambda)\s*=\s*[^\.,]+/gi,
    // Derivative notation
    /d[²]?[A-Za-z]\/d[t²]+/g,
    // Vector notation
    /∇\s*[×·]\s*[A-Za-z]/g,
    // Square root
    /√\([^)]+\)/g,
  ];

  const found: string[] = [];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const eq = match[1] || match[0];
      if (eq.length > 2 && eq.length < 100) {
        found.push(eq.trim());
      }
    }
  }
  return [...new Set(found)]; // deduplicate
}

export function containsEquation(text: string): boolean {
  return detectEquations(text).length > 0;
}

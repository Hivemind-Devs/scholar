export function getSimilarityLevel(score: number): 'Low' | 'Medium' | 'High' {
  if (score >= 0.7) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}
export function getSimilarityColor(level: 'Low' | 'Medium' | 'High'): 'error' | 'warning' | 'success' {
  switch (level) {
    case 'High':
      return 'success';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'error';
  }
}
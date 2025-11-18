export function isQAMAdmin(features: string[]): boolean {
  return features.find((item) => item === 'Portal_UI_QAMAdmin') != null;
}

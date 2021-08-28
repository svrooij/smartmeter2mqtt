export default interface SolarInput {
  getCurrentProduction(): Promise<number | undefined>;
  getSolarData(): Promise<any>;
  close(): void;
}

export class RateLimit {
  constructor(
    public readonly requestsPerSecond: number,
    public readonly requestsPerMinute: number,
    public readonly burstSize: number,
  ) {}
}

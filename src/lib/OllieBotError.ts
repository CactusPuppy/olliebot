export default class OllieBotError extends Error {
  public errorCode : string;

  constructor(message : string, errorCode : string) {
    super(message);
    this.errorCode = errorCode;
  }
}

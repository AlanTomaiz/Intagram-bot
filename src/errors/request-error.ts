export default class RequestError {
  public readonly message;

  public readonly statusCode;

  constructor(message: string, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
}

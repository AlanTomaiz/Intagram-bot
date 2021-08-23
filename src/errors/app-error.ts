interface Data {
  success: boolean;
  checkpoint: boolean;
  message: string;
}

export default class AppError {
  public readonly response;

  public readonly statusCode;

  constructor(data: Data, statusCode = 400) {
    this.response = data;
    this.statusCode = statusCode;
  }
}

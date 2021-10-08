interface Data {
  success?: boolean;
  checkpoint?: boolean;
  message?: string;
  status?: string;
}

export default class AppError {
  public readonly response;

  public readonly statusCode;

  constructor(data: Data | string, statusCode = 400) {
    this.response = data;
    this.statusCode = statusCode;
  }
}

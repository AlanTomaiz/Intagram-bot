interface Data {
  success?: boolean;
  checkpoint?: boolean;
  message?: string;
  status?: string;
}

export default class AppError {
  public readonly data;

  public readonly statusCode;

  constructor(data: Data | string, statusCode = 400) {
    this.data = data;
    this.statusCode = statusCode;
  }
}

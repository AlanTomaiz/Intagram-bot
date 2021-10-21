export function makeQuery(status: string) {
  switch (status) {
    case 'USER_NOT_EXISTENT':
    case 'BANNED':
      return `UPDATE metrics SET attempts = attempts + 1, not_existent = not_existent + 1 WHERE metric_id = 2;`;

    case 'PASS_INCORRECT':
      return `UPDATE metrics SET attempts = attempts + 1, pass_incorrect = pass_incorrect + 1 WHERE metric_id = 2;`;

    case 'CHECKPOINT':
      return `UPDATE metrics SET attempts = attempts + 1, checkpoint = checkpoint + 1 WHERE metric_id = 2;`;

    case 'TWO_FACTOR':
      return `UPDATE metrics SET attempts = attempts + 1, two_factory = two_factory + 1 WHERE metric_id = 2;`;

    default:
      return ``;
  }
}

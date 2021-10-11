interface QueryData {
  _id: number;
  status: string;
}

export async function makeQuery({ _id, status }: QueryData) {
  const query = `UPDATE usuarios SET status = 3 WHERE id = ${_id};`;

  if (status === 'USER_NOT_EXISTENT') {
    return `${query} UPDATE metrics SET attempts = attempts + 1, not_existent = not_existent + 1 WHERE metric_id = 1;`;
  }

  if (status === 'PASS_INCORRECT') {
    return `${query} UPDATE metrics SET attempts = attempts + 1, pass_incorrect = pass_incorrect + 1 WHERE metric_id = 1;`;
  }

  if (status === 'CHECKPOINT') {
    return `${query} UPDATE metrics SET attempts = attempts + 1, checkpoint = checkpoint + 1 WHERE metric_id = 1;`;
  }

  return '';
}

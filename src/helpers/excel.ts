// tslint:disable-next-line: variable-name
const node_xj = require('xls-to-json');

export const getLocationsFromExcel = (sheet: string, filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    node_xj(
      {
        input: filePath,
        output: null,
        sheet: sheet,
      },
      async (err: Error, result: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

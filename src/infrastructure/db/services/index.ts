import 'server-only';

import { db } from '..';

export class DbService {
  protected static client = db;
}

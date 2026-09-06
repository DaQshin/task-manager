const { SQLOperations } = require('./db/db.js');

class APIFeatures {
  constructor(query) {
    this.query = query;
  }

  async filter() {
    const title = this.query.title;
    const done = this.query.done;
    const rows = await SQLOperations.getAll();
    return rows;
  }

  async sort() {
    const sortBy = this.query.sort || 'ASC';
    const orderBy = this.query.order || 'id';
    const rows = await SQLOperations.sort(sortBy, orderBy);
    return rows;
  }
}

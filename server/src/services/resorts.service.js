const db = require('../config/database');

class ResortsService {
  async getResorts(filters = {}) {
    const {
      country,
      state_province,
      pass_type,
      min_elevation,
      max_elevation,
      min_vertical_drop,
      min_trail_count,
      night_skiing,
      sort_by = 'name',
      sort_order = 'asc',
      page = 1,
      limit = 100,
    } = filters;

    let query = db('ski_resorts').select('*');

    if (country) {
      query = query.where('country', country);
    }

    if (state_province) {
      query = query.where('state_province', state_province);
    }

    if (pass_type) {
      query = query.where('pass_type', pass_type);
    }

    if (min_elevation) {
      query = query.where('summit_elevation_ft', '>=', min_elevation);
    }

    if (max_elevation) {
      query = query.where('summit_elevation_ft', '<=', max_elevation);
    }

    if (min_vertical_drop) {
      query = query.where('vertical_drop_ft', '>=', min_vertical_drop);
    }

    if (min_trail_count) {
      query = query.where('trail_count', '>=', min_trail_count);
    }

    if (night_skiing !== undefined) {
      query = query.where('night_skiing', night_skiing === 'true' || night_skiing === true);
    }

    const validSortColumns = [
      'name', 'summit_elevation_ft', 'vertical_drop_ft',
      'trail_count', 'skiable_acreage', 'created_at'
    ];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name';
    const sortDirection = sort_order === 'desc' ? 'desc' : 'asc';

    query = query.orderBy(sortColumn, sortDirection);

    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const resorts = await query;
    const countQuery = db('ski_resorts').count('* as total');

    const [{ total }] = await countQuery;

    return {
      resorts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchResorts(searchQuery) {
    const resorts = await db('ski_resorts')
      .select('*')
      .where('name', 'ilike', `%${searchQuery}%`)
      .orderBy('name')
      .limit(50);

    return resorts;
  }

  async getNearbyResorts({ lat, lng, radius_miles = 50 }) {
    const radiusMeters = radius_miles * 1609.34;

    const resorts = await db.raw(`
      SELECT *,
        ST_Distance(
          location,
          ST_GeographyFromText('POINT(${lng} ${lat})')
        ) / 1609.34 AS distance_miles
      FROM ski_resorts
      WHERE ST_DWithin(
        location,
        ST_GeographyFromText('POINT(${lng} ${lat})'),
        ${radiusMeters}
      )
      ORDER BY distance_miles
    `);

    return resorts.rows;
  }

  async getResortByIdOrSlug(idOrSlug) {
    const resort = isNaN(idOrSlug)
      ? await db('ski_resorts').where('slug', idOrSlug).first()
      : await db('ski_resorts').where('id', idOrSlug).first();

    if (!resort) {
      const error = new Error('Resort not found');
      error.statusCode = 404;
      throw error;
    }

    return resort;
  }

  async createResort(resortData) {
    const slug = this.generateSlug(resortData.name);

    const [resort] = await db('ski_resorts')
      .insert({ ...resortData, slug })
      .returning('*');

    return resort;
  }

  async updateResort(id, resortData) {
    if (resortData.name) {
      resortData.slug = this.generateSlug(resortData.name);
    }

    resortData.updated_at = db.fn.now();

    const [resort] = await db('ski_resorts')
      .where('id', id)
      .update(resortData)
      .returning('*');

    if (!resort) {
      const error = new Error('Resort not found');
      error.statusCode = 404;
      throw error;
    }

    return resort;
  }

  async deleteResort(id) {
    const deleted = await db('ski_resorts').where('id', id).del();

    if (!deleted) {
      const error = new Error('Resort not found');
      error.statusCode = 404;
      throw error;
    }

    return { message: 'Resort deleted successfully' };
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new ResortsService();

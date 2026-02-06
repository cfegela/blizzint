const resortsService = require('../services/resorts.service');

class ResortsController {
  async getResorts(req, res, next) {
    try {
      const result = await resortsService.getResorts(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async searchResorts(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query parameter "q" is required' });
      }
      const resorts = await resortsService.searchResorts(q);
      res.json(resorts);
    } catch (error) {
      next(error);
    }
  }

  async getNearbyResorts(req, res, next) {
    try {
      const { lat, lng, radius_miles } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }
      const resorts = await resortsService.getNearbyResorts({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_miles: radius_miles ? parseFloat(radius_miles) : 50,
      });
      res.json(resorts);
    } catch (error) {
      next(error);
    }
  }

  async getResortByIdOrSlug(req, res, next) {
    try {
      const resort = await resortsService.getResortByIdOrSlug(req.params.idOrSlug);
      res.json(resort);
    } catch (error) {
      next(error);
    }
  }

  async createResort(req, res, next) {
    try {
      const resort = await resortsService.createResort(req.body);
      res.status(201).json(resort);
    } catch (error) {
      next(error);
    }
  }

  async updateResort(req, res, next) {
    try {
      const resort = await resortsService.updateResort(req.params.id, req.body);
      res.json(resort);
    } catch (error) {
      next(error);
    }
  }

  async deleteResort(req, res, next) {
    try {
      const result = await resortsService.deleteResort(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResortsController();

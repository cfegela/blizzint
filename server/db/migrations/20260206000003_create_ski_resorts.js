exports.up = async function(knex) {
  // Create the ski_resorts table
  await knex.schema.createTable('ski_resorts', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.string('state_province', 100);
    table.string('country', 3).notNullable();
    table.string('region', 100);
    table.decimal('latitude', 10, 7).notNullable();
    table.decimal('longitude', 11, 7).notNullable();
    table.integer('summit_elevation_ft');
    table.integer('base_elevation_ft');
    table.integer('vertical_drop_ft');
    table.integer('trail_count');
    table.integer('lift_count');
    table.integer('skiable_acreage');
    table.integer('annual_snowfall_inches');
    table.integer('beginner_trails_pct');
    table.integer('intermediate_trails_pct');
    table.integer('advanced_trails_pct');
    table.integer('expert_trails_pct');
    table.boolean('night_skiing').defaultTo(false);
    table.boolean('terrain_parks').defaultTo(false);
    table.boolean('cross_country').defaultTo(false);
    table.boolean('snowmaking').defaultTo(false);
    table.string('website', 500);
    table.string('phone', 30);
    table.text('description');
    table.string('image_url', 500);
    table.string('pass_type', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('slug');
    table.index('country');
    table.index('state_province');
    table.index('pass_type');
  });

  // Add the geography column using PostGIS
  await knex.raw(`
    ALTER TABLE ski_resorts
    ADD COLUMN location GEOGRAPHY(Point, 4326)
  `);

  // Create trigger function to auto-populate location from lat/lng
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_location_from_lat_lng()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger on INSERT and UPDATE
  await knex.raw(`
    CREATE TRIGGER ski_resorts_location_trigger
    BEFORE INSERT OR UPDATE ON ski_resorts
    FOR EACH ROW
    EXECUTE FUNCTION update_location_from_lat_lng();
  `);

  // Create spatial index on location column
  await knex.raw(`
    CREATE INDEX ski_resorts_location_idx
    ON ski_resorts USING GIST (location);
  `);
};

exports.down = async function(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS ski_resorts_location_trigger ON ski_resorts');
  await knex.raw('DROP FUNCTION IF EXISTS update_location_from_lat_lng()');
  await knex.schema.dropTableIfExists('ski_resorts');
};

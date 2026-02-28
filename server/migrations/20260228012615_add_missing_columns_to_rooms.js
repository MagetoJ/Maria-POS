/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasAmenities = await knex.schema.hasColumn('rooms', 'amenities');
  const hasFloor = await knex.schema.hasColumn('rooms', 'floor');
  const hasMaxOccupancy = await knex.schema.hasColumn('rooms', 'max_occupancy');

  return knex.schema.table('rooms', table => {
    if (!hasAmenities) table.string('amenities').nullable();
    if (!hasFloor) table.integer('floor').nullable();
    if (!hasMaxOccupancy) table.integer('max_occupancy').defaultTo(2);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('rooms', table => {
    table.dropColumn('amenities');
    table.dropColumn('floor');
    table.dropColumn('max_occupancy');
  });
};

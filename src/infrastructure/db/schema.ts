import {
  customType,
  doublePrecision,
  index,
  integer,
  numeric,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Custom type for PostGIS geography
const geography = customType<{
  data: string;
  driverData: string;
  config: { type?: string; srid?: number };
}>({
  dataType(config) {
    return `geography(${config?.type || 'point'}, ${config?.srid || 4326})`;
  },
  fromDriver(value: string): string {
    return value;
  },
  toDriver(value: string): string {
    return value;
  },
});

// GTFS Routes table
export const gtfsRoutes = pgTable('gtfs_routes', {
  routeId: text('route_id').primaryKey(),
  routeShortName: text('route_short_name'),
  routeLongName: text('route_long_name'),
  routeType: integer('route_type'),
  routeColor: text('route_color'),
  routeTextColor: text('route_text_color'),
  mode: text('mode'),
});

// GTFS Stops table
export const gtfsStops = pgTable(
  'gtfs_stops',
  {
    stopId: text('stop_id').primaryKey(),
    stopName: text('stop_name').notNull(),
    stopLat: doublePrecision('stop_lat').notNull(),
    stopLon: doublePrecision('stop_lon').notNull(),
    geom: geography('geom', { type: 'point', srid: 4326 }),
  },
  (table) => ({
    geomIdx: index('gtfs_stops_geom_idx').on(table.geom),
  }),
);

// GTFS Trips table
export const gtfsTrips = pgTable(
  'gtfs_trips',
  {
    tripId: text('trip_id').primaryKey(),
    routeId: text('route_id').references(() => gtfsRoutes.routeId, { onDelete: 'cascade' }),
    serviceId: text('service_id'),
    shapeId: text('shape_id'),
    directionId: integer('direction_id'),
    mode: text('mode'),
  },
  (table) => ({
    routeIdx: index('gtfs_trips_route_idx').on(table.routeId),
    shapeIdx: index('gtfs_trips_shape_idx').on(table.shapeId),
  }),
);

// GTFS Stop Times table
export const gtfsStopTimes = pgTable(
  'gtfs_stop_times',
  {
    tripId: text('trip_id').references(() => gtfsTrips.tripId, { onDelete: 'cascade' }),
    stopId: text('stop_id').references(() => gtfsStops.stopId, { onDelete: 'cascade' }),
    stopSequence: integer('stop_sequence'),
    arrivalTime: text('arrival_time'),
    departureTime: text('departure_time'),
  },
  (table) => ({
    pk: primaryKey(table.tripId, table.stopSequence),
    stopIdx: index('gtfs_stop_times_stop_idx').on(table.stopId),
  }),
);

// GTFS Shapes table
export const gtfsShapes = pgTable(
  'gtfs_shapes',
  {
    shapeId: text('shape_id'),
    shapePtLat: doublePrecision('shape_pt_lat').notNull(),
    shapePtLon: doublePrecision('shape_pt_lon').notNull(),
    shapePtSequence: integer('shape_pt_sequence').notNull(),
  },
  (table) => ({
    pk: primaryKey(table.shapeId, table.shapePtSequence),
  }),
);

// GTFS Shapes Lines view
export const gtfsShapesLines = pgView('gtfs_shapes_lines', {
  routeId: text('route_id'),
  mode: text('mode'),
  shapeId: text('shape_id'),
  geojson: text('geojson'),
});

// Community Alerts table
export const communityAlerts = pgTable(
  'community_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id'),
    routeId: text('route_id'),
    title: text('title').notNull(),
    body: text('body'),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    geom: geography('geom', { type: 'point', srid: 4326 }),
    credibility: numeric('credibility').default('0.5'),
    upvotes: integer('upvotes').default(0),
    downvotes: integer('downvotes').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    geomIdx: index('community_alerts_geom_idx').on(table.geom),
  }),
);

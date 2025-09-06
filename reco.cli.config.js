require('dotenv').config();

const { Product } = require('./dist/domain/entities/product.aggregate-root');
const {
  ProductSchemaFactory,
} = require('./dist/infrastructure/schemas/product.schema');
const { productsTransformers } = require('./dist/products.transformers');

function toComparableState(aggregate) {
  return {
    _id: aggregate.id,
    name: aggregate.name,
    price: aggregate.price,
    stock: aggregate.stock,
    status: aggregate.status,
  };
}

module.exports = {
  mongo: {
    uri: process.env.MONGODB_CONNECTION_STRING,
  },
  eventStore: {
    connectionString: process.env.EVENTSTORE_CONNECTION_STRING,
    endpoint: {
      address: process.env.EVENTSTORE_HOSTNAME || 'localhost',
      port: Number(process.env.EVENTSTORE_PORT) || 2113,
    },
    channelCredentials: { insecure: true },
    defaultUserCredentials: {
      username: process.env.EVENTSTORE_USERNAME || 'admin',
      password: process.env.EVENTSTORE_PASSWORD || 'changeit',
    },
    transformers: { ...productsTransformers },
    subscriptions: {
      corr_products: '$ce-corr_products',
    },
  },
  features: [
    {
      name: 'productschemas',
      schema: ProductSchemaFactory,
      path: 'products',
      toComparableState,
      aggregateRoot: Product,
      aggregateName: 'corr_products',
      eventTransformers: productsTransformers,
    },
  ],
};

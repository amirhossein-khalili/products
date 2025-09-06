# Configuration

This file explains the configuration for the CLI tool. The configuration is stored in the `reco.cli.config.js` file in the root directory of the project.

## `reco.cli.config.js`

The `reco.cli.config.js` file must be present in the root directory of the project. It should have the following structure:

```javascript
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
```

### Explanation

*   `require('dotenv').config();`: This line loads the environment variables from a `.env` file into `process.env`.
*   **`mongo`**: This object contains the configuration for the MongoDB connection.
    *   `uri`: The connection string for the MongoDB database. It is loaded from the `MONGODB_CONNECTION_STRING` environment variable.
*   **`eventStore`**: This object contains the configuration for the EventStoreDB connection.
    *   `connectionString`: The connection string for the EventStoreDB. It is loaded from the `EVENTSTORE_CONNECTION_STRING` environment variable.
    *   `endpoint`: The endpoint for the EventStoreDB.
        *   `address`: The hostname of the EventStoreDB. It defaults to `localhost`.
        *   `port`: The port of the EventStoreDB. It defaults to `2113`.
    *   `channelCredentials`: The channel credentials for the EventStoreDB connection.
    *   `defaultUserCredentials`: The default user credentials for the EventStoreDB.
        *   `username`: The username for the EventStoreDB. It defaults to `admin`.
        *   `password`: The password for the EventStoreDB. It defaults to `changeit`.
    *   `transformers`: The transformers for the events.
    *   `subscriptions`: The subscriptions for the events.
*   **`features`**: This is an array of features that can be reconciled by the CLI tool.
    *   `name`: The name of the feature.
    *   `schema`: The schema factory for the feature.
    *   `path`: The path for the feature.
    *   `toComparableState`: A function that converts an aggregate to a comparable state.
    *   `aggregateRoot`: The aggregate root for the feature.
    *   `aggregateName`: The name of the aggregate in the event store.
    *   `eventTransformers`: The event transformers for the feature.

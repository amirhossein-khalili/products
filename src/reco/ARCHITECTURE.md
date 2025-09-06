# Reco Module Architecture

The `reco` module is designed using a layered architecture, which separates concerns and improves maintainability. The module is divided into four main layers: `domain`, `application`, `infrastructure`, and `interfaces`.

## Layers

### 1. Domain Layer

The `domain` layer is the core of the module, containing the business logic and domain entities. It is independent of any other layer and is responsible for representing the concepts of the business, information about the business situation, and business rules.

- **Aggregates:** These are clusters of associated objects that we treat as a single unit for the purpose of data changes. For example, `ComparisonResult` is an aggregate that represents the result of a comparison.
- **Value Objects:** These are objects that represent a descriptive aspect of the domain with no conceptual identity. `Discrepancy` is a value object that represents a single difference between two states.
- **Repositories (Interfaces):** These are interfaces that define the contract for data access. The `ReadRepository` interface defines the methods for querying the read model.
- **Domain Services (Interfaces):** These are interfaces that define the contract for domain-specific services, such as `AggregateReconstructor` and `StateComparator`.

### 2. Application Layer

The `application` layer is responsible for orchestrating the domain logic. It contains the application services and use cases that are called by the `interfaces` layer. This layer acts as a bridge between the `domain` layer and the `infrastructure` layer.

- **Services:** The `RecoService` is the main application service that orchestrates the reconciliation process. It uses the domain services and repositories to perform its tasks. Other services like `RecoRegistry` and `CliReportGenerator` handle module registration and report generation.
- **DTOs (Data Transfer Objects):** These are objects that carry data between processes. The DTOs in this layer are used for configuring the module, such as `RecoModuleOptions`.
- **Ports:** These are interfaces that define the contract for the application services. `RecoServicePort` is the port for the `RecoService`.

### 3. Infrastructure Layer

The `infrastructure` layer contains the implementation details of the application. It provides the implementation for the interfaces defined in the `domain` and `application` layers.

- **Persistence:** This includes the implementation of the repositories. The `ReconciliationRepository` is a Mongoose-based implementation of the `ReadRepository` interface.
- **Services:** This includes the implementation of the domain services. The `StateComparator` service uses the `deep-diff` library to compare states.

### 4. Interfaces Layer

The `interfaces` layer is the entry point to the module. It exposes the application's functionality to the outside world.

- **Controllers:** The `RecoController` exposes the `RecoService` as a REST API.
- **DTOs (Data Transfer Objects):** These are objects that define the shape of the data for the API endpoints. For example, `BatchIdsBodyDto` and `SingleIdBodyDto` are used for the request bodies of the API endpoints.

## Flow of Control

1.  A request comes into the `interfaces` layer (e.g., an HTTP request to the `RecoController`).
2.  The `interfaces` layer calls an application service in the `application` layer.
3.  The `application` layer orchestrates the domain logic by calling domain services and repositories.
4.  The `infrastructure` layer provides the concrete implementation for the services and repositories used by the `application` layer.
5.  The result is returned up through the layers to the `interfaces` layer, which sends the response to the client.

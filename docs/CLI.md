# CLI Tool

This project includes a CLI tool for reconciliation.

## How to use

To use the CLI tool, you need to have the `cli` script in your `package.json` file:

```json
"scripts": {
  "cli": "RECO_CLI_CONFIG=$PWD/reco.cli.config.js ts-node -r tsconfig-paths/register src/reco/src/application/cli/main.cli.ts"
}
```

You can then run the CLI tool with the following commands:

```bash
# Using npm
npm run cli reconciliation

# Using yarn
yarn cli reconciliation
```

You can also specify the feature name and action:

```bash
# Using npm
npm run cli reconciliation -- --name=productschemas --action=fix

# Using yarn
yarn cli reconciliation --name=productschemas --action=fix
```

### Arguments

*   `--name`: The name of the feature to reconcile. This should match one of the features defined in the `reco.cli.config.js` file.
*   `--action`: The action to perform. It can be `fix` or other actions supported by the tool.

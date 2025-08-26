// import { Project, SyntaxKind } from 'ts-morph';

// const project = new Project({
//   tsConfigFilePath: 'tsconfig.json',
// });

// // Get all source files
// const sourceFiles = project.getSourceFiles();

// for (const sourceFile of sourceFiles) {
//   // Check if file contains 'RecoModule.forFeature'
//   if (!sourceFile.getText().includes('RecoModule.forFeature')) continue;

//   let recoModuleLocalName = 'RecoModule';
//   const imports = sourceFile.getImportDeclarations();

//   // Find RecoModule import and its local name
//   for (const imp of imports) {
//     const moduleSpecifier = imp.getModuleSpecifierValue();
//     if (!moduleSpecifier.includes('reco')) continue;

//     // Check named imports
//     const namedImports = imp.getNamedImports();
//     for (const namedImport of namedImports) {
//       if (namedImport.getName() === 'RecoModule') {
//         recoModuleLocalName =
//           namedImport.getAliasNode()?.getText() || 'RecoModule';
//         break;
//       }
//     }

//     // Check default import
//     const defaultImport = imp.getDefaultImport();
//     if (defaultImport?.getText() === 'RecoModule') {
//       recoModuleLocalName = defaultImport.getText();
//     }
//   }

//   // Find all call expressions
//   const callExpressions = sourceFile.getDescendantsOfKind(
//     SyntaxKind.CallExpression,
//   );
//   for (const callExpr of callExpressions) {
//     const expression = callExpr.getExpression();
//     if (expression.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

//     const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);
//     if (!propAccess) continue;

//     const leftSide = propAccess.getExpression().getText();
//     const methodName = propAccess.getName();

//     if (leftSide === recoModuleLocalName && methodName === 'forFeature') {
//       const args = callExpr.getArguments();
//       if (args.length === 0) continue;

//       const arg = args[0];
//       let moduleName = 'Unknown';

//       // Try to extract module name from argument
//       if (arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
//         const obj = arg.asKind(SyntaxKind.ObjectLiteralExpression);
//         const nameProperty = obj?.getProperty('name');
//         if (nameProperty?.getKind() === SyntaxKind.PropertyAssignment) {
//           const initializer = nameProperty
//             .asKind(SyntaxKind.PropertyAssignment)
//             ?.getInitializer();
//           if (initializer?.getKind() === SyntaxKind.StringLiteral) {
//             moduleName = initializer.getText();
//           }
//         }
//       }

//       console.log(`Found in: ${sourceFile.getFilePath()}`);
//       console.log(`  Module Name: ${moduleName}\n`);
//     }
//   }
// }
import { Project, SyntaxKind } from 'ts-morph';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

interface RecoModuleInfo {
  filePath: string;
  moduleName: string;
  path: string;
}

async function findRecoModules(): Promise<RecoModuleInfo[]> {
  const sourceFiles = project.getSourceFiles();
  const modules: RecoModuleInfo[] = [];

  for (const sourceFile of sourceFiles) {
    if (!sourceFile.getText().includes('RecoModule.forFeature')) continue;

    let recoModuleLocalName = 'RecoModule';
    const imports = sourceFile.getImportDeclarations();

    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      if (!moduleSpecifier.includes('reco')) continue;

      const namedImports = imp.getNamedImports();
      for (const namedImport of namedImports) {
        if (namedImport.getName() === 'RecoModule') {
          recoModuleLocalName =
            namedImport.getAliasNode()?.getText() || 'RecoModule';
          break;
        }
      }

      const defaultImport = imp.getDefaultImport();
      if (defaultImport?.getText() === 'RecoModule') {
        recoModuleLocalName = defaultImport.getText();
      }
    }

    const callExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression,
    );
    for (const callExpr of callExpressions) {
      const expression = callExpr.getExpression();
      if (expression.getKind() !== SyntaxKind.PropertyAccessExpression)
        continue;

      const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);
      if (!propAccess) continue;

      const leftSide = propAccess.getExpression().getText();
      const methodName = propAccess.getName();

      if (leftSide === recoModuleLocalName && methodName === 'forFeature') {
        const args = callExpr.getArguments();
        if (args.length === 0) continue;

        const arg = args[0];
        let moduleName = 'Unknown';
        let path = 'unknown';

        if (arg.getKind() === SyntaxKind.ObjectLiteralExpression) {
          const obj = arg.asKind(SyntaxKind.ObjectLiteralExpression);

          // Extract module name
          const nameProperty = obj?.getProperty('name');
          if (nameProperty?.getKind() === SyntaxKind.PropertyAssignment) {
            const initializer = nameProperty
              .asKind(SyntaxKind.PropertyAssignment)
              ?.getInitializer();
            if (initializer?.getKind() === SyntaxKind.StringLiteral) {
              moduleName = initializer.getText().replace(/['"]/g, '');
            }
          }

          // Extract path
          const pathProperty = obj?.getProperty('path');
          if (pathProperty?.getKind() === SyntaxKind.PropertyAssignment) {
            const pathInitializer = pathProperty
              .asKind(SyntaxKind.PropertyAssignment)
              ?.getInitializer();
            if (pathInitializer?.getKind() === SyntaxKind.StringLiteral) {
              path = pathInitializer.getText().replace(/['"]/g, '');
            }
          }
        }

        modules.push({
          filePath: sourceFile.getFilePath(),
          moduleName,
          path,
        });
      }
    }
  }

  return modules;
}

async function executeRecoAction(
  moduleName: string,
  action: string,
  options: any,
) {
  try {
    // Find the module
    const modules = await findRecoModules();
    const targetModule = modules.find((m) => m.moduleName === moduleName);

    if (!targetModule) {
      console.error(`Module '${moduleName}' not found. Available modules:`);
      modules.forEach((m) => console.log(`  - ${m.moduleName}`));
      process.exit(1);
    }

    console.log(`Executing action '${action}' on module '${moduleName}'`);
    console.log(
      `Filters: ${options.filter ? JSON.stringify(options.filter) : 'None'}`,
    );
    console.log(
      `Fields: ${options.fields ? options.fields.join(', ') : 'All fields'}`,
    );

    // In a real implementation, you would bootstrap the NestJS application
    // and execute the appropriate reconciliation action here

    console.log(
      `Action '${action}' would be executed on module '${moduleName}'`,
    );
    console.log(
      'Note: Actual execution requires bootstrapping the NestJS application',
    );
  } catch (error) {
    console.error('Error executing action:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('name', {
    alias: 'n',
    type: 'string',
    description: 'Module name to check',
  })
  .option('action', {
    alias: 'a',
    type: 'string',
    description: 'Action to perform: check, fix, all, all/fix',
  })
  .option('id', {
    type: 'string',
    description: 'ID for single check/fix',
  })
  .option('filter', {
    alias: 'f',
    type: 'string',
    description: 'Filter as JSON string',
  })
  .option('fields', {
    type: 'string',
    description: 'Comma-separated list of fields',
  })
  .parseSync();

// Main execution
async function main() {
  if (!argv.name) {
    // Just list modules if no name provided
    const modules = await findRecoModules();
    console.log('Modules using RecoModule.forFeature:');
    modules.forEach((module) => {
      console.log(`Found in: ${module.filePath}`);
      console.log(`  Module Name: '${module.moduleName}'`);
      console.log(`  Path: '${module.path}'`);
      console.log();
    });
  } else {
    // Execute action on specific module
    const options = {
      filter: argv.filter ? JSON.parse(argv.filter) : undefined,
      fields: argv.fields ? argv.fields.split(',') : undefined,
      id: argv.id,
    };

    await executeRecoAction(argv.name, argv.action || 'check', options);
  }
}

main().catch(console.error);

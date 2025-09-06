import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { ReconciliationServicePort } from '../ports/reconciliation-service.port';

/**
 * Options for generating a report.
 */
interface ReportGenerationOptions {
  recoService: ReconciliationServicePort;
  action: 'check' | 'fix';
  name: string; // The name of the reco module
  ids?: string[];
  filter?: Record<string, any>;
  fields?: string[];
}

/**
 * A service that generates reports in Excel format for the CLI.
 */
@Injectable()
export class CliReportGenerator {
  private readonly logger = new Logger(CliReportGenerator.name);

  /**
   * Generates a report based on the provided options.
   * @param options The options for generating the report.
   */
  public async generateReport(options: ReportGenerationOptions): Promise<void> {
    this.logger.log(
      `Starting report generation for module: "${options.name}" with action: "${options.action}"`,
    );

    const { recoService, action, ids, filter, fields } = options;
    let results: any[];

    try {
      results = await this.fetchResults(
        recoService,
        action,
        ids,
        filter,
        fields,
      );
    } catch (error) {
      this.logger.error(
        `An error occurred while fetching data from RecoService: ${error.message}`,
        error.stack,
      );
      return;
    }

    if (!results || results.length === 0) {
      this.logger.warn(
        'No results were returned from the service. The report will be empty.',
      );
      return;
    }

    this.saveToExcel(results, options);
  }

  /**
   * Fetches the results from the reconciliation service based on the provided options.
   */
  private async fetchResults(
    recoService: ReconciliationServicePort,
    action: 'check' | 'fix',
    ids?: string[],
    filter?: Record<string, any>,
    fields?: string[],
  ): Promise<any[]> {
    if (action === 'check') {
      if (ids?.length === 1) {
        return [await recoService.checkSingleId(ids[0], fields)];
      } else if (ids && ids.length > 1) {
        return recoService.checkBatchIds(ids, fields);
      } else {
        return recoService.checkAll(filter, fields);
      }
    } else if (action === 'fix') {
      if (ids?.length === 1) {
        return [await recoService.reconcileById(ids[0], fields)];
      } else if (ids && ids.length > 1) {
        return recoService.reconcileBatchByIds(ids, fields);
      } else {
        return recoService.reconcileAll(filter, fields);
      }
    } else {
      throw new Error(`Invalid action: ${action}. Must be "check" or "fix".`);
    }
  }

  /**
   * Saves the data to an Excel file.
   * @param data The data to save.
   * @param options The report generation options.
   */
  private saveToExcel(data: any[], options: ReportGenerationOptions): void {
    const flattenedData = this.flattenResults(data, options.action);

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reco Report');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reconciliation-report-${options.name}-${options.action}-${timestamp}.xlsx`;

    const outputDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const fullPath = path.join(outputDir, filename);

    try {
      XLSX.writeFile(workbook, fullPath);
      this.logger.log(
        `✅ Report successfully generated and saved to: ${fullPath}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to write Excel file: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Flattens the results for a clean Excel report.
   * @param results The results to flatten.
   * @param action The action that was performed.
   * @returns The flattened results.
   */
  private flattenResults(results: any[], action: 'check' | 'fix'): any[] {
    if (action === 'fix') {
      return results.map((res) => ({
        ID: res?._id || res?.id || 'N/A',
        Status: res?.error ? 'Error' : 'Reconciled',
        Details: res?.error || `Successfully updated document.`,
      }));
    }

    const flattened = [];
    for (const result of results) {
      if (result.error) {
        flattened.push({
          ID: result.id,
          'Is Match': 'Error',
          'Discrepancy Field': 'N/A',
          'Expected Value': 'N/A',
          'Actual Value': 'N/A',
          Details: result.error,
        });
        continue;
      }

      if (result.comparison.isMatch) {
        flattened.push({
          ID: result.id,
          'Is Match': 'Yes',
          'Discrepancy Field': '',
          'Expected Value': '',
          'Actual Value': '',
          Details: result.comparison.details,
        });
      } else {
        for (const discrepancy of result.comparison.discrepancies) {
          flattened.push({
            ID: result.id,
            'Is Match': 'No',
            'Discrepancy Field': discrepancy.field,
            'Expected Value': JSON.stringify(discrepancy.expected),
            'Actual Value': JSON.stringify(discrepancy.actual),
            Details: result.comparison.details,
          });
        }
      }
    }
    return flattened;
  }
}

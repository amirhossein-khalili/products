import { Injectable, Logger } from '@nestjs/common';
import { RecoServicePort } from '../application';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Define a type for the options passed from the command
interface ReportGenerationOptions {
  recoService: RecoServicePort;
  action: 'check' | 'fix';
  name: string; // The name of the reco module
  ids?: string[];
  filter?: Record<string, any>;
  fields?: string[];
}

@Injectable()
export class CliReportGenerator {
  private readonly logger = new Logger(CliReportGenerator.name);

  public async generateReport(options: ReportGenerationOptions): Promise<void> {
    this.logger.log(
      `Starting report generation for module: "${options.name}" with action: "${options.action}"`,
    );

    // 1. --- The "Config Builder" Logic ---
    // Decide which service method to call based on the provided options
    let results: any[];
    const { recoService, action, ids, filter, fields } = options;

    try {
      if (action === 'check') {
        if (ids?.length === 1) {
          results = [await recoService.checkSingleId(ids[0], fields)];
        } else if (ids && ids.length > 1) {
          results = await recoService.checkBatchIds(ids, fields);
        } else {
          results = await recoService.checkAll(filter, fields);
        }
      } else if (action === 'fix') {
        if (ids?.length === 1) {
          results = [await recoService.reconcileById(ids[0], fields)];
        } else if (ids && ids.length > 1) {
          results = await recoService.reconcileBatchByIds(ids, fields);
        } else {
          results = await recoService.reconcileAll(filter, fields);
        }
      } else {
        this.logger.error(
          `Invalid action: ${action}. Must be "check" or "fix".`,
        );
        return;
      }
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

    // 2. --- Save the results to an Excel file ---
    this.saveToExcel(results, options);
  }

  private saveToExcel(data: any[], options: ReportGenerationOptions): void {
    // Flatten the data for a clean Excel report
    const flattenedData = this.flattenResults(data, options.action);

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reco Report');

    // Create a dynamic filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `reco-report-${options.name}-${options.action}-${timestamp}.xlsx`;

    // Ensure the output directory exists
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

  private flattenResults(results: any[], action: 'check' | 'fix'): any[] {
    if (action === 'fix') {
      // Fix actions return the updated document or an error
      return results.map((res) => ({
        ID: res?._id || res?.id || 'N/A',
        Status: res?.error ? 'Error' : 'Reconciled',
        Details: res?.error || `Successfully updated document.`,
      }));
    }

    // Check actions return a complex comparison result
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
        // If there are discrepancies, create a row for each one
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

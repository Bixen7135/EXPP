import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'export-worker' });
});

// Export to PDF endpoint
app.post('/export/pdf', async (c) => {
  try {
    const body = await c.req.json();
    const { content, format = 'markdown' } = body;

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Generate temporary file names
    const inputFile = join(tmpdir(), `${randomUUID()}.md`);
    const outputFile = join(tmpdir(), `${randomUUID()}.pdf`);

    try {
      // Write content to temporary file
      await writeFile(inputFile, content, 'utf-8');

      // Convert to PDF using pandoc
      const pandocCmd = [
        'pandoc',
        inputFile,
        '-o', outputFile,
        '--pdf-engine=xelatex',
        '--variable', 'geometry:margin=1in',
        '--variable', 'fontsize=12pt',
      ].join(' ');

      await execAsync(pandocCmd, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Read the generated PDF
      const pdfBuffer = await Bun.file(outputFile).arrayBuffer();

      // Clean up temporary files
      await Promise.all([
        unlink(inputFile).catch(() => {}),
        unlink(outputFile).catch(() => {}),
      ]);

      // Return PDF as response
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="export.pdf"',
        },
      });
    } catch (error) {
      // Clean up on error
      await Promise.all([
        unlink(inputFile).catch(() => {}),
        unlink(outputFile).catch(() => {}),
      ]);
      throw error;
    }
  } catch (error) {
    console.error('Export error:', error);
    return c.json({
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Export to DOCX endpoint (placeholder for future implementation)
app.post('/export/docx', async (c) => {
  return c.json({ error: 'DOCX export not yet implemented' }, 501);
});

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`Export worker starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};

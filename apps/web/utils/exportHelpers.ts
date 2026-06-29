/**
 * Triggers a native browser file download for a plain text (.txt) file.
 */
export function downloadAsTXT(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Renders a clean print preview of the document and opens the browser's PDF export dialog.
 */
export function downloadAsPDF(title: string, content: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export PDFs.");
    return;
  }

  // Create clean printable HTML document styled with newsreader editorial serif
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap');
          body {
            font-family: 'Newsreader', serif;
            color: #111827;
            line-height: 1.6;
            margin: 40px auto;
            max-width: 650px;
            padding: 20px;
          }
          h1 {
            font-size: 2.2em;
            font-weight: 600;
            margin-bottom: 5px;
            color: #09090b;
          }
          .meta {
            font-size: 0.8em;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            font-family: -apple-system, sans-serif;
          }
          .content {
            font-size: 1.25em;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Exported from Verra Studio on ${new Date().toLocaleDateString()}</div>
        <div class="content">${content}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

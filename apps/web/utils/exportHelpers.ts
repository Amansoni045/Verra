export const htmlToMarkdown = (html: string): string => {
  let md = html;
  
  // Replace headings
  md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
  
  // Replace paragraph endings
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<p>/gi, '');
  
  // Replace strong and bold
  md = md.replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, '**$2**');
  
  // Replace emphasis and italics
  md = md.replace(/<(em|i)>(.*?)<\/(em|i)>/gi, '*$2*');
  
  // Replace underline
  md = md.replace(/<u>(.*?)<\/u>/gi, '_$2_');
  
  // Replace linebreaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip any other html tags
  md = md.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  md = md.replace(/&nbsp;/g, ' ')
         .replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>')
         .replace(/&amp;/g, '&')
         .replace(/&quot;/g, '"');
         
  return md.trim();
};

export const htmlToPlainText = (html: string): string => {
  let txt = html;
  txt = txt.replace(/<\/p>/gi, '\n\n');
  txt = txt.replace(/<br\s*\/?>/gi, '\n');
  txt = txt.replace(/<[^>]*>/g, '');
  txt = txt.replace(/&nbsp;/g, ' ')
           .replace(/&lt;/g, '<')
           .replace(/&gt;/g, '>')
           .replace(/&amp;/g, '&')
           .replace(/&quot;/g, '"');
  return txt.trim();
};

export const triggerDownload = (filename: string, text: string, mimeType: string) => {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportDocument = (title: string, contentHtml: string, format: 'markdown' | 'txt' | 'pdf') => {
  const safeTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'untitled_draft';
  
  if (format === 'markdown') {
    const mdContent = htmlToMarkdown(contentHtml);
    triggerDownload(`${safeTitle}.md`, mdContent, 'text/markdown;charset=utf-8;');
  } else if (format === 'txt') {
    const txtContent = htmlToPlainText(contentHtml);
    triggerDownload(`${safeTitle}.txt`, txtContent, 'text/plain;charset=utf-8;');
  } else if (format === 'pdf') {
    // Print window triggers native PDF printing
    window.print();
  }
};

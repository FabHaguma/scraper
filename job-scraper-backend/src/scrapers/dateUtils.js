export function parseDateString(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return null;
  const str = dateStr.trim();

  // Try parsing things like "4 Days Ago" to today minus 4 days
  const relativeMatch = str.match(/(\d+)\s+days?\s+ago/i);
  if (relativeMatch) {
    return new Date(Date.now() - parseInt(relativeMatch[1], 10) * 24 * 60 * 60 * 1000);
  }
  if (/today/i.test(str)) return new Date();
  if (/yesterday/i.test(str)) return new Date(Date.now() - 24 * 60 * 60 * 1000);

  // dd-mm-yyyy or dd/mm/yyyy
  const ddmmyyyy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (ddmmyyyy) {
    return new Date(
      parseInt(ddmmyyyy[3], 10),
      parseInt(ddmmyyyy[2], 10) - 1,
      parseInt(ddmmyyyy[1], 10)
    );
  }
  
  // yyyy-mm-dd
  const yyyymmdd = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (yyyymmdd) {
    return new Date(
      parseInt(yyyymmdd[1], 10),
      parseInt(yyyymmdd[2], 10) - 1,
      parseInt(yyyymmdd[3], 10)
    );
  }

  // Handle ISO / basic standard formats parsed by Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

export function formatPublishedDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  
  const dateObject = parseDateString(dateStr);
  if (!dateObject) return dateStr;

  const diffMs = Date.now() - dateObject.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 Day Ago";
  if (diffDays > 1) return `${diffDays} Days Ago`;
  if (diffDays < 0) return "Today"; 

  return dateStr;
}

export function formatDeadlineDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const dateObject = parseDateString(dateStr);
  if (!dateObject) return dateStr;

  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  let formatted = formatter.format(dateObject);
  return formatted.replace(/(\d{1,2}),\s+(\d{4})/, '$1 $2');
}

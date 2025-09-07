export const parseDate = (d) => {
  if (!d) 
    return null;

  if (d instanceof Date && !isNaN(d)) 
    return d;

  if (typeof d === 'number') 
    return new Date(d);

  if (typeof d === 'string') {
    const s = d.trim();
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const dt = new Date(Number(yyyy), Number(mm)-1, Number(dd));
      return isNaN(dt) ? null : dt;
    }
  }
  const ts = Date.parse(d);
  return Number.isNaN(ts) ? null : new Date(ts);
};

export const isOverdue = (dateLike) => {
  const d = parseDate(dateLike);
  if (!d) 
    return false;

  const today0 = new Date(); today0.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return d < today0;
};

export const formatShort = (dateLike) => {
  const d = parseDate(dateLike);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
};

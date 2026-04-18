/**
 * Get start and end of a given day
 */
const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get start and end of a given month
 */
const getMonthRange = (year, month) => {
  // month is 0-indexed (0 = January)
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Validate UUID format (v4)
 */
const isValidUUID = (uuid) => {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

module.exports = {
  getDayRange,
  getMonthRange,
  isValidUUID,
};